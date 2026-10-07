import { useAuth } from '@/contexts/AuthContext';
import {
  NO_PIN_ATTEMPTS,
  clearPinAttempts,
  createAppLockConfig,
  clearLastUnlockedAt,
  getLastUnlockedAt,
  getAppLockConfig,
  getPinAttempts,
  isUnlockTimestampValid,
  recordPinFailure,
  removeAppLockConfig,
  setAppLockEnabled,
  setLastUnlockedAt,
  setBiometricEnabled,
  validateAppLockPin,
  type AppLockConfig,
  type PinAttempts,
} from '@/features/app-lock/appLockStore';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export const LOCK_TIMEOUT_MS = 4 * 60 * 60 * 1000;

export type AppLockStatus = 'loading' | 'configured' | 'locked' | 'unlocked';

type AppLockContextValue = {
  status: AppLockStatus;
  config: AppLockConfig | null;
  biometricAvailable: boolean;
  privacyCover: boolean;
  pinLockedUntil: number | null;
  configure: (pin: string, biometricEnabled: boolean) => Promise<void>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  setBiometric: (enabled: boolean) => Promise<void>;
  setEnabled: (enabled: boolean) => Promise<void>;
  enableWithPin: (pin: string) => Promise<boolean>;
  disable: () => Promise<void>;
};

const AppLockContext = createContext<AppLockContextValue>({
  status: 'loading',
  config: null,
  biometricAvailable: false,
  privacyCover: false,
  pinLockedUntil: null,
  configure: async () => {},
  unlockWithPin: async () => false,
  unlockWithBiometric: async () => false,
  setBiometric: async () => {},
  setEnabled: async () => {},
  enableWithPin: async () => false,
  disable: async () => {},
});

export function useAppLock(): AppLockContextValue {
  return useContext(AppLockContext);
}

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [status, setStatus] = useState<AppLockStatus>('loading');
  const [config, setConfig] = useState<AppLockConfig | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [privacyCover, setPrivacyCover] = useState(false);
  const [pinLockedUntil, setPinLockedUntil] = useState<number | null>(null);
  const configRef = useRef<AppLockConfig | null>(null);
  const attemptsRef = useRef<PinAttempts>(NO_PIN_ATTEMPTS);
  const userIdRef = useRef<string | null>(null);
  const lastUnlockedAtRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const previousUserId = userIdRef.current;
    userIdRef.current = userId;
    configRef.current = null;
    attemptsRef.current = NO_PIN_ATTEMPTS;
    lastUnlockedAtRef.current = null;
    setConfig(null);
    setPinLockedUntil(null);
    setBiometricAvailable(false);
    setStatus('loading');

    if (previousUserId && previousUserId !== userId) {
      void clearLastUnlockedAt(previousUserId).catch((error) => {
        console.error('Não foi possível invalidar o desbloqueio anterior:', error);
      });
    }

    if (!userId) {
      setStatus('configured');
      return () => {
        cancelled = true;
      };
    }

    void Promise.all([
      getAppLockConfig(userId),
      getPinAttempts(userId),
      getLastUnlockedAt(userId),
    ])
      .then(async ([storedConfig, storedAttempts, storedLastUnlockedAt]) => {
        if (cancelled || userIdRef.current !== userId) return;

        configRef.current = storedConfig;
        attemptsRef.current = storedAttempts;
        lastUnlockedAtRef.current = storedLastUnlockedAt;
        setConfig(storedConfig);
        setPinLockedUntil(storedAttempts.lockedUntil);
        if (!storedConfig) {
          setStatus('configured');
          return;
        }

        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = hasHardware && await LocalAuthentication.isEnrolledAsync();
        if (!cancelled && userIdRef.current === userId) {
          setBiometricAvailable(isEnrolled);
          if (!storedConfig.enabled) {
            lastUnlockedAtRef.current = null;
            void clearLastUnlockedAt(userId).catch((error) => {
              console.error('Não foi possível limpar o desbloqueio desativado:', error);
            });
            setStatus('configured');
          } else {
            setStatus(
              isUnlockTimestampValid(storedLastUnlockedAt, Date.now(), LOCK_TIMEOUT_MS)
                ? 'unlocked'
                : 'locked',
            );
          }
        }
      })
      .catch((error) => {
        console.error('Não foi possível carregar a configuração do AppLock:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        setPrivacyCover(true);
        return;
      }

      if (configRef.current?.enabled) {
        const unlocked = isUnlockTimestampValid(
          lastUnlockedAtRef.current,
          Date.now(),
          LOCK_TIMEOUT_MS,
        );
        setStatus(unlocked ? 'unlocked' : 'locked');
      } else if (configRef.current) {
        setStatus('configured');
      }
      setPrivacyCover(false);
    });

    return () => subscription.remove();
  }, []);

  const markUnlocked = useCallback(async () => {
    const currentUserId = userIdRef.current;
    if (!currentUserId) throw new Error('É necessário estar autenticado para desbloquear o AppLock.');

    const timestamp = Date.now();
    await setLastUnlockedAt(currentUserId, timestamp);
    if (userIdRef.current !== currentUserId) {
      await clearLastUnlockedAt(currentUserId);
      return;
    }
    lastUnlockedAtRef.current = timestamp;
    setStatus('unlocked');
  }, []);

  const resetAttempts = useCallback(async () => {
    const currentUserId = userIdRef.current;
    if (!currentUserId || attemptsRef.current.failures === 0) return;

    attemptsRef.current = NO_PIN_ATTEMPTS;
    setPinLockedUntil(null);
    try {
      await clearPinAttempts(currentUserId);
    } catch (error) {
      console.error('Não foi possível zerar as tentativas de PIN:', error);
    }
  }, []);

  const configure = useCallback(async (pin: string, biometricEnabled: boolean) => {
    if (!userIdRef.current) throw new Error('É necessário estar autenticado para configurar o AppLock.');

    const nextConfig = await createAppLockConfig(
      userIdRef.current,
      pin,
      biometricEnabled && biometricAvailable,
    );
    configRef.current = nextConfig;
    attemptsRef.current = NO_PIN_ATTEMPTS;
    setConfig(nextConfig);
    setPinLockedUntil(null);
    await markUnlocked();
  }, [biometricAvailable, markUnlocked]);

  const unlockWithPin = useCallback(async (pin: string): Promise<boolean> => {
    if (!configRef.current) return true;
    const currentUserId = userIdRef.current;
    if (!currentUserId) return false;

    const { lockedUntil } = attemptsRef.current;
    if (lockedUntil !== null && lockedUntil > Date.now()) return false;

    const valid = await validateAppLockPin(configRef.current, pin);
    if (valid) {
      await resetAttempts();
      await markUnlocked();
      return true;
    }

    const nextAttempts = await recordPinFailure(currentUserId, attemptsRef.current);
    attemptsRef.current = nextAttempts;
    setPinLockedUntil(nextAttempts.lockedUntil);
    return false;
  }, [markUnlocked, resetAttempts]);

  const unlockWithBiometric = useCallback(async (): Promise<boolean> => {
    if (!configRef.current?.biometricEnabled || !biometricAvailable) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquear Livo',
      fallbackLabel: 'Usar PIN',
      disableDeviceFallback: true,
    });
    if (result.success) {
      await resetAttempts();
      await markUnlocked();
    }
    return result.success;
  }, [biometricAvailable, markUnlocked, resetAttempts]);

  const setBiometric = useCallback(async (enabled: boolean) => {
    if (!userIdRef.current || !configRef.current) return;
    if (enabled && !configRef.current.enabled) {
      throw new Error('Ative a segurança do aplicativo antes de ativar a biometria.');
    }
    if (enabled && !biometricAvailable) {
      throw new Error('A biometria não está disponível neste dispositivo.');
    }
    const nextConfig = await setBiometricEnabled(userIdRef.current, configRef.current, enabled);
    configRef.current = nextConfig;
    setConfig(nextConfig);
  }, [biometricAvailable]);

  const setEnabled = useCallback(async (enabled: boolean) => {
    const currentUserId = userIdRef.current;
    const currentConfig = configRef.current;
    if (!currentUserId || !currentConfig) return;

    const nextConfig = await setAppLockEnabled(currentUserId, currentConfig, enabled);
    configRef.current = nextConfig;
    setConfig(nextConfig);

    if (!enabled) {
      await clearLastUnlockedAt(currentUserId);
      lastUnlockedAtRef.current = null;
      setStatus('configured');
    }
  }, []);

  const enableWithPin = useCallback(async (pin: string): Promise<boolean> => {
    const currentUserId = userIdRef.current;
    const currentConfig = configRef.current;
    if (!currentUserId || !currentConfig || currentConfig.enabled) return false;

    const { lockedUntil } = attemptsRef.current;
    if (lockedUntil !== null && lockedUntil > Date.now()) return false;

    const valid = await validateAppLockPin(currentConfig, pin);
    if (!valid) {
      const nextAttempts = await recordPinFailure(currentUserId, attemptsRef.current);
      attemptsRef.current = nextAttempts;
      setPinLockedUntil(nextAttempts.lockedUntil);
      return false;
    }

    await resetAttempts();
    const nextConfig = await setAppLockEnabled(currentUserId, currentConfig, true);
    configRef.current = nextConfig;
    setConfig(nextConfig);
    await markUnlocked();
    return true;
  }, [markUnlocked, resetAttempts]);

  const disable = useCallback(async () => {
    if (!userIdRef.current) return;
    await removeAppLockConfig(userIdRef.current);
    await clearLastUnlockedAt(userIdRef.current);
    configRef.current = null;
    attemptsRef.current = NO_PIN_ATTEMPTS;
    lastUnlockedAtRef.current = null;
    setConfig(null);
    setPinLockedUntil(null);
    setStatus('configured');
  }, []);

  return (
    <AppLockContext.Provider
      value={{
        status,
        config,
        biometricAvailable,
        privacyCover,
        pinLockedUntil,
        configure,
        unlockWithPin,
        unlockWithBiometric,
        setBiometric,
        setEnabled,
        enableWithPin,
        disable,
      }}
    >
      {children}
    </AppLockContext.Provider>
  );
}
