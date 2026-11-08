import { Pressable, View } from 'react-native';
import Text from '@/components/ui/Text';
import { PAIN_BG } from '@/features/crisis/components/IntensityScale';

const PAIN_BG_SUAVE: Record<number, string> = {
  0: 'bg-pain-0/30',
  1: 'bg-pain-1/30',
  2: 'bg-pain-2/30',
  3: 'bg-pain-3/30',
  4: 'bg-pain-4/30',
  5: 'bg-pain-5/30',
  6: 'bg-pain-6/30',
  7: 'bg-pain-7/30',
  8: 'bg-pain-8/30',
  9: 'bg-pain-9/30',
  10: 'bg-pain-10/30',
};

const PAIN_BORDER: Record<number, string> = {
  0: 'border-pain-0',
  1: 'border-pain-1',
  2: 'border-pain-2',
  3: 'border-pain-3',
  4: 'border-pain-4',
  5: 'border-pain-5',
  6: 'border-pain-6',
  7: 'border-pain-7',
  8: 'border-pain-8',
  9: 'border-pain-9',
  10: 'border-pain-10',
};

interface CalendarDayProps {
  day: number;
  accessibilityLabel: string;
  crises: number;
  dorMaxima: number | null;
  temEvento: boolean;
  hoje: boolean;
  selecionado: boolean;
  onPress: () => void;
}

export default function CalendarDay({
  day,
  accessibilityLabel,
  crises,
  dorMaxima,
  temEvento,
  hoje,
  selecionado,
  onPress,
}: CalendarDayProps) {
  const temCrise = crises > 0 && dorMaxima !== null;
  const fundo = temCrise ? PAIN_BG_SUAVE[dorMaxima] : '';
  const corDeHoje = temCrise ? PAIN_BORDER[dorMaxima] : 'border-line-strong';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: selecionado }}
      className={`min-h-11 flex-1 items-center justify-center gap-0.5 overflow-visible rounded-sm pb-1.5 ${fundo} active:opacity-80`}
      style={crises > 1 ? { zIndex: 1 } : undefined}
    >
      <Text weight={temCrise ? 'bold' : 'regular'}>{day}</Text>
      <View className="min-h-1.5 flex-row items-center gap-1">
        {temCrise ? <View className={`h-1.5 w-1.5 rounded-full ${PAIN_BG[dorMaxima]}`} /> : null}
        {temEvento ? <View className="h-1.5 w-1.5 bg-secondary" /> : null}
      </View>
      {hoje && !selecionado ? (
        <View className={`absolute inset-0 rounded-sm border-[1.5px] ${corDeHoje}`} style={{ pointerEvents: 'none' }} />
      ) : null}
      {selecionado ? (
        <View className="absolute inset-0 rounded-sm border-[2.5px] border-primary" style={{ pointerEvents: 'none' }} />
      ) : null}
      {selecionado && hoje ? (
        <View
          className={`absolute rounded-sm border-[1.5px] ${corDeHoje}`}
          style={{ top: 4.5, right: 4.5, bottom: 4.5, left: 4.5, pointerEvents: 'none' }}
        />
      ) : null}
      {crises > 1 ? (
        <View
          className="absolute min-h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1"
          style={{ top: -7, right: -5 }}
        >
          <Text variant="caption" weight="bold" tone="canvas">
            {crises}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
