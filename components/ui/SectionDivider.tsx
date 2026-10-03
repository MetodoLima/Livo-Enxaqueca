import { View } from 'react-native';
import Text from '@/components/ui/Text';

export interface SectionDividerProps {
  label?: string;
  className?: string;
}

export default function SectionDivider({ label, className = '' }: SectionDividerProps) {
  if (!label) {
    return <View className={`h-px bg-line ${className}`} />;
  }

  return (
    <View className={`flex-row items-center gap-3 ${className}`}>
      <View className="h-px flex-1 bg-line" />
      <Text variant="caption" weight="semibold" tone="muted" accessibilityRole="header">
        {label}
      </Text>
      <View className="h-px flex-1 bg-line" />
    </View>
  );
}
