import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center p-5 bg-bg-dark">
        <Text className="text-xl text-white font-epilogue-bold">Essa tela não existe.</Text>
        <Link href="/" className="mt-4 py-4">
          <Text className="text-sm text-accent font-epilogue">Ir para o início</Text>
        </Link>
      </View>
    </>
  );
}
