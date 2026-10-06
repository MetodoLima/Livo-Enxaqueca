import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { InsightItem } from '@/features/insights/useInsights';

export default function BarList({ items, gradientColors }: { items: InsightItem[]; gradientColors: readonly [string, string, ...string[]] }) {
  if (items.length === 0) {
    return (
      <Text className="text-muted text-sm font-epilogue text-center py-2">
        Nenhum dado registrado
      </Text>
    );
  }
  return (
    <View className="gap-4">
      {items.map((item) => (
        <View key={item.nome}>
          <View className="flex-row justify-between mb-1">
            <Text className="text-white font-epilogue-medium text-[15px] flex-1 mr-2" numberOfLines={1}>
              {item.nome}
            </Text>
            <Text className="text-white text-[14px] font-epilogue-bold">{item.pct}%</Text>
          </View>
          <View className="h-2 bg-black/30 rounded-full overflow-hidden">
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: `${item.pct}%`, height: '100%', borderRadius: 9999 }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
