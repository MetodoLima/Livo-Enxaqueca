import { getDb } from '@/db';
import { enviarPendentes } from '@/sync';
import { notificarDadosLocais } from '@/sync/notify';
import type { CrisisRecord } from '@/types/crisis';
import { crisisRepository as localCrisis } from './local/crisisRepository';
import { dailyRecordRepository as localDailyRecord } from './local/dailyRecordRepository';
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
async function gravarEEnviar(gravarLocal: () => Promise<string>): Promise<SaveOutcome> {
  const id = await gravarLocal();

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

async function estaPendente(id: string): Promise<boolean> {
  const db = await getDb();
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
  save: (crisis: CrisisRecord, fases: CrisisRecord[] = []) =>
    gravarEEnviar(() => localCrisis.save(crisis, fases)),
};

export const dailyRecordRepository: DailyRecordRepository = {
  listBetween: localDailyRecord.listBetween,
  save: (registro: NewDailyRecord) => gravarEEnviar(() => localDailyRecord.save(registro)),
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
