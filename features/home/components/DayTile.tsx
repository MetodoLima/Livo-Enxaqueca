import type { LucideIcon } from 'lucide-react-native';
import { Pencil, Plus } from 'lucide-react-native';
import type { Ref } from 'react';
import { View } from 'react-native';
import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import { color } from '@/constants/Colors';

export type DayTileTone = 'primary' | 'secondary';

const BOLINHA: Record<DayTileTone, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
};

const COR_DO_ICONE: Record<DayTileTone, string> = {
  primary: color.primary,
  secondary: color.secondary,
};

interface DayTileProps {
  title: string;
  icon: LucideIcon;
  value: string | null;
  spokenValue: string | null;
  tone: DayTileTone;
  side: number;
  onPress: () => void;
  ref?: Ref<View>;
}

export default function DayTile({ title, icon: Icone, value, spokenValue, tone, side, onPress, ref }: DayTileProps) {
  const IconeDaAcao = value ? Pencil : Plus;
  const rotulo = value
    ? `${title}, ${spokenValue ?? value}, toque para editar`
    : `${title}, não registrado, toque para registrar`;

  return (
    <Card
      ref={ref}
      surface="raised"
      onPress={onPress}
      accessibilityLabel={rotulo}
      className="justify-between"
      style={{ width: side, minHeight: side }}
    >
      <View className="items-start gap-1">
        <View className="flex-row items-center gap-2">
          <Icone size={20} color={COR_DO_ICONE[tone]} />
          <Text weight="semibold" className="shrink">
            {title}
          </Text>
        </View>
        {value ? (
          <Text variant="title">{value}</Text>
        ) : (
          <Text variant="caption" tone="muted">
            Toque para registrar
          </Text>
        )}
      </View>
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        className="min-h-4 flex-1"
      />
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        className={`h-10 w-10 items-center justify-center self-end rounded-full ${BOLINHA[tone]}`}
      >
        <IconeDaAcao size={20} color={color.canvas} />
      </View>
    </Card>
  );
}
