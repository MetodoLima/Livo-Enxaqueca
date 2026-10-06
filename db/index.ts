import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import { MIGRACOES } from './schema';
import { getDatabaseEncryptionKey } from './encryptionKey';
import { migratePlaintextDatabase } from './plaintextMigration';

const DATABASE_NAME = 'livo.db';
const PLAINTEXT_MIGRATION_MARKER = 'livo.db.plaintext-migration.v1';

type PlaintextMigrationMarker = {
  version: 1;
  sourceDatabasePath: string;
  destinationDatabaseName: string;
  destinationDatabasePath: string;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

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
    await apagarOrigemEmTextoPuro(marker);
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
    const escapedKey = encryptionKey.replaceAll("'", "''");
    await db.execAsync(`pragma key = '${escapedKey}'`);
    const state = await validarBancoCriptografado(db);
    return { db, state };
  } catch (error) {
    await db.closeAsync().catch(() => undefined);
    throw error;
  }
}

async function apagarOrigemEmTextoPuro(marker: PlaintextMigrationMarker): Promise<void> {
  if (marker.destinationDatabaseName === DATABASE_NAME) return;

  try {
    await SQLite.deleteDatabaseAsync(DATABASE_NAME);
  } catch {
  }
}

async function prepararBanco(db: SQLite.SQLiteDatabase): Promise<void> {
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
      dbPromise = null;
      throw erro;
    });
  }
  return dbPromise;
}
