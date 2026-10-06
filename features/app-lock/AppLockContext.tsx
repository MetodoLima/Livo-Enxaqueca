import { useAuth } from '@/contexts/AuthContext';
import {
  NO_PIN_ATTEMPTS,
  clearPinAttempts,
  createAppLockConfig,
  getAppLockConfig,
  getPinAttempts,
  recordPinFailure,
  removeAppLockConfig,
  setBiometricEnabled,
  validateAppLockPin,
  type AppLockConfig,
  type PinAttempts,
} from '@/features/app-lock/appLockStore';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

const LOCK_GRACE_MS = 60 * 1000;

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
  const leftForegroundAtRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    userIdRef.current = userId;
    configRef.current = null;
    attemptsRef.current = NO_PIN_ATTEMPTS;
    setConfig(null);
    setPinLockedUntil(null);
    setBiometricAvailable(false);
    setStatus('loading');

    if (!userId) {
      setStatus('configured');
      return () => {
        cancelled = true;
      };
    }

    void Promise.all([getAppLockConfig(userId), getPinAttempts(userId)])
      .then(async ([storedConfig, storedAttempts]) => {
        if (cancelled || userIdRef.current !== userId) return;

        configRef.current = storedConfig;
        attemptsRef.current = storedAttempts;
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
          setStatus('locked');
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
        if (leftForegroundAtRef.current === null) leftForegroundAtRef.current = Date.now();
        setPrivacyCover(true);
        return;
      }

      const leftAt = leftForegroundAtRef.current;
      leftForegroundAtRef.current = null;
      if (leftAt !== null && configRef.current) {
        const elapsed = Date.now() - leftAt;
        if (elapsed < 0 || elapsed >= LOCK_GRACE_MS) setStatus('locked');
      }
      setPrivacyCover(false);
    });

    return () => subscription.remove();
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
    setStatus('unlocked');
  }, [biometricAvailable]);

  const unlockWithPin = useCallback(async (pin: string): Promise<boolean> => {
    if (!configRef.current) return true;
    const currentUserId = userIdRef.current;
    if (!currentUserId) return false;

    const { lockedUntil } = attemptsRef.current;
    if (lockedUntil !== null && lockedUntil > Date.now()) return false;

    const valid = await validateAppLockPin(configRef.current, pin);
    if (valid) {
      await resetAttempts();
      setStatus('unlocked');
      return true;
    }

    const nextAttempts = await recordPinFailure(currentUserId, attemptsRef.current);
    attemptsRef.current = nextAttempts;
    setPinLockedUntil(nextAttempts.lockedUntil);
    return false;
  }, [resetAttempts]);

  const unlockWithBiometric = useCallback(async (): Promise<boolean> => {
    if (!configRef.current?.biometricEnabled || !biometricAvailable) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquear Livo',
      fallbackLabel: 'Usar PIN',
      disableDeviceFallback: true,
    });
    if (result.success) {
      await resetAttempts();
      setStatus('unlocked');
    }
    return result.success;
  }, [biometricAvailable, resetAttempts]);

  const setBiometric = useCallback(async (enabled: boolean) => {
    if (!userIdRef.current || !configRef.current) return;
    const nextConfig = await setBiometricEnabled(userIdRef.current, configRef.current, enabled);
    configRef.current = nextConfig;
    setConfig(nextConfig);
  }, []);

  const disable = useCallback(async () => {
    if (!userIdRef.current) return;
    await removeAppLockConfig(userIdRef.current);
    configRef.current = null;
    attemptsRef.current = NO_PIN_ATTEMPTS;
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
        disable,
      }}
    >
      {children}
    </AppLockContext.Provider>
  );
}
