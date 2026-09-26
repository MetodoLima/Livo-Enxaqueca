import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import { MIGRACOES } from './schema';

const LOCAL_TABLES = [
  'crise_enxaqueca',
  'registro_crise',
  'registro_diario',
  'sync_state',
  'pendencias_orfas',
] as const;

const LOCAL_INDEXES = [
  'idx_registro_crise_crise_id',
  'idx_crise_enxaqueca_inicio',
  'idx_crise_enxaqueca_fim',
  'idx_registro_diario_data',
  'idx_pendencias_orfas_dono',
  'idx_crise_enxaqueca_synced',
  'idx_registro_crise_synced',
  'idx_registro_diario_synced',
] as const;

type LocalTable = (typeof LOCAL_TABLES)[number];

export type PlaintextMigrationResult =
  | {
      status: 'migrated';
      sourceDatabasePath: string;
      destinationDatabaseName: string;
      destinationDatabasePath: string;
      tables: Record<string, { rows: number; digest: string }>;
    }
  | {
      status: 'not-plaintext';
      reason: 'encrypted-or-unreadable';
      sourceDatabasePath: string;
    };

type TableSnapshot = {
  columns: string[];
  rows: number;
  digest: string;
};

function quoteSqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function quoteSqlIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function isDatabaseFormatError(error: unknown): boolean {
  const detail = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    detail.includes('not a database') ||
    detail.includes('file is encrypted') ||
    detail.includes('malformed')
  );
}

function isPlaintextProbeError(error: unknown): boolean {
  return isDatabaseFormatError(error);
}

async function openEncrypted(
  databaseName: string,
  encryptionKey: string,
): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(databaseName);

  try {
    await db.execAsync(`pragma key = ${quoteSqlString(encryptionKey)}`);
    const cipher = await db.getFirstAsync<{ cipher_version: string }>('pragma cipher_version');
    if (!cipher?.cipher_version) {
      throw new Error('SQLCipher não está ativo nesta build nativa.');
    }
    return db;
  } catch (error) {
    await db.closeAsync().catch(() => undefined);
    throw error;
  }
}

async function listUserTables(db: SQLite.SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ name: string }>(
    "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' order by name",
  );
  return rows.map((row) => row.name);
}

async function listIndexes(db: SQLite.SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ name: string }>(
    "select name from sqlite_master where type = 'index' and name not like 'sqlite_%' order by name",
  );
  return rows.map((row) => row.name);
}

async function tableColumns(db: SQLite.SQLiteDatabase, table: string): Promise<string[]> {
  const rows = await db.getAllAsync<{ name: string }>(
    `pragma table_info(${quoteSqlIdentifier(table)})`,
  );
  return rows.map((row) => row.name);
}

async function snapshotTable(
  db: SQLite.SQLiteDatabase,
  table: string,
  columns?: string[],
): Promise<TableSnapshot> {
  const selectedColumns = columns ?? (await tableColumns(db, table));
  if (selectedColumns.length === 0) {
    return { columns: [], rows: 0, digest: await digestRows([]) };
  }

  const quotedColumns = selectedColumns.map(quoteSqlIdentifier).join(', ');
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `select ${quotedColumns} from ${quoteSqlIdentifier(table)} order by rowid`,
  );

  return {
    columns: selectedColumns,
    rows: rows.length,
    digest: await digestRows(rows),
  };
}

async function digestRows(rows: unknown[]): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    JSON.stringify(rows),
  );
}

async function readUserVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('pragma user_version');
  return row?.user_version ?? 0;
}

async function inferSchemaVersion(
  db: SQLite.SQLiteDatabase,
  declaredVersion: number,
  tables: string[],
): Promise<number> {
  if (declaredVersion > MIGRACOES.length) {
    throw new Error(
      `Banco local está na versão ${declaredVersion}, mas o app conhece apenas ${MIGRACOES.length}.`,
    );
  }
  if (declaredVersion > 0) return declaredVersion;
  if (tables.length === 0) return 0;

  const crisisColumns = tables.includes('crise_enxaqueca')
    ? await tableColumns(db, 'crise_enxaqueca')
    : [];
  const hasQueueSchema = crisisColumns.includes('tentativas') && tables.includes('pendencias_orfas');
  if (hasQueueSchema) return Math.min(2, MIGRACOES.length);
  return Math.min(1, MIGRACOES.length);
}

async function applyMigrations(
  db: SQLite.SQLiteDatabase,
  sourceVersion: number,
): Promise<void> {
  await db.execAsync(`pragma user_version = ${sourceVersion}`);

  for (let i = sourceVersion; i < MIGRACOES.length; i += 1) {
    const destinationVersion = i + 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRACOES[i]);
      await db.execAsync(`pragma user_version = ${destinationVersion}`);
    });
  }
}

async function validateIntegrity(db: SQLite.SQLiteDatabase): Promise<void> {
  const integrity = await db.getFirstAsync<{ integrity_check: string }>('pragma integrity_check');
  if (integrity?.integrity_check !== 'ok') {
    throw new Error(`Integridade do banco temporário inválida: ${integrity?.integrity_check ?? 'desconhecida'}.`);
  }

  const tables = new Set(await listUserTables(db));
  for (const table of LOCAL_TABLES) {
    if (!tables.has(table)) {
      throw new Error(`Tabela obrigatória ausente no banco temporário: ${table}.`);
    }
  }

  const indexes = new Set(await listIndexes(db));
  for (const index of LOCAL_INDEXES) {
    if (!indexes.has(index)) {
      throw new Error(`Índice obrigatório ausente no banco temporário: ${index}.`);
    }
  }
}

async function exportPlaintextToEncrypted(
  source: SQLite.SQLiteDatabase,
  destinationPath: string,
  encryptionKey: string,
): Promise<void> {
  await source.execAsync(
    `attach database ${quoteSqlString(destinationPath)} as encrypted key ${quoteSqlString(encryptionKey)}`,
  );

  try {
    await source.getFirstAsync("select sqlcipher_export('encrypted') as exported");
  } finally {
    await source.execAsync('detach database encrypted');
  }
}

/**
 * Converte uma cópia plaintext em um arquivo SQLCipher temporário.
 *
 * Este módulo deliberadamente não integra com getDb(), não substitui o banco original e não
 * remove nenhum arquivo. As APIs atuais do expo-sqlite não oferecem uma operação de existência
 * sem abertura; por isso esta função deve ser chamada somente para um nome que o chamador já
 * confirmou existir. Um nome inexistente seria criado pelo SQLite como banco vazio.
 */
export async function migratePlaintextDatabase(
  databaseName: string,
  encryptionKey: string,
): Promise<PlaintextMigrationResult> {
  const source = await SQLite.openDatabaseAsync(databaseName);
  let temporary: SQLite.SQLiteDatabase | null = null;
  let temporaryName = '';

  try {
    const sourcePath = source.databasePath;
    let sourceTables: string[];
    try {
      sourceTables = await listUserTables(source);
    } catch (error) {
      if (isPlaintextProbeError(error)) {
        return {
          status: 'not-plaintext',
          reason: 'encrypted-or-unreadable',
          sourceDatabasePath: sourcePath,
        };
      }
      throw error;
    }

    const declaredVersion = await readUserVersion(source);
    const sourceVersion = await inferSchemaVersion(source, declaredVersion, sourceTables);
    const snapshots = new Map<string, TableSnapshot>();

    for (const table of sourceTables) {
      snapshots.set(table, await snapshotTable(source, table));
    }

    temporaryName = `${databaseName}.sqlcipher-migrating-${Crypto.randomUUID()}.db`;
    temporary = await openEncrypted(temporaryName, encryptionKey);
    const temporaryPath = temporary.databasePath;
    await temporary.closeAsync();
    temporary = null;

    await exportPlaintextToEncrypted(source, temporaryPath, encryptionKey);
    await source.closeAsync();

    temporary = await openEncrypted(temporaryName, encryptionKey);
    await applyMigrations(temporary, sourceVersion);
    await validateIntegrity(temporary);

    const resultTables: Record<string, { rows: number; digest: string }> = {};
    for (const [table, snapshot] of snapshots) {
      const migratedSnapshot = await snapshotTable(temporary, table, snapshot.columns);
      if (
        migratedSnapshot.rows !== snapshot.rows ||
        migratedSnapshot.digest !== snapshot.digest
      ) {
        throw new Error(`Dados divergentes após a migração da tabela ${table}.`);
      }
      resultTables[table] = {
        rows: migratedSnapshot.rows,
        digest: migratedSnapshot.digest,
      };
    }

    for (const table of LOCAL_TABLES) {
      if (!resultTables[table]) {
        const migratedSnapshot = await snapshotTable(temporary, table);
        resultTables[table] = {
          rows: migratedSnapshot.rows,
          digest: migratedSnapshot.digest,
        };
      }
    }

    return {
      status: 'migrated',
      sourceDatabasePath: sourcePath,
      destinationDatabaseName: temporaryName,
      destinationDatabasePath: temporaryPath,
      tables: resultTables,
    };
  } finally {
    await temporary?.closeAsync().catch(() => undefined);
    await source.closeAsync().catch(() => undefined);
  }
}
