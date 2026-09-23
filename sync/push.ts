import NetInfo from '@react-native-community/netinfo';
import { normalizeConnectivityState } from '@/contexts/ConnectivityContext';
import { getDb } from '@/db';
import { getSyncValue } from '@/db/syncState';
import {
  crisisRepository as remoteCrisisRepository,
  type FasePayload,
} from '@/repositories/remote/crisisRepository';
import { dailyRecordRepository as remoteDailyRecordRepository } from '@/repositories/remote/dailyRecordRepository';
import { userRepository } from '@/repositories/remote/userRepository';
import type { HumorId } from '@/repositories/types';
import { notificarDadosLocais } from './notify';

/**
 * Envio da fila para o servidor. Issue #50.
 *
 * A FILA SAO AS LINHAS COM `synced = 0`. Nao existe tabela de outbox: a coluna ja existe desde
 * a #46, a replicacao da #49 ja protege essas linhas, e uma outbox guardaria o payload em
 * paralelo com a linha real, podendo divergir. Sem estado duplicado, nao ha divergencia.
 *
 * Falha de envio nunca perde o registro: a linha continua com `synced = 0` e ganha contagem de
 * tentativa, horario e ultimo erro. Essas tres colunas existem so no aparelho e sao o que a
 * #51 vai ler para avisar que algo falha ha dias.
 */

/**
 * Recuo entre tentativas, por numero de tentativas ja feitas.
 *
 * Sem isso, uma linha que falha por motivo permanente — validacao, ou RLS recusando — seria
 * reenviada em toda sincronizacao, gastando bateria e rede sem chance de sucesso. Passado o
 * teto, o envio automatico desiste e so a tentativa manual da #51 volta a tentar.
 */
const RECUO_MINUTOS = [0, 1, 5, 15, 60, 360];
const TETO_DE_TENTATIVAS = RECUO_MINUTOS.length;

function podeTentar(tentativas: number, ultimaTentativaEm: string | null): boolean {
  if (tentativas === 0) return true;
  if (tentativas >= TETO_DE_TENTATIVAS) return false;
  if (!ultimaTentativaEm) return true;

  const esperaMs = RECUO_MINUTOS[tentativas] * 60 * 1000;
  return Date.now() - new Date(ultimaTentativaEm).getTime() >= esperaMs;
}

function parseArray(texto: string | null): string[] {
  if (!texto) return [];
  try {
    const valor = JSON.parse(texto);
    return Array.isArray(valor) ? (valor as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * Mensagem de erro sem conteudo clinico.
 *
 * O erro do servidor pode citar valores da linha que falhou, e essa mensagem fica gravada no
 * banco local e vai aparecer na interface pela #51. Guardar o texto inteiro levaria dado de
 * paciente para um campo de diagnostico.
 */
function mensagemCurta(erro: unknown): string {
  const texto = erro instanceof Error ? erro.message : String(erro);
  return texto.slice(0, 120);
}

type PendenteCrise = {
  id: string;
  inicio_crise: string | null;
  fim_crise: string | null;
  updated_at: string;
  tentativas: number;
  ultima_tentativa_em: string | null;
};

type PendenteFase = {
  id: string;
  crise_id: string;
  intensidade_dor: number | null;
  regiao_dor: string | null;
  lado: string | null;
  nivel_incapacidade: string | null;
  resumo: string | null;
  sintomas: string;
  medicamentos: string;
  medicamentos_livres: string;
  fatores: string;
  updated_at: string;
};

type PendenteRegistro = {
  id: string;
  data: string;
  relato: string | null;
  horas_sono: number | null;
  ml_agua: number | null;
  humor: string | null;
  updated_at: string;
  tentativas: number;
  ultima_tentativa_em: string | null;
};

export type PushResult = {
  enviados: number;
  pendentes: number;
  /** Verdadeiro quando nada podia ser enviado porque o dono da replica nao e o da sessao. */
  donoDivergente?: boolean;
};

export async function pushToServer(): Promise<PushResult> {
  const db = await getDb();

  // Sai antes de tentar quando a rede esta comprovadamente ausente. Sem isso, salvar uma
  // crise em modo aviao esperaria o tempo de espera da requisicao antes de mostrar a tela de
  // sucesso — justo na crise, que e quando a pessoa menos pode esperar.
  //
  // A condicao e `isOffline`, nao `!isOnline`: enquanto a conectividade esta sendo
  // determinada vale a pena tentar. A normalizacao vem da trilha de sessao, para nao existir
  // uma segunda definicao de "online" no projeto.
  const rede = normalizeConnectivityState(await NetInfo.fetch());
  if (rede.isOffline) return { enviados: 0, pendentes: await contarPendentes() };

  const usuarioId = await userRepository.currentUsuarioId();
  if (usuarioId === null) return { enviados: 0, pendentes: await contarPendentes() };

  // O dono da replica tem que ser o da sessao. Se divergir, nao se tenta enviar: a politica
  // de RLS recusaria e a linha entraria em loop de 403 com o recuo escondendo o problema. A
  // replicacao e que trata a divergencia, movendo o nao enviado para a quarentena.
  const dono = await getSyncValue('owner', db);
  if (dono !== null && dono !== String(usuarioId)) {
    return { enviados: 0, pendentes: await contarPendentes(), donoDivergente: true };
  }

  let enviados = 0;

  enviados += await enviarCrises(db);
  enviados += await enviarRegistrosDiarios(db, usuarioId);

  // O contador de pendentes muda quando algo sobe, e a #51 mostra esse numero. Avisar aqui
  // tambem cobre a falha: tentativas e ultimo erro entram no estado que a interface le.
  notificarDadosLocais();

  return { enviados, pendentes: await contarPendentes() };
}

/**
 * Nao recebe usuarioId: a funcao salvar_crise resolve o dono por auth.uid() dentro do banco,
 * entao o aparelho nao informa nem tem como informar quem e.
 */
async function enviarCrises(db: Awaited<ReturnType<typeof getDb>>): Promise<number> {
  const pendentes = await db.getAllAsync<PendenteCrise>(
    `select id, inicio_crise, fim_crise, updated_at, tentativas, ultima_tentativa_em
       from crise_enxaqueca
      where synced = 0
      order by inicio_crise asc`,
  );

  let enviados = 0;

  for (const crise of pendentes) {
    if (!podeTentar(crise.tentativas, crise.ultima_tentativa_em)) continue;

    // Manda o pacote inteiro, inclusive fase que ja subiu: `on conflict (id) do nothing`
    // ignora a repetida e insere a que faltou. Enviar so as fases nao sincronizadas daria o
    // mesmo resultado com mais codigo e um caso a mais para errar.
    const fases = await db.getAllAsync<PendenteFase>(
      `select id, crise_id, intensidade_dor, regiao_dor, lado, nivel_incapacidade, resumo,
              sintomas, medicamentos, medicamentos_livres, fatores, updated_at
         from registro_crise
        where crise_id = ?`,
      [crise.id],
    );

    const payloadFases: FasePayload[] = fases.map((f) => ({
      id: f.id,
      intensidade_dor: f.intensidade_dor,
      regiao_dor: f.regiao_dor,
      lado: f.lado,
      nivel_incapacidade: f.nivel_incapacidade,
      resumo: f.resumo,
      sintomas: parseArray(f.sintomas),
      medicamentos: parseArray(f.medicamentos),
      medicamentos_livres: parseArray(f.medicamentos_livres),
      fatores: parseArray(f.fatores),
      updated_at: f.updated_at,
    }));

    try {
      await remoteCrisisRepository.enviarCrise(
        {
          id: crise.id,
          inicio_crise: crise.inicio_crise,
          fim_crise: crise.fim_crise,
          updated_at: crise.updated_at,
        },
        payloadFases,
      );

      await db.withTransactionAsync(async () => {
        await db.runAsync(
          'update crise_enxaqueca set synced = 1, ultimo_erro = null where id = ?',
          [crise.id],
        );
        await db.runAsync(
          'update registro_crise set synced = 1, ultimo_erro = null where crise_id = ?',
          [crise.id],
        );
      });
      enviados += 1;
    } catch (erro) {
      await registrarFalha(db, 'crise_enxaqueca', crise.id, erro);
    }
  }

  return enviados;
}

async function enviarRegistrosDiarios(
  db: Awaited<ReturnType<typeof getDb>>,
  usuarioId: number,
): Promise<number> {
  const pendentes = await db.getAllAsync<PendenteRegistro>(
    `select id, data, relato, horas_sono, ml_agua, humor, updated_at, tentativas,
            ultima_tentativa_em
       from registro_diario
      where synced = 0
      order by data asc`,
  );

  let enviados = 0;

  for (const registro of pendentes) {
    if (!podeTentar(registro.tentativas, registro.ultima_tentativa_em)) continue;

    try {
      await remoteDailyRecordRepository.enviarRegistroDiario(
        {
          id: registro.id,
          data: registro.data,
          relato: registro.relato,
          horasSono: registro.horas_sono,
          mlAgua: registro.ml_agua,
          humor: (registro.humor ?? null) as HumorId | null,
          createdAt: '',
          updatedAt: registro.updated_at,
        },
        usuarioId,
      );

      await db.runAsync(
        'update registro_diario set synced = 1, ultimo_erro = null where id = ?',
        [registro.id],
      );
      enviados += 1;
    } catch (erro) {
      await registrarFalha(db, 'registro_diario', registro.id, erro);
    }
  }

  return enviados;
}

async function registrarFalha(
  db: Awaited<ReturnType<typeof getDb>>,
  tabela: 'crise_enxaqueca' | 'registro_diario',
  id: string,
  erro: unknown,
): Promise<void> {
  // `synced` continua 0 de proposito: falha de envio nao perde o registro, que e o quarto
  // item da issue.
  await db.runAsync(
    `update ${tabela}
        set tentativas = tentativas + 1,
            ultima_tentativa_em = ?,
            ultimo_erro = ?
      where id = ?`,
    [new Date().toISOString(), mensagemCurta(erro), id],
  );
}

export async function contarPendentes(): Promise<number> {
  const db = await getDb();
  const linha = await db.getFirstAsync<{ total: number }>(
    `select
       (select count(*) from crise_enxaqueca where synced = 0) +
       (select count(*) from registro_diario where synced = 0) as total`,
  );
  return linha?.total ?? 0;
}
