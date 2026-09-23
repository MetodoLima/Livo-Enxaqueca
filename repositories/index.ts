import { pullFromServer } from '@/sync/pull';
import { crisisRepository as localCrisis } from './local/crisisRepository';
import { dailyRecordRepository as localDailyRecord } from './local/dailyRecordRepository';
import { crisisRepository as remoteCrisis } from './remote/crisisRepository';
import { dailyRecordRepository as remoteDailyRecord } from './remote/dailyRecordRepository';
import type { CrisisRecord } from '@/types/crisis';
import type { CrisisRepository, DailyRecordRepository, NewDailyRecord } from './types';

/**
 * Unica superficie de import da camada de dado. Issues #48 e #49.
 *
 * Telas e hooks importam daqui e nao de `@/lib/supabase` nem de `@/db`. A #49 trocou a
 * origem das LEITURAS para o SQLite local sem que nenhum hook ou tela mudasse, que era
 * exatamente o que a #48 preparou.
 */

/**
 * As leituras vem do banco local, a gravacao ainda vai direto ao servidor.
 *
 * Essa mistura e PROVISORIA e termina na #50, que grava no SQLite com synced = 0 e enfileira
 * o envio. Ate lá, registrar uma crise sem rede continua falhando; o que a #49 entrega e o
 * historico abrir sem rede.
 *
 * Por causa dessa mistura, gravar precisa replicar em seguida: sem isso a crise iria para o
 * servidor e nao apareceria no calendario, que agora le da replica. A #50 remove essa
 * chamada, porque lá a escrita ja nasce local.
 */
async function salvarERreplicar<T>(
  salvarNoServidor: () => Promise<T>,
): Promise<T> {
  const resultado = await salvarNoServidor();
  // A gravacao ja aconteceu. Falha ao replicar nao pode virar erro de gravacao para a tela:
  // o dado esta no servidor e a proxima replicacao o traz.
  await pullFromServer().catch(() => undefined);
  return resultado;
}

export const crisisRepository: CrisisRepository = {
  list: localCrisis.list,
  lastEndedAt: localCrisis.lastEndedAt,
  countSince: localCrisis.countSince,
  intensities: localCrisis.intensities,
  save: (crisis: CrisisRecord, fases: CrisisRecord[] = []) =>
    salvarERreplicar(() => remoteCrisis.save(crisis, fases)),
};

export const dailyRecordRepository: DailyRecordRepository = {
  listBetween: localDailyRecord.listBetween,
  save: (registro: NewDailyRecord) =>
    salvarERreplicar(() => remoteDailyRecord.save(registro)),
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
  SetupRepository,
  SignUpOutcome,
  UserRepository,
} from './types';
