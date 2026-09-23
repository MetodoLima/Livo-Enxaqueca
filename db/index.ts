import * as SQLite from 'expo-sqlite';
import { SCHEMA } from './schema';

/**
 * Abertura do banco local. Issue #49.
 *
 * A promessa e memoizada em vez do banco: se duas telas chamarem getDb() no mesmo tick,
 * as duas esperam a MESMA abertura. Memoizar o resultado abriria o arquivo duas vezes.
 */

const DATABASE_NAME = 'livo.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync(SCHEMA);
  return db;
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = open().catch((erro) => {
      // Sem isso, uma falha na primeira abertura ficaria memoizada para sempre e nenhuma
      // tentativa posterior funcionaria.
      dbPromise = null;
      throw erro;
    });
  }
  return dbPromise;
}
