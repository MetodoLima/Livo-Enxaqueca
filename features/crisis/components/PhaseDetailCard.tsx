import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import Text from '@/components/ui/Text';
import { IntensityMarker } from '@/features/crisis/components/IntensityScale';
import type { CrisisPhase } from '@/features/crisis/useCrisisCalendar';
import { locationLabel, sideLabel } from '@/types/crisis';

const NIVEL_INCAPACIDADE: Record<string, string> = { leve: 'Leve', moderado: 'Moderado', severo: 'Severo' };

function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <View className="gap-1">
      <Text variant="caption" weight="semibold" tone="muted">
        {rotulo}
      </Text>
      {children}
    </View>
  );
}

export default function PhaseDetailCard({ phase, index }: { phase: CrisisPhase; index: number }) {
  const reduceMotion = useReducedMotion();
  const numero = index + 1;
  const local = [phase.regiaoDor ? locationLabel(phase.regiaoDor) : null, phase.lado ? sideLabel(phase.lado) : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(index * 80).duration(300)}>
      <Card padding="sm" className="gap-4">
        <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1" accessibilityRole="header">
          <Text weight="semibold">Fase {numero}</Text>
          {phase.intensidadeDor !== null ? (
            <IntensityMarker value={phase.intensidadeDor} />
          ) : (
            <Text tone="muted">Intensidade não registrada</Text>
          )}
        </View>

        <Campo rotulo="Localização">
          <Text>{local || 'Não registrada'}</Text>
        </Campo>

        <Campo rotulo="Medicamentos">
          <Text>{phase.medicamentos.length > 0 ? phase.medicamentos.join(', ') : 'Nenhum'}</Text>
        </Campo>

        <Campo rotulo="Sintomas">
          {phase.sintomas.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {phase.sintomas.map((s) => (
                <Chip key={s} label={s} />
              ))}
            </View>
          ) : (
            <Text>Nenhum</Text>
          )}
        </Campo>

        {phase.nivelIncapacidade ? (
          <Campo rotulo="Incapacidade">
            <Text>{NIVEL_INCAPACIDADE[phase.nivelIncapacidade] ?? phase.nivelIncapacidade}</Text>
          </Campo>
        ) : null}

        {phase.resumo ? (
          <Campo rotulo="Resumo IA">
            <Text>{phase.resumo}</Text>
          </Campo>
        ) : null}
      </Card>
    </Animated.View>
  );
}
