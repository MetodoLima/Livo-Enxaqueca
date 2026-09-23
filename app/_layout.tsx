import "../global.css";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AppState, AppStateStatus } from 'react-native';
import { useCallback, useEffect, useRef } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { CrisisProvider } from '@/contexts/CrisisContext';
import { SyncProvider } from '@/contexts/SyncContext';
import { ConnectivityProvider } from '@/contexts/ConnectivityContext';
import { useConnectivity } from '@/hooks/useConnectivity';
import { supabase } from '@/lib/supabase';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';

import {
  Epilogue_300Light,
  Epilogue_400Regular,
  Epilogue_500Medium,
  Epilogue_600SemiBold,
  Epilogue_700Bold,
} from '@expo-google-fonts/epilogue';
import { Colors } from '@/constants/Colors';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)', 
};

SplashScreen.preventAutoHideAsync();

const LivoTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.bgDark,
    card: Colors.bgDark,
  },
};

function AuthRefreshCoordinator() {
  const { status: connectivityStatus } = useConnectivity();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const connectivityRef = useRef(connectivityStatus);
  const desiredRefreshRef = useRef(false);
  const appliedRefreshRef = useRef<boolean | null>(null);
  const operationRef = useRef<Promise<void> | null>(null);
  const mountedRef = useRef(true);

  const reconcileRefresh = useCallback((desiredRefresh: boolean) => {
    desiredRefreshRef.current = desiredRefresh;

    if (operationRef.current) return;

    const operation = (async () => {
      while (mountedRef.current && appliedRefreshRef.current !== desiredRefreshRef.current) {
        const nextRefresh = desiredRefreshRef.current;

        try {
          if (nextRefresh) {
            await supabase.auth.startAutoRefresh();
          } else {
            await supabase.auth.stopAutoRefresh();
          }
        } catch {
          // Keep the coordinator alive without retrying this transition itself.
        }

        appliedRefreshRef.current = nextRefresh;
      }
    })();

    operationRef.current = operation.finally(() => {
      operationRef.current = null;

      if (
        mountedRef.current &&
        appliedRefreshRef.current !== desiredRefreshRef.current
      ) {
        reconcileRefresh(desiredRefreshRef.current);
      }
    });
  }, []);

  useEffect(() => {
    connectivityRef.current = connectivityStatus;
    reconcileRefresh(
      appStateRef.current === 'active' && connectivityStatus === 'online',
    );
  }, [connectivityStatus, reconcileRefresh]);

  useEffect(() => {
    mountedRef.current = true;

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appStateRef.current = nextAppState;
      reconcileRefresh(
        nextAppState === 'active' && connectivityRef.current === 'online',
      );
    });

    return () => {
      mountedRef.current = false;
      subscription.remove();
      void supabase.auth.stopAutoRefresh().catch(() => undefined);
    };
  }, [reconcileRefresh]);

  return null;
}

function RootLayoutNav() {
  const {
    localSession,
    localSessionStatus,
    isSetupCompleted,
    offlineSessionStatus,
  } = useAuth();
  const { status: connectivityStatus } = useConnectivity();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (localSessionStatus === 'loading' || !navigationState?.key) return;

    const inAuthGroup = String(segments[0]) === '(auth)';
    const inSetupGroup = String(segments[0]) === '(setup)';

    const offlineSessionAccepted =
      connectivityStatus !== 'offline' || offlineSessionStatus === 'within_tolerance';

    if (!localSession || !offlineSessionAccepted) {
      if (!inAuthGroup) {
        router.replace('/login' as any);
      }
    } else {
      // Wait for connectivity before deciding setup status for a local session.
      // Unknown is not offline; this only prevents a premature redirect.
      if (connectivityStatus === 'unknown') return;

      if (inAuthGroup) {
        if (!isSetupCompleted) {
          router.replace('/(setup)/step1' as any);
        } else {
          router.replace('/(tabs)' as any);
        }
      } else if (!isSetupCompleted && !inSetupGroup) {
        router.replace('/(setup)/step1' as any);
      } else if (isSetupCompleted && inSetupGroup) {
        router.replace('/(tabs)' as any);
      }
    }
  }, [
    localSession,
    localSessionStatus,
    connectivityStatus,
    offlineSessionStatus,
    segments,
    isSetupCompleted,
    navigationState?.key,
  ]);

  return (
    <ThemeProvider value={LivoTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(setup)" options={{ headerShown: false }} />
        <Stack.Screen name="emergency" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="record-crisis" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="crisis/[id]" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Epilogue_300Light,
    Epilogue_400Regular,
    Epilogue_500Medium,
    Epilogue_600SemiBold,
    Epilogue_700Bold,
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConnectivityProvider>
        <AuthRefreshCoordinator />
        <AuthProvider>
          <SyncProvider>
            <CrisisProvider>
              <RootLayoutNav />
            </CrisisProvider>
          </SyncProvider>
        </AuthProvider>
      </ConnectivityProvider>
    </GestureHandlerRootView>
  );
}
