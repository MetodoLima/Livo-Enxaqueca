import { useMemo, type ReactNode } from 'react';
import { Image, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarDays, Droplets, Moon } from 'lucide-react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import IconBadge from '@/components/ui/IconBadge';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Text from '@/components/ui/Text';
import { MOODS } from '@/constants/data';
import { formatDiaPorExtenso, formatLitros, formatSleep, formatTime, moodLabel } from '@/lib/format';
import type { RegistroCalendarDay } from '@/features/daily-record/useDailyRecordCalendar';

function Valor({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View className="flex-1 gap-1">
      <Text variant="caption" weight="semibold" tone="muted">
        {rotulo}
      </Text>
      <Text weight="semibold">{valor}</Text>
    </View>
  );
}

function Secao({ delay, reduceMotion, children }: { delay: number; reduceMotion: boolean; children: ReactNode }) {
  return (
    <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(delay).duration(300)}>
      <Card padding="sm" className="gap-3">
        {children}
      </Card>
    </Animated.View>
  );
}

export default function DailyRecordDetailScreen() {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; data: string }>();

  const registro = useMemo<RegistroCalendarDay | null>(() => {
    try {
      return JSON.parse(params.data);
    } catch {
      return null;
    }
  }, [params.data]);

  if (!registro) {
    return (
      <Screen>
        <ScreenHeader title="Detalhes do evento" onBack={() => router.back()} />
        <EmptyState
          icon={CalendarDays}
          title="Registro não encontrado."
          message="Ele pode ter sido removido em outro aparelho."
          className="py-6"
        />
      </Screen>
    );
  }

  const criadoEm = new Date(registro.createdAt);
  const humor = registro.humor ? MOODS.find((m) => m.id === registro.humor) : undefined;

  return (
    <Screen scroll>
      <ScreenHeader
        title="Detalhes do evento"
        subtitle={`${formatDiaPorExtenso(criadoEm)} · ${formatTime(criadoEm)}`}
        onBack={() => router.back()}
      />

      <View className="gap-4">
        {registro.humor ? (
          <Secao delay={0} reduceMotion={reduceMotion}>
            <View className="flex-row items-center gap-4" accessible accessibilityLabel={`Humor: ${moodLabel(registro.humor)}`}>
              {humor ? (
                <Image source={humor.image} className="h-14 w-14" resizeMode="contain" accessibilityIgnoresInvertColors />
              ) : null}
              <Valor rotulo="Humor" valor={moodLabel(registro.humor)} />
            </View>
          </Secao>
        ) : null}

        {registro.horasSono !== null || registro.mlAgua !== null ? (
          <Secao delay={80} reduceMotion={reduceMotion}>
            <Text variant="heading">Rotina</Text>
            {registro.horasSono !== null ? (
              <View className="flex-row items-center gap-3" accessible accessibilityLabel={`Sono: ${formatSleep(registro.horasSono)}`}>
                <IconBadge icon={Moon} tone="secondary" />
                <Valor rotulo="Sono" valor={formatSleep(registro.horasSono)} />
              </View>
            ) : null}
            {registro.mlAgua !== null ? (
              <View className="flex-row items-center gap-3" accessible accessibilityLabel={`Água: ${formatLitros(registro.mlAgua)}`}>
                <IconBadge icon={Droplets} tone="primary" />
                <Valor rotulo="Água" valor={formatLitros(registro.mlAgua)} />
              </View>
            ) : null}
          </Secao>
        ) : null}

        {registro.relato ? (
          <Secao delay={160} reduceMotion={reduceMotion}>
            <Text variant="heading">Relato</Text>
            <Text>{registro.relato}</Text>
          </Secao>
        ) : null}
      </View>
    </Screen>
  );
}
