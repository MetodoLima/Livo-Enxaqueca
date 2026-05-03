import "../global.css";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
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
  initialRouteName: '(tabs)', // caso seja necessário testar o setup troque '(tabs)' para '(setup)'
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

function RootLayoutNav() {
  const { session, loading, isSetupCompleted } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Aguarda o carregamento da sessão e a montagem completa da árvore de navegação
    if (loading || !navigationState?.key) return;

    const inAuthGroup = String(segments[0]) === '(auth)';
    const inSetupGroup = String(segments[0]) === '(setup)';

    if (!session) {
      if (!inAuthGroup) {
        router.replace('/login' as any);
      }
    } else {
      // Usuário logado
      if (inAuthGroup) {
        // Se estiver na tela de login/registro
        if (!isSetupCompleted) {
          router.replace('/(setup)/step1' as any);
        } else {
          router.replace('/(tabs)' as any);
        }
      } else if (!isSetupCompleted && !inSetupGroup) {
        // Se logado, setup não completado, e não está no fluxo de setup
        router.replace('/(setup)/step1' as any);
      } else if (isSetupCompleted && inSetupGroup) {
        // Se logado, setup completado, e ainda está no fluxo de setup (acabou de concluir)
        router.replace('/(tabs)' as any);
      }
    }
  }, [session, loading, segments, isSetupCompleted, navigationState?.key]);

  return (
    <ThemeProvider value={LivoTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(setup)" options={{ headerShown: false }} />
        <Stack.Screen name="emergency" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="record-crisis" options={{ presentation: 'modal', headerShown: false }} />
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
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
