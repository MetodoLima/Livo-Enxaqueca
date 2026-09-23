/**
 * Unica superficie de import da camada de dado. Issue #48.
 *
 * Telas e hooks importam daqui e nao de `@/lib/supabase`. Quando a T3.6 trocar a origem
 * para o SQLite local, a troca acontece dentro desta pasta e nenhum arquivo de tela muda.
 */

export { crisisRepository } from './crisisRepository';
export { dailyRecordRepository } from './dailyRecordRepository';
export { sessionRepository } from './sessionRepository';
export { setupRepository } from './setupRepository';
export { userRepository } from './userRepository';

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
