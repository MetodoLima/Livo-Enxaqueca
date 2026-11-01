import { crisisRepository } from '@/repositories';
import { useSync } from '@/contexts/SyncContext';
import { tempoSemEnxaqueca } from '@/lib/format';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import Text from '@/components/ui/Text';

export default function CrisisEmptyState() {
  const router = useRouter();
  const { ultimaAtualizacao } = useSync();
  const [ultimoFim, setUltimoFim] = useState<Date | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const lastEnd = await crisisRepository.lastEndedAt();
        if (cancelled) return;
        setUltimoFim(lastEnd);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [ultimaAtualizacao]);

  const timeSinceLabel = ultimoFim ? tempoSemEnxaqueca(ultimoFim) : null;

  return (
    <Screen className="items-center justify-center gap-6">
      <Image
        source={require('@/assets/images/LivoMeditar.png')}
        resizeMode="contain"
        className="h-44 w-44"
        accessibilityLabel="Mascote Livo meditando"
      />

      <View className="items-center gap-3">
        <Text variant="title" className="text-center">
          Tudo tranquilo!
        </Text>
        {timeSinceLabel ? (
          <Text variant="heading" className="text-center">
            Você está há {timeSinceLabel} sem crises
          </Text>
        ) : ultimoFim === null ? (
          <Text variant="heading" className="text-center">
            Nenhuma crise registrada
          </Text>
        ) : null}
        <Text tone="muted" className="text-center">
          Continue assim! Caso tenha uma crise, registre aqui para acompanhar seu progresso.
        </Text>
      </View>

      <View className="items-center gap-3 self-stretch">
        <Button
          title="Registrar Crise"
          accessibilityLabel="Registrar uma nova crise"
          onPress={() => router.push('/record-crisis')}
          className="self-stretch"
        />
        <Text variant="caption" tone="muted" className="text-center">
          Ou toque no botão abaixo
        </Text>
      </View>
    </Screen>
  );
}
