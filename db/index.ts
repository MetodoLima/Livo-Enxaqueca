import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import { MIGRACOES } from './schema';
import { getDatabaseEncryptionKey } from './encryptionKey';
import { migratePlaintextDatabase } from './plaintextMigration';

/**
 * Abertura e migracao do banco local. Issues #49 e #50.
 *
 * A promessa e memoizada em vez do banco: se duas telas chamarem getDb() no mesmo tick,
 * as duas esperam a MESMA abertura. Memoizar o resultado abriria o arquivo duas vezes.
 */

const DATABASE_NAME = 'livo.db';
const PLAINTEXT_MIGRATION_MARKER = 'livo.db.plaintext-migration.v1';

type PlaintextMigrationMarker = {
  version: 1;
  sourceDatabasePath: string;
  destinationDatabaseName: string;
  destinationDatabasePath: string;
};

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
  const encryptionKey = await getDatabaseEncryptionKey();
  const marker = await readPlaintextMigrationMarker();

  if (marker) {
    const migratedDb = await openEncryptedDatabase(marker.destinationDatabaseName, encryptionKey);
    if (migratedDb.state !== 'encrypted') {
      await migratedDb.db.closeAsync().catch(() => undefined);
      throw new Error(
        'O marcador de migração existe, mas o banco SQLCipher migrado não foi encontrado ou é inválido.',
      );
    }
    await prepararBanco(migratedDb.db);
    return migratedDb.db;
  }

  const currentDb = await openEncryptedDatabase(DATABASE_NAME, encryptionKey);
  if (currentDb.state === 'sqlcipher-unavailable') {
    await currentDb.db.closeAsync().catch(() => undefined);
    throw new Error(
      'SQLCipher não está ativo nesta build nativa; uma development build é necessária.',
    );
  }

  if (currentDb.state !== 'legacy-plaintext') {
    await prepararBanco(currentDb.db);
    return currentDb.db;
  }

  await currentDb.db.closeAsync();

  const migration = await migratePlaintextDatabase(DATABASE_NAME, encryptionKey);
  if (migration.status !== 'migrated') {
    throw new Error(
      'O banco local não pôde ser confirmado como plaintext; a migração não foi executada.',
    );
  }

  const migratedDb = await openEncryptedDatabase(
    migration.destinationDatabaseName,
    encryptionKey,
  );
  if (migratedDb.state !== 'encrypted') {
    await migratedDb.db.closeAsync().catch(() => undefined);
    throw new Error('O banco SQLCipher migrado não passou na validação final.');
  }

  try {
    await prepararBanco(migratedDb.db);
    await savePlaintextMigrationMarker({
      version: 1,
      sourceDatabasePath: migration.sourceDatabasePath,
      destinationDatabaseName: migration.destinationDatabaseName,
      destinationDatabasePath: migration.destinationDatabasePath,
    });
  } catch (error) {
    await migratedDb.db.closeAsync().catch(() => undefined);
    throw error;
  }

  return migratedDb.db;
}

async function openEncryptedDatabase(
  databaseName: string,
  encryptionKey: string,
): Promise<{ db: SQLite.SQLiteDatabase; state: DatabaseState }> {
  const db = await SQLite.openDatabaseAsync(databaseName);

  try {
    // A chave precisa ser aplicada antes de qualquer leitura, inclusive PRAGMA user_version.
    const escapedKey = encryptionKey.replaceAll("'", "''");
    await db.execAsync(`pragma key = '${escapedKey}'`);
    const state = await validarBancoCriptografado(db);
    return { db, state };
  } catch (error) {
    await db.closeAsync().catch(() => undefined);
    throw error;
  }
}

async function prepararBanco(db: SQLite.SQLiteDatabase): Promise<void> {
  // Fora das migracoes de proposito: journal_mode e ajuste de conexao e nao roda dentro de
  // transacao.
  await db.execAsync('pragma journal_mode = WAL');
  await migrar(db);
}

async function readPlaintextMigrationMarker(): Promise<PlaintextMigrationMarker | null> {
  const rawMarker = await SecureStore.getItemAsync(PLAINTEXT_MIGRATION_MARKER);
  if (!rawMarker) return null;

  try {
    const marker = JSON.parse(rawMarker) as Partial<PlaintextMigrationMarker>;
    if (
      marker.version !== 1 ||
      typeof marker.sourceDatabasePath !== 'string' ||
      typeof marker.destinationDatabaseName !== 'string' ||
      typeof marker.destinationDatabasePath !== 'string'
    ) {
      throw new Error('formato inválido');
    }
    return marker as PlaintextMigrationMarker;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`O marcador de migração do banco local é inválido. Detalhe: ${detail}`);
  }
}

async function savePlaintextMigrationMarker(
  marker: PlaintextMigrationMarker,
): Promise<void> {
  try {
    await SecureStore.setItemAsync(PLAINTEXT_MIGRATION_MARKER, JSON.stringify(marker));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Não foi possível persistir o marcador de migração. Detalhe: ${detail}`);
  }
}

type DatabaseState =
  | 'new-encrypted'
  | 'encrypted'
  | 'legacy-plaintext'
  | 'sqlcipher-unavailable';

/**
 * Valida a chave antes de migrations. Um banco novo não tem tabelas nem versão; um banco
 * SQLCipher existente permite ler sqlite_master; um banco plaintext falha ao ser lido depois de
 * PRAGMA key. O estado legado é recusado explicitamente nesta etapa, sem conversão de dados.
 */
async function validarBancoCriptografado(db: SQLite.SQLiteDatabase): Promise<DatabaseState> {
  try {
    const cipher = await db.getFirstAsync<{ cipher_version: string }>('pragma cipher_version');
    if (!cipher?.cipher_version) return 'sqlcipher-unavailable';

    const version = await db.getFirstAsync<{ user_version: number }>('pragma user_version');
    const tabelas = await db.getAllAsync<{ name: string }>(
      "select name from sqlite_master where type = 'table'",
    );

    if ((version?.user_version ?? 0) === 0 && tabelas.length === 0) {
      return 'new-encrypted';
    }

    return 'encrypted';
  } catch (error) {
    const detail = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    if (
      detail.includes('not a database') ||
      detail.includes('file is encrypted') ||
      detail.includes('malformed')
    ) {
      return 'legacy-plaintext';
    }
    throw error;
  }
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
