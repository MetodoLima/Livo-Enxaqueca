import AsyncStorage from '@react-native-async-storage/async-storage';

export const OFFLINE_TOLERANCE_MS = 3 * 24 * 60 * 60 * 1000;

export type OfflineSessionStatus = 'within_tolerance' | 'expired' | 'unknown';

const getStorageKey = (userId: string) => `livo.auth.lastValidatedAt.${userId}`;

export async function getLastValidatedAt(userId: string): Promise<number | null> {
  const storedValue = await AsyncStorage.getItem(getStorageKey(userId));
  if (!storedValue) return null;

  const timestamp = Number(storedValue);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function getOfflineSessionStatus(
  lastValidatedAt: number | null,
  now = Date.now(),
): OfflineSessionStatus {
  if (lastValidatedAt === null) return 'unknown';

  return now <= lastValidatedAt + OFFLINE_TOLERANCE_MS
    ? 'within_tolerance'
    : 'expired';
}

export function setLastValidatedAt(userId: string, timestamp: number): Promise<void> {
  return AsyncStorage.setItem(getStorageKey(userId), String(timestamp));
}

export function removeLastValidatedAt(userId: string): Promise<void> {
  return AsyncStorage.removeItem(getStorageKey(userId));
}
