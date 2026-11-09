import { Link, Stack } from 'expo-router';
import { CircleAlert } from 'lucide-react-native';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Screen from '@/components/ui/Screen';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Screen className="justify-center">
        <EmptyState icon={CircleAlert} title="Essa tela não existe." />
        <Link href="/" asChild>
          <Button title="Ir para o início" variant="secondary" />
        </Link>
      </Screen>
    </>
  );
}
