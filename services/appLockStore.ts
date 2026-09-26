import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const STORAGE_PREFIX = 'livo.app-lock.';

export type AppLockConfig = {
  version: 1;
  enabled: true;
  pinSalt: string;
  pinDigest: string;
  biometricEnabled: boolean;
};

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

async function digestPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${pin}`,
  );
}

export async function getAppLockConfig(userId: string): Promise<AppLockConfig | null> {
  const raw = await SecureStore.getItemAsync(storageKey(userId));
  if (!raw) return null;

  try {
    const config = JSON.parse(raw) as Partial<AppLockConfig>;
    if (
      config.version !== 1 ||
      config.enabled !== true ||
      typeof config.pinSalt !== 'string' ||
      typeof config.pinDigest !== 'string' ||
      typeof config.biometricEnabled !== 'boolean'
    ) {
      throw new Error('formato inválido');
    }
    return config as AppLockConfig;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`A configuração de AppLock está inválida. Detalhe: ${detail}`);
  }
}

export async function createAppLockConfig(
  userId: string,
  pin: string,
  biometricEnabled: boolean,
): Promise<AppLockConfig> {
  if (!isValidPin(pin)) {
    throw new Error('O PIN deve conter de 4 a 6 dígitos.');
  }

  const pinSalt = bytesToHex(await Crypto.getRandomBytesAsync(16));
  const pinDigest = await digestPin(pin, pinSalt);
  const config: AppLockConfig = {
    version: 1,
    enabled: true,
    pinSalt,
    pinDigest,
    biometricEnabled,
  };

  await SecureStore.setItemAsync(storageKey(userId), JSON.stringify(config));
  return config;
}

export async function validateAppLockPin(
  config: AppLockConfig,
  pin: string,
): Promise<boolean> {
  if (!isValidPin(pin)) return false;
  const digest = await digestPin(pin, config.pinSalt);
  return digest === config.pinDigest;
}

export async function setBiometricEnabled(
  userId: string,
  config: AppLockConfig,
  biometricEnabled: boolean,
): Promise<AppLockConfig> {
  const updatedConfig: AppLockConfig = { ...config, biometricEnabled };
  await SecureStore.setItemAsync(storageKey(userId), JSON.stringify(updatedConfig));
  return updatedConfig;
}

export async function removeAppLockConfig(userId: string): Promise<void> {
  await SecureStore.deleteItemAsync(storageKey(userId));
}
