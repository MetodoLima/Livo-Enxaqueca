import NetInfo from '@react-native-community/netinfo';
import { normalizeConnectivityState } from '@/contexts/ConnectivityContext';
import type { SQLiteDatabase } from 'expo-sqlite';
import { abrirBancoDoUsuario, usuarioAtual } from '@/db/owner';
import {
  crisisRepository as remoteCrisisRepository,
  type FasePayload,
} from '@/repositories/remote/crisisRepository';
import { dailyRecordRepository as remoteDailyRecordRepository } from '@/repositories/remote/dailyRecordRepository';
import { momentRepository as remoteMomentRepository } from '@/repositories/remote/momentRepository';
import { userRepository } from '@/repositories/remote/userRepository';
import type { HumorId } from '@/repositories/types';
import { notificarDadosLocais } from './notify';
import { lerEstadoDaFila } from './status';

const RECUO_MINUTOS = [0, 1, 5, 15, 60, 360];

function esperaEmMinutos(tentativas: number): number {
  const indice = Math.min(tentativas, RECUO_MINUTOS.length - 1);
  return RECUO_MINUTOS[indice];
}

function podeTentar(tentativas: number, ultimaTentativaEm: string | null): boolean {
  if (tentativas === 0) return true;
  if (!ultimaTentativaEm) return true;

  const esperaMs = esperaEmMinutos(tentativas) * 60 * 1000;
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

type PendenteDia = {
  data: string;
  dormi_as: string | null;
  acordei_as: string | null;
  ml_agua: number | null;
  updated_at: string;
  tentativas: number;
  ultima_tentativa_em: string | null;
};

type PendenteMomento = {
  id: string;
  registrado_em: string;
  humor: string | null;
  relato: string | null;
  updated_at: string;
  tentativas: number;
  ultima_tentativa_em: string | null;
};

export type PushResult = {
  enviados: number;
  pendentes: number;
};

export async function pushToServer(): Promise<PushResult> {
  const { db, dono } = await abrirBancoDoUsuario();

  const rede = normalizeConnectivityState(await NetInfo.fetch());
  if (rede.isOffline) return { enviados: 0, pendentes: await contarPendentes() };

  const usuarioId = await userRepository.currentUsuarioId();
  if (usuarioId === null) return { enviados: 0, pendentes: await contarPendentes() };

  let enviados = 0;

  enviados += await enviarCrises(db, dono);
  enviados += await enviarRegistrosDoDia(db, dono, usuarioId);
  enviados += await enviarMomentos(db, dono, usuarioId);

  notificarDadosLocais();

  return { enviados, pendentes: await contarPendentes() };
}

async function enviarCrises(db: SQLiteDatabase, dono: string): Promise<number> {
  const pendentes = await db.getAllAsync<PendenteCrise>(
    `select id, inicio_crise, fim_crise, updated_at, tentativas, ultima_tentativa_em
       from crise_enxaqueca
      where synced = 0
      order by inicio_crise asc`,
  );

  let enviados = 0;

  for (const crise of pendentes) {
    if (usuarioAtual() !== dono) break;
    if (!podeTentar(crise.tentativas, crise.ultima_tentativa_em)) continue;

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
      await registrarFalha(db, 'crise_enxaqueca', 'id', crise.id, erro);
    }
  }

  return enviados;
}

async function enviarRegistrosDoDia(
  db: SQLiteDatabase,
  dono: string,
  usuarioId: number,
): Promise<number> {
  const pendentes = await db.getAllAsync<PendenteDia>(
    `select data, dormi_as, acordei_as, ml_agua, updated_at, tentativas, ultima_tentativa_em
       from registro_diario
      where synced = 0
      order by data asc`,
  );

  let enviados = 0;

  for (const registro of pendentes) {
    if (usuarioAtual() !== dono) break;
    if (!podeTentar(registro.tentativas, registro.ultima_tentativa_em)) continue;

    try {
      await remoteDailyRecordRepository.enviarRegistroDia(
        {
          data: registro.data,
          dormiAs: registro.dormi_as,
          acordeiAs: registro.acordei_as,
          mlAgua: registro.ml_agua,
          updatedAt: registro.updated_at,
        },
        usuarioId,
      );

      await db.runAsync(
        `update registro_diario
            set synced = 1, ultimo_erro = null
          where data = ? and updated_at = ?`,
        [registro.data, registro.updated_at],
      );
      enviados += 1;
    } catch (erro) {
      await registrarFalha(db, 'registro_diario', 'data', registro.data, erro);
    }
  }

  return enviados;
}

async function enviarMomentos(
  db: SQLiteDatabase,
  dono: string,
  usuarioId: number,
): Promise<number> {
  const pendentes = await db.getAllAsync<PendenteMomento>(
    `select id, registrado_em, humor, relato, updated_at, tentativas, ultima_tentativa_em
       from registro_momento
      where synced = 0
      order by registrado_em asc`,
  );

  let enviados = 0;

  for (const momento of pendentes) {
    if (usuarioAtual() !== dono) break;
    if (!podeTentar(momento.tentativas, momento.ultima_tentativa_em)) continue;

    try {
      await remoteMomentRepository.enviarMomento(
        {
          id: momento.id,
          registradoEm: momento.registrado_em,
          humor: (momento.humor ?? null) as HumorId | null,
          relato: momento.relato,
          updatedAt: momento.updated_at,
        },
        usuarioId,
      );

      await db.runAsync(
        'update registro_momento set synced = 1, ultimo_erro = null where id = ?',
        [momento.id],
      );
      enviados += 1;
    } catch (erro) {
      await registrarFalha(db, 'registro_momento', 'id', momento.id, erro);
    }
  }

  return enviados;
}

async function registrarFalha(
  db: SQLiteDatabase,
  tabela: 'crise_enxaqueca' | 'registro_diario' | 'registro_momento',
  coluna: 'id' | 'data',
  chave: string,
  erro: unknown,
): Promise<void> {
  await db.runAsync(
    `update ${tabela}
        set tentativas = tentativas + 1,
            ultima_tentativa_em = ?,
            ultimo_erro = ?
      where ${coluna} = ?`,
    [new Date().toISOString(), mensagemCurta(erro), chave],
  );
}

export async function contarPendentes(): Promise<number> {
  return (await lerEstadoDaFila()).pendentes;
}
