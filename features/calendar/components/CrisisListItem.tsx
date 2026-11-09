import { ChevronRight, Clock } from 'lucide-react-native';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import { color } from '@/constants/Colors';
import { IntensityMarker } from '@/features/crisis/components/IntensityScale';
import type { CrisisDay } from '@/features/crisis/useCrisisCalendar';
import { formatDuration, formatTime, intensityLabel } from '@/lib/format';
import { locationLabel } from '@/types/crisis';

export default function CrisisListItem({ crisis }: { crisis: CrisisDay; index: number }) {
  const router = useRouter();
  const hora = formatTime(crisis.inicioCrise);
  const duracao = formatDuration(crisis.inicioCrise, crisis.fimCrise);
  const regioes = [...new Set(crisis.fases.map((f) => f.regiaoDor).filter((r): r is string => !!r))];
  const local = regioes.map(locationLabel).join(', ');
  const detalhe = [duracao, local].filter(Boolean).join(' · ');

  const rotulo = [
    `Crise às ${hora}`,
    crisis.intensidadeDor !== null
      ? `intensidade ${crisis.intensidadeDor} de 10, ${intensityLabel(crisis.intensidadeDor)}`
      : 'intensidade não registrada',
    duracao,
    local,
    !crisis.enviado ? 'ainda não enviada, guardada neste aparelho' : '',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Card
      padding="sm"
      accessibilityLabel={rotulo}
      onPress={() =>
        router.push({
          pathname: '/crisis/[id]',
          params: {
            id: String(crisis.id),
            data: JSON.stringify({
              ...crisis,
              inicioCrise: crisis.inicioCrise.toISOString(),
              fimCrise: crisis.fimCrise ? crisis.fimCrise.toISOString() : null,
            }),
          },
        })
      }
    >
      <View className="flex-row items-center gap-3">
        <View>
          <Text variant="caption" tone="muted">
            Início
          </Text>
          <Text variant="heading">{hora}</Text>
        </View>
        <View className="flex-1 gap-1">
          {crisis.intensidadeDor !== null ? (
            <IntensityMarker value={crisis.intensidadeDor} />
          ) : (
            <Text weight="semibold">Intensidade não registrada</Text>
          )}
          <Text variant="caption" tone="muted">
            {detalhe}
          </Text>
        </View>
        {!crisis.enviado ? <Clock size={20} color={color.attention} /> : null}
        <ChevronRight size={20} color={color.contentMuted} />
      </View>
    </Card>
  );
}
