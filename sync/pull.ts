import { getDb } from '@/db';
import { getSyncValue, setSyncValue } from '@/db/syncState';
import { crisisRepository as remoteCrisisRepository } from '@/repositories/remote/crisisRepository';
import { dailyRecordRepository as remoteDailyRecordRepository } from '@/repositories/remote/dailyRecordRepository';
import { userRepository } from '@/repositories/remote/userRepository';
import { notificarDadosLocais } from './notify';

/**
 * Replicacao do servidor para o banco local. Issue #49.
 *
 * Nao escreve nenhuma consulta nova: usa as implementacoes remotas que a #48 ja criou. Era
 * esse o ponto de ter contratos em termos de dominio — a replicacao pede `Crisis[]` e nao
 * precisa saber como o PostgREST devolve.
 *
 * Reescreve as tabelas inteiras em vez de replicar incrementalmente. Com cerca de cem crises
 * o custo nao se mede, e reescrever e idempotente: nao existe estado parcial para consertar
 * se a replicacao for interrompida, porque tudo acontece numa transacao.
 */

// `registro_diario.data` e um dia, nao um instante. Os extremos cobrem qualquer data que o
// app consiga produzir sem precisar descobrir a mais antiga antes de consultar.
const DATA_MINIMA = '0001-01-01';
const DATA_MAXIMA = '9999-12-31';

export type PullResult = { replicou: boolean; motivo?: 'sem-perfil' };

/**
 * Move para a quarentena tudo que o dono anterior escreveu e nao conseguiu enviar. Issue #50.
 *
 * A crise vai com as fases dentro do mesmo payload, porque separadas elas nao voltam para a
 * fila como um pacote atomico — e a #40 existe justamente para crise e fases nunca se
 * separarem.
 */
async function quarentenar(
  db: Awaited<ReturnType<typeof getDb>>,
  dono: string,
): Promise<void> {
  const agora = new Date().toISOString();

  const crises = await db.getAllAsync<Record<string, unknown>>(
    'select * from crise_enxaqueca where synced = 0',
  );

  for (const crise of crises) {
    const fases = await db.getAllAsync<Record<string, unknown>>(
      'select * from registro_crise where crise_id = ?',
      [crise.id as string],
    );
    await db.runAsync(
      `insert or replace into pendencias_orfas (id, dono, tabela, payload, criado_em)
       values (?, ?, 'crise_enxaqueca', ?, ?)`,
      [crise.id as string, dono, JSON.stringify({ crise, fases }), agora],
    );
  }

  const registros = await db.getAllAsync<Record<string, unknown>>(
    'select * from registro_diario where synced = 0',
  );

  for (const registro of registros) {
    await db.runAsync(
      `insert or replace into pendencias_orfas (id, dono, tabela, payload, criado_em)
       values (?, ?, 'registro_diario', ?, ?)`,
      [registro.id as string, dono, JSON.stringify(registro), agora],
    );
  }
}

/**
 * Devolve para a fila o que ficou na quarentena deste dono. Issue #50.
 *
 * Roda antes de replicar: se a pessoa voltou ao aparelho, o que ela escreveu e nao enviou
 * precisa estar na fila antes de qualquer coisa apagar ou reescrever tabela.
 */
async function restaurarQuarentena(
  db: Awaited<ReturnType<typeof getDb>>,
  dono: string,
): Promise<void> {
  const orfas = await db.getAllAsync<{ id: string; tabela: string; payload: string }>(
    'select id, tabela, payload from pendencias_orfas where dono = ?',
    [dono],
  );
  if (orfas.length === 0) return;

  for (const orfa of orfas) {
    let dados: any;
    try {
      dados = JSON.parse(orfa.payload);
    } catch {
      // Payload corrompido nao pode travar a sincronizacao de tudo o mais. A linha fica na
      // quarentena para inspecao em vez de ser apagada.
      continue;
    }

    if (orfa.tabela === 'crise_enxaqueca') {
      await inserirLinha(db, 'crise_enxaqueca', dados.crise);
      for (const fase of dados.fases ?? []) {
        await inserirLinha(db, 'registro_crise', fase);
      }
    } else {
      await inserirLinha(db, 'registro_diario', dados);
    }

    await db.runAsync('delete from pendencias_orfas where id = ? and dono = ?', [
      orfa.id,
      dono,
    ]);
  }
}

// Nome de tabela e de coluna nao podem ir como parametro ligado em SQL, entao entram
// interpolados. A lista fechada e o que garante que so estes nomes chegam la, mesmo que o
// payload guardado esteja corrompido ou tenha vindo de uma versao futura do schema.
const TABELAS_RESTAURAVEIS = ['crise_enxaqueca', 'registro_crise', 'registro_diario'] as const;
type TabelaRestauravel = (typeof TABELAS_RESTAURAVEIS)[number];

const COLUNA_VALIDA = /^[a-z_]+$/;

/**
 * Reinsere uma linha guardada como objeto. As colunas vem do proprio payload, entao uma
 * migracao futura que adicione coluna nao invalida quarentena antiga.
 */
async function inserirLinha(
  db: Awaited<ReturnType<typeof getDb>>,
  tabela: TabelaRestauravel,
  linha: Record<string, unknown>,
): Promise<void> {
  const colunas = Object.keys(linha).filter((c) => COLUNA_VALIDA.test(c));
  if (colunas.length === 0) return;

  const marcadores = colunas.map(() => '?').join(', ');
  await db.runAsync(
    `insert or ignore into ${tabela} (${colunas.join(', ')}) values (${marcadores})`,
    colunas.map((c) => linha[c] as any),
  );
}

export async function pullFromServer(): Promise<PullResult> {
  const usuarioId = await userRepository.currentUsuarioId();
  if (usuarioId === null) {
    // Sem sessao ou sem perfil em public.usuarios nao ha o que replicar. Quem chama decide
    // se isso e erro; aqui e so ausencia de trabalho.
    return { replicou: false, motivo: 'sem-perfil' };
  }

  const [crises, registros] = await Promise.all([
    remoteCrisisRepository.list(),
    remoteDailyRecordRepository.listBetween(DATA_MINIMA, DATA_MAXIMA),
  ]);

  const db = await getDb();
  const donoAnterior = await getSyncValue('owner', db);
  const trocouUsuario = donoAnterior !== null && donoAnterior !== String(usuarioId);

  // Se esta pessoa deixou pendencia num uso anterior deste aparelho, ela volta para a fila
  // antes de qualquer coisa reescrever tabela. Issue #50.
  await restaurarQuarentena(db, String(usuarioId));

  await db.withTransactionAsync(async () => {
    if (trocouUsuario) {
      // A replica e de outra pessoa e nao pode ficar servindo como historico desta sessao.
      //
      // Mas registro NAO ENVIADO do dono anterior nao pode ser apagado: e dado clinico que
      // so existe aqui. Ele vai para a quarentena, chaveado por dono, e volta para a fila
      // quando aquela pessoa entrar de novo neste aparelho. Issue #50.
      //
      // As alternativas foram descartadas com motivo: enviar antes de trocar nao funciona,
      // porque se esta trocando e provavel que nao haja rede; bloquear a troca prende o
      // segundo usuario por causa do dado do primeiro; e apagar avisando transfere a decisao
      // para quem esta na tela de login e nao tem contexto para decidir.
      await quarentenar(db, donoAnterior!);

      await db.execAsync(
        'delete from registro_crise; delete from crise_enxaqueca; delete from registro_diario;',
      );
    } else {
      // Apaga so o que veio do servidor. Linha com synced = 0 e escrita local que ainda nao
      // subiu e sobrevive a replicacao — a regra entra agora para a #50 nao precisar voltar
      // aqui, e para nao existir uma janela em que replicar apague registro do paciente.
      await db.runAsync('delete from registro_crise where synced = 1');
      await db.runAsync('delete from crise_enxaqueca where synced = 1');
      await db.runAsync('delete from registro_diario where synced = 1');
    }

    const agora = new Date().toISOString();

    for (const crise of crises) {
      // `or ignore` em vez de `or replace`: se sobrou linha local com synced = 0, a versao
      // do aparelho vence ate ser enviada.
      await db.runAsync(
        `insert or ignore into crise_enxaqueca (id, inicio_crise, fim_crise, updated_at, synced)
         values (?, ?, ?, ?, 1)`,
        [
          crise.id,
          crise.inicioCrise ? crise.inicioCrise.toISOString() : null,
          crise.fimCrise ? crise.fimCrise.toISOString() : null,
          agora,
        ],
      );

      for (const fase of crise.fases) {
        await db.runAsync(
          `insert or ignore into registro_crise
             (id, crise_id, intensidade_dor, regiao_dor, lado, nivel_incapacidade, resumo,
              sintomas, medicamentos, medicamentos_livres, fatores, updated_at, synced)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            fase.id,
            crise.id,
            fase.intensidadeDor,
            fase.regiaoDor,
            fase.lado,
            fase.nivelIncapacidade,
            fase.resumo,
            JSON.stringify(fase.sintomas),
            JSON.stringify(fase.medicamentos),
            JSON.stringify(fase.medicamentosLivres),
            JSON.stringify(fase.fatores),
            agora,
          ],
        );
      }
    }

    for (const registro of registros) {
      await db.runAsync(
        `insert or ignore into registro_diario
           (id, data, relato, horas_sono, ml_agua, humor, created_at, updated_at, synced)
         values (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          registro.id,
          registro.data,
          registro.relato,
          registro.horasSono,
          registro.mlAgua,
          registro.humor,
          registro.createdAt || null,
          agora,
        ],
      );
    }
  });

  await setSyncValue('owner', String(usuarioId), db);
  await setSyncValue('lastPulledAt', new Date().toISOString(), db);

  notificarDadosLocais();

  return { replicou: true };
}
