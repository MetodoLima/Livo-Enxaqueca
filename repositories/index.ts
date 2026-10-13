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
import { momentRepository as localMoment } from './local/momentRepository';
import { crisisRepository as remoteCrisis } from './remote/crisisRepository';
import { dailyRecordRepository as remoteDailyRecord } from './remote/dailyRecordRepository';
import { momentRepository as remoteMoment, type MomentoPayload } from './remote/momentRepository';
import { userRepository } from './remote/userRepository';
import type {
  CrisisRepository,
  DailyRecordRepository,
  MomentRepository,
  NovoMomento,
  RegistroDiaPatch,
  SaveOutcome,
} from './types';

async function gravarEEnviar(
  gravarLocal: () => Promise<string>,
  enviarDireto: () => Promise<void>,
): Promise<SaveOutcome> {
  let chave: string;
  try {
    chave = await gravarLocal();
  } catch {
    return gravarSemBancoLocal(enviarDireto);
  }

  notificarDadosLocais();

  try {
    await enviarPendentes();
    return { enviado: !(await estaPendente(chave)) };
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

async function estaPendente(chave: string): Promise<boolean> {
  const db = await bancoDoUsuario();
  const linha = await db.getFirstAsync<{ total: number }>(
    `select
       (select count(*) from crise_enxaqueca  where id = ?   and synced = 0) +
       (select count(*) from registro_momento where id = ?   and synced = 0) +
       (select count(*) from registro_diario  where data = ? and synced = 0) as total`,
    [chave, chave, chave],
  );
  return (linha?.total ?? 0) > 0;
}

async function usuarioIdObrigatorio(): Promise<number> {
  const usuarioId = await userRepository.currentUsuarioId();
  if (usuarioId === null) throw new Error('Perfil do usuario nao encontrado');
  return usuarioId;
}

const HORARIO = /^\d{2}:\d{2}$/;

function validarSono(patch: RegistroDiaPatch): void {
  const sono = patch.sono;
  if (!sono) return;
  if (!HORARIO.test(sono.dormiAs) || !HORARIO.test(sono.acordeiAs)) {
    throw new Error('Horario de sono invalido');
  }
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
  salvarDia: async (data: string, patch: RegistroDiaPatch) => {
    validarSono(patch);
    const agora = new Date().toISOString();
    return gravarEEnviar(
      () => localDailyRecord.salvarDia(data, patch, agora),
      async () =>
        remoteDailyRecord.enviarRegistroDia(
          {
            data,
            dormiAs: patch.sono === undefined ? undefined : (patch.sono?.dormiAs ?? null),
            acordeiAs: patch.sono === undefined ? undefined : (patch.sono?.acordeiAs ?? null),
            mlAgua: patch.mlAgua,
            updatedAt: agora,
          },
          await usuarioIdObrigatorio(),
        ),
    );
  },
};

export const momentRepository: MomentRepository = {
  listBetween: localMoment.listBetween,
  ultimoDoDia: localMoment.ultimoDoDia,
  registrar: async (novo: NovoMomento) => {
    const relato = novo.relato?.trim() || null;
    if (novo.humor === null && relato === null) {
      throw new Error('Momento sem humor e sem relato');
    }
    const agora = new Date().toISOString();
    const momento: MomentoPayload = {
      id: randomUUID(),
      registradoEm: agora,
      humor: novo.humor,
      relato,
      updatedAt: agora,
    };
    return gravarEEnviar(
      () => localMoment.registrar(momento),
      async () => remoteMoment.enviarMomento(momento, await usuarioIdObrigatorio()),
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
  DailyRecordRepository,
  HumorId,
  MomentRepository,
  Momento,
  NovoMomento,
  Phase,
  RegistroDia,
  RegistroDiaPatch,
  SessionRepository,
  SetupAnswer,
  SetupOption,
  SetupQuestion,
  SaveOutcome,
  SetupRepository,
  SignUpOutcome,
  SonoDoDia,
  UserRepository,
} from './types';
