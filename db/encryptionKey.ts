import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const SECURE_STORE_KEY = 'livo.sqlite.encryption-key';
const KEY_BYTES = 32;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function isValidKey(value: string | null): value is string {
  return value !== null && /^[0-9a-f]{64}$/.test(value);
}

/**
 * Retorna a chave estável do banco local.
 *
 * A chave só existe no SecureStore. Ela não é derivada de sessão, usuário, código-fonte ou
 * configuração do app, porque qualquer um desses valores poderia mudar sem que o banco mudasse.
 */
export async function getDatabaseEncryptionKey(): Promise<string> {
  try {
    const storedKey = await SecureStore.getItemAsync(SECURE_STORE_KEY);
    if (storedKey !== null && !isValidKey(storedKey)) {
      throw new Error('A chave armazenada do banco local está inválida.');
    }
    if (isValidKey(storedKey)) return storedKey;

    const generatedKey = bytesToHex(await Crypto.getRandomBytesAsync(KEY_BYTES));
    await SecureStore.setItemAsync(SECURE_STORE_KEY, generatedKey);

    const persistedKey = await SecureStore.getItemAsync(SECURE_STORE_KEY);
    if (persistedKey !== generatedKey) {
      throw new Error('A chave do banco local não pôde ser confirmada no SecureStore.');
    }

    return generatedKey;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Não foi possível obter a chave do banco local: ${detail}`);
  }
}
