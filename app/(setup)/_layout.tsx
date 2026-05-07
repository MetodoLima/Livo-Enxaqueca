import { Stack } from 'expo-router';
import { SetupProvider } from '../../contexts/SetupContext';

export default function SetupLayout() {
  return (
    <SetupProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SetupProvider>
  );
}