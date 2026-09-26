import * as LocalAuthentication from 'expo-local-authentication';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import {
  createAppLockConfig,
  getAppLockConfig,
  removeAppLockConfig,
  setBiometricEnabled,
  validateAppLockPin,
  type AppLockConfig,
} from '@/services/appLockStore';

export type AppLockStatus = 'loading' | 'configured' | 'locked' | 'unlocked';

type AppLockContextValue = {
  status: AppLockStatus;
  config: AppLockConfig | null;
  biometricAvailable: boolean;
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
  const configRef = useRef<AppLockConfig | null>(null);
  const userIdRef = useRef<string | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    let cancelled = false;
    userIdRef.current = userId;
    configRef.current = null;
    setConfig(null);
    setBiometricAvailable(false);
    setStatus('loading');

    if (!userId) {
      setStatus('configured');
      return () => {
        cancelled = true;
      };
    }

    void getAppLockConfig(userId)
      .then(async (storedConfig) => {
        if (cancelled || userIdRef.current !== userId) return;

        configRef.current = storedConfig;
        setConfig(storedConfig);
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
        // Falha ao ler o SecureStore não pode ser tratada como ausência de AppLock.
        // Mantemos o estado de loading para não liberar os dados protegidos.
        console.error('Não foi possível carregar a configuração do AppLock:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasActive = appStateRef.current === 'active';
      appStateRef.current = nextState;

      if (wasActive && nextState !== 'active' && configRef.current) {
        setStatus('locked');
      }
    });

    return () => subscription.remove();
  }, []);

  const configure = useCallback(async (pin: string, biometricEnabled: boolean) => {
    if (!userIdRef.current) throw new Error('É necessário estar autenticado para configurar o AppLock.');

    const nextConfig = await createAppLockConfig(
      userIdRef.current,
      pin,
      biometricEnabled && biometricAvailable,
    );
    configRef.current = nextConfig;
    setConfig(nextConfig);
    setStatus('unlocked');
  }, [biometricAvailable]);

  const unlockWithPin = useCallback(async (pin: string): Promise<boolean> => {
    if (!configRef.current) return true;
    const valid = await validateAppLockPin(configRef.current, pin);
    if (valid) setStatus('unlocked');
    return valid;
  }, []);

  const unlockWithBiometric = useCallback(async (): Promise<boolean> => {
    if (!configRef.current?.biometricEnabled || !biometricAvailable) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquear Livo',
      fallbackLabel: 'Usar PIN',
      disableDeviceFallback: true,
    });
    if (result.success) setStatus('unlocked');
    return result.success;
  }, [biometricAvailable]);

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
    setConfig(null);
    setStatus('configured');
  }, []);

  return (
    <AppLockContext.Provider
      value={{
        status,
        config,
        biometricAvailable,
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
