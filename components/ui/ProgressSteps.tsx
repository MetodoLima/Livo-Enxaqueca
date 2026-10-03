import { View } from 'react-native';

export interface ProgressStepsProps {
  current: number;
  total: number;
  className?: string;
}

export default function ProgressSteps({ current, total, className = '' }: ProgressStepsProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`Passo ${current} de ${total}`}
      accessibilityValue={{ min: 1, max: total, now: current }}
      className={`flex-row gap-1 ${className}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <View key={i} className={`h-1 flex-1 rounded-sm ${i < current ? 'bg-primary' : 'bg-surface-raised'}`} />
      ))}
    </View>
  );
}
