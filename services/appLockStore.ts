import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const STORAGE_PREFIX = 'livo.app-lock.';
const ATTEMPTS_PREFIX = 'livo.app-lock-attempts.';

// Um PIN de 4 dígitos tem 10 mil combinações. Sem limite, dá para testar todas à mão numa
// tarde. As primeiras erradas são livres, porque errar o PIN é comum; depois disso cada erro
// dobra a espera, até uma hora.
const FREE_PIN_ATTEMPTS = 5;
const BASE_PIN_DELAY_MS = 30 * 1000;
const MAX_PIN_DELAY_MS = 60 * 60 * 1000;

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
  await clearPinAttempts(userId);
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
  await clearPinAttempts(userId);
}

// ── Tentativas de PIN ──────────────────────────────────────────────────
// Ficam no SecureStore, e não em memória, para que fechar e abrir o app não zere a contagem.

export type PinAttempts = {
  failures: number;
  lockedUntil: number | null;
};

export const NO_PIN_ATTEMPTS: PinAttempts = { failures: 0, lockedUntil: null };

function attemptsKey(userId: string): string {
  return `${ATTEMPTS_PREFIX}${userId}`;
}

export async function getPinAttempts(userId: string): Promise<PinAttempts> {
  const raw = await SecureStore.getItemAsync(attemptsKey(userId));
  if (!raw) return NO_PIN_ATTEMPTS;

  try {
    const stored = JSON.parse(raw) as Partial<PinAttempts>;
    if (
      typeof stored.failures !== 'number' ||
      (stored.lockedUntil !== null && typeof stored.lockedUntil !== 'number')
    ) {
      throw new Error('formato inválido');
    }
    return { failures: stored.failures, lockedUntil: stored.lockedUntil };
  } catch {
    // Registro ilegível não pode virar contagem zerada, senão corromper o valor seria um jeito
    // de ganhar tentativas livres. Volta no limite: o próximo erro já impõe espera.
    return { failures: FREE_PIN_ATTEMPTS, lockedUntil: null };
  }
}

/** Grava o erro antes de devolver, para que matar o app logo depois não apague a tentativa. */
export async function recordPinFailure(userId: string, current: PinAttempts): Promise<PinAttempts> {
  const failures = current.failures + 1;
  const delay = failures < FREE_PIN_ATTEMPTS
    ? 0
    : Math.min(BASE_PIN_DELAY_MS * 2 ** (failures - FREE_PIN_ATTEMPTS), MAX_PIN_DELAY_MS);
  const next: PinAttempts = { failures, lockedUntil: delay > 0 ? Date.now() + delay : null };

  await SecureStore.setItemAsync(attemptsKey(userId), JSON.stringify(next));
  return next;
}

export async function clearPinAttempts(userId: string): Promise<void> {
  await SecureStore.deleteItemAsync(attemptsKey(userId));
}
