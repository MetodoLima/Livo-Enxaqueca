import { View } from 'react-native';
import Text from '@/components/ui/Text';
import type { InsightItem } from '@/features/insights/useInsights';

export type BarTone = 'attention' | 'secondary' | 'primary';

const BAR_BG: Record<BarTone, string> = {
  attention: 'bg-attention',
  secondary: 'bg-secondary',
  primary: 'bg-primary',
};

export default function BarList({ items, tone }: { items: InsightItem[]; tone: BarTone }) {
  if (items.length === 0) {
    return (
      <Text tone="muted" className="text-center">
        Nenhum dado registrado
      </Text>
    );
  }

  return (
    <View className="gap-4">
      {items.map((item) => (
        <View key={item.nome} className="gap-1" accessible accessibilityLabel={`${item.nome}: ${item.pct}%`}>
          <View className="flex-row items-center gap-2">
            <Text className="flex-1">{item.nome}</Text>
            <Text weight="semibold">{item.pct}%</Text>
          </View>
          <View className="h-2 overflow-hidden rounded-full bg-surface-raised">
            <View className={`h-2 rounded-full ${BAR_BG[tone]}`} style={{ width: `${item.pct}%` }} />
          </View>
        </View>
      ))}
    </View>
  );
}
