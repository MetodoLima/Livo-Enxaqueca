import { Stack } from 'expo-router';
import { SetupProvider } from '@/features/onboarding/SetupContext';

export default function SetupLayout() {
  return (
    <SetupProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SetupProvider>
  );
}