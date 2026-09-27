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

/**
 * Unica superficie de import da camada de dado. Issues #48 e #49.
 *
 * Telas e hooks importam daqui e nao de `@/lib/supabase` nem de `@/db`. A #49 trocou a
 * origem das LEITURAS para o SQLite local sem que nenhum hook ou tela mudasse, que era
 * exatamente o que a #48 preparou.
 */

/**
 * Leitura e escrita vao para o banco local. Issue #50.
 *
 * Gravar nunca depende de rede: a linha nasce no SQLite com `synced = 0` e aparece na tela na
 * hora, porque a leitura tambem e local desde a #49. O envio acontece em seguida se houver
 * conexao, e o que a tela recebe de volta e o FATO de ter subido ou nao — nao um palpite a
 * partir do estado da rede.
 *
 * Se o envio falhar, a gravacao continua valida. Perder o registro por falta de rede e
 * exatamente o que esta frente existe para impedir.
 */
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

  // A tela le do banco local, entao o registro ja pode aparecer antes de qualquer rede.
  notificarDadosLocais();

  try {
    // Só envia, nao replica: a linha ja esta no banco local e a tela ja a mostra. Replicar
    // aqui faria cada registro salvo rebaixar o historico inteiro com a tela esperando.
    await enviarPendentes();
    // Nao basta contar quantos subiram na rodada: o que interessa e se ESTE registro saiu da
    // fila. Outro pendente antigo pode ter subido e este ter falhado.
    return { enviado: !(await estaPendente(id)) };
  } catch {
    return { enviado: false };
  }
}

/**
 * O banco local nao abriu, ou recusou a gravacao.
 *
 * Caso raro no build certo — chave perdida numa restauracao de backup do Android, arquivo
 * corrompido — mas quando acontece, sem este caminho, aquele aparelho nao registra crise
 * nenhuma, nem com internet. E o registro da crise e o momento em que o app mais precisa
 * funcionar.
 *
 * Com rede, o registro vai direto ao servidor pela funcao atomica da #40, como antes da #50.
 * Nada e gravado em texto puro no aparelho, entao a criptografia da #58 nao e enfraquecida.
 *
 * Sem rede, nao ha para onde ir, e a tela recebe um erro proprio. A crise em andamento nao se
 * perde: ela mora no AsyncStorage pela #79, fora do banco cifrado, e a tela so a descarta
 * quando a gravacao da certo.
 */
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

/**
 * Nao da para gravar agora: o banco do aparelho nao abriu e o servidor nao esta alcancavel.
 *
 * Identificado por `codigo` e nao por `instanceof`: subclasse de Error transpilada perde a
 * cadeia de prototipo em alguns ambientes do React Native, e o `instanceof` falharia em
 * silencio justamente no caso que ele existe para reconhecer.
 */
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
    // Montado uma vez so: os dois caminhos gravam os MESMOS ids.
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
        // Com o banco local fora, o dono vem do servidor: so se chega aqui com rede.
        const usuarioId = await userRepository.currentUsuarioId();
        if (usuarioId === null) throw new Error('Perfil do usuario nao encontrado');
        await remoteDailyRecord.enviarRegistroDiario(registro, usuarioId);
      },
    );
  },
};

// Sem equivalente local, e de proposito. Setup acontece uma vez, com conexao. Sessao e
// autenticacao, nao dado replicavel. E `userRepository` traduz o usuario autenticado para a
// linha de public.usuarios, o que so o servidor sabe fazer.
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
