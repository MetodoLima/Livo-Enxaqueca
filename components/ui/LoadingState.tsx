import { ActivityIndicator, View } from 'react-native';
import Text from '@/components/ui/Text';
import { color } from '@/constants/Colors';

export interface LoadingStateProps {
  label?: string;
  className?: string;
}

export default function LoadingState({ label = 'Carregando…', className = '' }: LoadingStateProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      className={`items-center justify-center gap-3 py-section ${className}`}
    >
      <ActivityIndicator size="large" color={color.primary} />
      <Text variant="body" tone="muted" className="text-center">
        {label}
      </Text>
    </View>
  );
}
