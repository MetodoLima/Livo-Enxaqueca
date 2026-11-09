import { useMemo } from 'react';
import { Image, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Text from '@/components/ui/Text';
import { formatDateTime, formatDiaPorExtenso, formatDuration, formatTime, intensityLabel } from '@/lib/format';
import type { CrisisPhase } from '@/features/crisis/useCrisisCalendar';
import { IntensityMarker, imagemDa } from '@/features/crisis/components/IntensityScale';
import PhaseDetailCard from '@/features/crisis/components/PhaseDetailCard';

function Linha({ rotulo, valor, forte = false }: { rotulo: string; valor: string; forte?: boolean }) {
  return (
    <View className="flex-row flex-wrap items-center justify-between gap-x-3">
      <Text tone="muted">{rotulo}</Text>
      <Text weight={forte ? 'bold' : 'semibold'}>{valor}</Text>
    </View>
  );
}

const mesmoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function CrisisDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; data: string }>();

  const crisis = useMemo(() => {
    try {
      const parsed = JSON.parse(params.data);
      return {
        ...parsed,
        inicioCrise: new Date(parsed.inicioCrise),
        fimCrise: parsed.fimCrise ? new Date(parsed.fimCrise) : null,
        fases: parsed.fases ?? [],
      };
    } catch {
      return null;
    }
  }, [params.data]);

  if (!crisis) {
    return (
      <Screen>
        <ScreenHeader title="Detalhes da crise" onBack={() => router.back()} />
        <EmptyState
          icon={CalendarDays}
          title="Crise não encontrada."
          message="Ela pode ter sido removida em outro aparelho."
          className="py-6"
        />
      </Screen>
    );
  }

  const maxIntensidade: number | null = crisis.intensidadeDor;
  const fases: CrisisPhase[] = crisis.fases;
  const inicio: Date = crisis.inicioCrise;
  const fim: Date | null = crisis.fimCrise;
  const inicioTexto = formatTime(inicio);
  const fimTexto = fim ? (mesmoDia(inicio, fim) ? formatTime(fim) : formatDateTime(fim)) : 'Em andamento';
  const duracao = formatDuration(inicio, fim);

  return (
    <Screen scroll>
      <ScreenHeader title="Detalhes da crise" subtitle={formatDiaPorExtenso(inicio)} onBack={() => router.back()} />

      <View className="gap-4">
        <Card padding="sm">
          <View
            className="flex-row items-center gap-4"
            accessible
            accessibilityLabel={`Pico de intensidade: ${
              maxIntensidade !== null ? `${maxIntensidade} de 10, ${intensityLabel(maxIntensidade)}` : 'não registrado'
            }`}
          >
            {maxIntensidade !== null ? (
              <Image
                source={imagemDa(maxIntensidade)}
                className="h-20 w-20"
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            ) : null}
            <View className="flex-1 gap-1">
              {maxIntensidade !== null ? (
                <IntensityMarker value={maxIntensidade} />
              ) : (
                <Text weight="semibold">Não registrada</Text>
              )}
              <Text variant="caption" tone="muted">
                pico de intensidade
              </Text>
            </View>
          </View>
        </Card>

        <Card padding="sm" className="gap-3">
          <Text variant="heading">Tempo</Text>
          <Linha rotulo="Início" valor={inicioTexto} />
          <Linha rotulo="Fim" valor={fimTexto} />
          <Linha rotulo="Duração total" valor={duracao} forte />
        </Card>

        <View className="gap-3 pt-2">
          <Text variant="heading">Fases da crise</Text>
          {fases.length > 0 ? (
            fases.map((fase, i) => <PhaseDetailCard key={fase.id} phase={fase} index={i} />)
          ) : (
            <Card padding="sm">
              <Text tone="muted" className="text-center">
                Nenhuma fase registrada
              </Text>
            </Card>
          )}
        </View>
      </View>
    </Screen>
  );
}
