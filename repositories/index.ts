import NetInfo from '@react-native-community/netinfo';
import { normalizeConnectivityState } from '@/contexts/ConnectivityContext';
import { bancoDoUsuario } from '@/db/owner';
import { enviarPendentes } from '@/sync';
import { notificarDadosLocais } from '@/sync/notify';
import type { CrisisRecord } from '@/types/crisis';
import { randomUUID } from 'expo-crypto';
import { montarPacoteCrise } from './crisisPackage';
import { crisisRepository as localCrisis } from './local/crisisRepository';
import { dailyRecordRepository as localDailyRecord } from './local/dailyRecordRepository';
import { crisisRepository as remoteCrisis } from './remote/crisisRepository';
import {
  dailyRecordRepository as remoteDailyRecord,
  type RegistroDiarioPayload,
} from './remote/dailyRecordRepository';
import { userRepository } from './remote/userRepository';
import type {
  CrisisRepository,
  DailyRecordRepository,
  NewDailyRecord,
  SaveOutcome,
} from './types';

async function gravarEEnviar(
  gravarLocal: () => Promise<string>,
  enviarDireto: () => Promise<void>,
): Promise<SaveOutcome> {
  let id: string;
  try {
    id = await gravarLocal();
  } catch {
    return gravarSemBancoLocal(enviarDireto);
  }

  notificarDadosLocais();

  try {
    await enviarPendentes();
    return { enviado: !(await estaPendente(id)) };
  } catch {
    return { enviado: false };
  }
}

async function gravarSemBancoLocal(enviarDireto: () => Promise<void>): Promise<SaveOutcome> {
  const rede = normalizeConnectivityState(await NetInfo.fetch());
  if (rede.isOffline) throw new BancoLocalIndisponivel();

  try {
    await enviarDireto();
  } catch {
    throw new BancoLocalIndisponivel();
  }

  return { enviado: true };
}

export class BancoLocalIndisponivel extends Error {
  readonly codigo = 'banco-local-indisponivel';

  constructor() {
    super('Nao foi possivel gravar no aparelho nem enviar ao servidor.');
  }
}

export function ehBancoLocalIndisponivel(erro: unknown): boolean {
  return (
    typeof erro === 'object' &&
    erro !== null &&
    (erro as { codigo?: unknown }).codigo === 'banco-local-indisponivel'
  );
}

async function estaPendente(id: string): Promise<boolean> {
  const db = await bancoDoUsuario();
  const linha = await db.getFirstAsync<{ total: number }>(
    `select
       (select count(*) from crise_enxaqueca where id = ? and synced = 0) +
       (select count(*) from registro_diario where id = ? and synced = 0) as total`,
    [id, id],
  );
  return (linha?.total ?? 0) > 0;
}

export const crisisRepository: CrisisRepository = {
  list: localCrisis.list,
  lastEndedAt: localCrisis.lastEndedAt,
  countSince: localCrisis.countSince,
  intensities: localCrisis.intensities,
  save: (crisis: CrisisRecord, fases: CrisisRecord[] = []) => {
    const pacote = montarPacoteCrise(crisis, fases);
    return gravarEEnviar(
      () => localCrisis.save(pacote),
      () => remoteCrisis.enviarCrise(pacote.crise, pacote.fases),
    );
  },
};

export const dailyRecordRepository: DailyRecordRepository = {
  listBetween: localDailyRecord.listBetween,
  save: (novo: NewDailyRecord) => {
    const registro: RegistroDiarioPayload = {
      id: randomUUID(),
      data: novo.data,
      relato: novo.relato,
      horasSono: novo.horasSono,
      mlAgua: novo.mlAgua,
      humor: novo.humor,
      updatedAt: new Date().toISOString(),
    };
    return gravarEEnviar(
      () => localDailyRecord.save(registro),
      async () => {
        const usuarioId = await userRepository.currentUsuarioId();
        if (usuarioId === null) throw new Error('Perfil do usuario nao encontrado');
        await remoteDailyRecord.enviarRegistroDiario(registro, usuarioId);
      },
    );
  },
};

export { sessionRepository } from './remote/sessionRepository';
export { setupRepository } from './remote/setupRepository';
export { userRepository } from './remote/userRepository';

export type {
  AuthOutcome,
  Crisis,
  CrisisFilter,
  CrisisRepository,
  DailyRecord,
  DailyRecordRepository,
  HumorId,
  NewDailyRecord,
  Phase,
  SessionRepository,
  SetupAnswer,
  SetupOption,
  SetupQuestion,
  SaveOutcome,
  SetupRepository,
  SignUpOutcome,
  UserRepository,
} from './types';
