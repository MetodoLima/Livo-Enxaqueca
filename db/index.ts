import * as SQLite from 'expo-sqlite';
import { MIGRACOES } from './schema';
import { getDatabaseEncryptionKey } from './encryptionKey';

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
  const encryptionKey = await getDatabaseEncryptionKey();
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  try {
    // A chave precisa ser aplicada antes de qualquer leitura, inclusive PRAGMA user_version.
    // A chave é um valor hexadecimal gerado internamente, mas a aspa é escapada para manter a
    // fronteira segura caso a origem da chave mude no futuro.
    const escapedKey = encryptionKey.replaceAll("'", "''");
    await db.execAsync(`pragma key = '${escapedKey}'`);

    const estado = await validarBancoCriptografado(db);
    if (estado === 'legacy-plaintext') {
      throw new Error(
        'Banco local antigo sem SQLCipher detectado; a migração ainda não foi implementada.',
      );
    }
    if (estado === 'sqlcipher-unavailable') {
      throw new Error(
        'SQLCipher não está ativo nesta build nativa; uma development build é necessária.',
      );
    }

    // Fora das migracoes de proposito: journal_mode e ajuste de conexao e nao roda dentro de
    // transacao.
    await db.execAsync('pragma journal_mode = WAL');
    await migrar(db);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('migração ainda não foi implementada') ||
        error.message.includes('SQLCipher não está ativo'))
    ) {
      throw error;
    }

    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Não foi possível validar o banco local com SQLCipher. ` +
        `O arquivo pode ser legado sem criptografia ou estar corrompido; migração não executada. ` +
        `Detalhe: ${detail}`,
    );
  }

  return db;
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
