import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from './index';

/**
 * Estado da replicacao. Issue #49.
 *
 * Duas chaves hoje:
 * - `owner`: o `usuarios.id` de quem a replica pertence. Conferido a cada replicacao.
 * - `lastPulledAt`: quando a ultima replicacao terminou, em ISO.
 */

export type SyncKey = 'owner' | 'lastPulledAt';

export async function getSyncValue(key: SyncKey, db?: SQLiteDatabase): Promise<string | null> {
  const banco = db ?? (await getDb());
  const linha = await banco.getFirstAsync<{ value: string | null }>(
    'select value from sync_state where key = ?',
    [key],
  );
  return linha?.value ?? null;
}

export async function setSyncValue(
  key: SyncKey,
  value: string,
  db?: SQLiteDatabase,
): Promise<void> {
  const banco = db ?? (await getDb());
  await banco.runAsync(
    'insert into sync_state (key, value) values (?, ?) on conflict (key) do update set value = excluded.value',
    [key, value],
  );
}
