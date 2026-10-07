import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const STORAGE_PREFIX = 'livo.app-lock.';
const ATTEMPTS_PREFIX = 'livo.app-lock-attempts.';
const LAST_UNLOCKED_PREFIX = 'livo.app-lock-last-unlocked.';

const FREE_PIN_ATTEMPTS = 5;
const BASE_PIN_DELAY_MS = 30 * 1000;
const MAX_PIN_DELAY_MS = 60 * 60 * 1000;

export type AppLockConfig = {
  version: 1;
  enabled: boolean;
  pinSalt: string;
  pinDigest: string;
  biometricEnabled: boolean;
};

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

function lastUnlockedKey(userId: string): string {
  return `${LAST_UNLOCKED_PREFIX}${userId}`;
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
      typeof config.enabled !== 'boolean' ||
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

export async function setAppLockEnabled(
  userId: string,
  config: AppLockConfig,
  enabled: boolean,
): Promise<AppLockConfig> {
  const updatedConfig: AppLockConfig = {
    ...config,
    enabled,
    biometricEnabled: enabled && config.enabled ? config.biometricEnabled : false,
  };
  await SecureStore.setItemAsync(storageKey(userId), JSON.stringify(updatedConfig));
  return updatedConfig;
}

export async function getLastUnlockedAt(userId: string): Promise<number | null> {
  const raw = await SecureStore.getItemAsync(lastUnlockedKey(userId));
  if (!raw) return null;

  const timestamp = Number(raw);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function isUnlockTimestampValid(
  timestamp: number | null,
  now: number,
  timeoutMs: number,
): timestamp is number {
  if (timestamp === null || !Number.isFinite(timestamp)) return false;
  if (timestamp > now) return false;
  return now - timestamp < timeoutMs;
}

export function setLastUnlockedAt(userId: string, timestamp: number): Promise<void> {
  return SecureStore.setItemAsync(lastUnlockedKey(userId), String(timestamp));
}

export function clearLastUnlockedAt(userId: string): Promise<void> {
  return SecureStore.deleteItemAsync(lastUnlockedKey(userId));
}

export async function removeAppLockConfig(userId: string): Promise<void> {
  await SecureStore.deleteItemAsync(storageKey(userId));
  await clearPinAttempts(userId);
}

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
    return { failures: FREE_PIN_ATTEMPTS, lockedUntil: null };
  }
}

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
