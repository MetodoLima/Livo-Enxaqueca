import * as SQLite from 'expo-sqlite';
import { MIGRACOES } from './schema';

/**
 * Abertura e migracao do banco local. Issues #49 e #50.
 *
 * A promessa e memoizada em vez do banco: se duas telas chamarem getDb() no mesmo tick,
 * as duas esperam a MESMA abertura. Memoizar o resultado abriria o arquivo duas vezes.
 */

const DATABASE_NAME = 'livo.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Aplica as migracoes que faltam, na ordem, usando `PRAGMA user_version` como marcador.
 *
 * Cada passo roda na sua propria transacao: se o passo 3 falhar, o 2 permanece aplicado e a
 * versao gravada reflete isso. Aplicar tudo numa transacao unica seria pior — uma falha
 * deixaria o banco na versao antiga com metade das alteracoes feitas.
 *
 * `user_version` nao aceita parametro ligado, entao o numero entra interpolado. E seguro:
 * vem de `MIGRACOES.length`, nunca de fora.
 */
async function migrar(db: SQLite.SQLiteDatabase): Promise<void> {
  const linha = await db.getFirstAsync<{ user_version: number }>('pragma user_version');
  const versaoAtual = linha?.user_version ?? 0;

  for (let i = versaoAtual; i < MIGRACOES.length; i += 1) {
    const versaoDestino = i + 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRACOES[i]);
      await db.execAsync(`pragma user_version = ${versaoDestino}`);
    });
  }
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  // Fora das migracoes de proposito: journal_mode e ajuste de conexao e nao roda dentro de
  // transacao.
  await db.execAsync('pragma journal_mode = WAL');
  await migrar(db);
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
