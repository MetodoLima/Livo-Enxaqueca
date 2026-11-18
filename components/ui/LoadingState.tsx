import { ActivityIndicator, View } from 'react-native';
import Text from '@/components/ui/Text';
import { useColorPalette } from '@/contexts/ColorThemeContext';

export interface LoadingStateProps {
  label?: string;
  className?: string;
}

export default function LoadingState({ label = 'Carregando…', className = '' }: LoadingStateProps) {
  const { roles } = useColorPalette();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityLiveRegion="polite"
      className={`items-center justify-center gap-3 py-section ${className}`}
    >
      <ActivityIndicator size="large" color={roles.primary} />
      <Text variant="body" tone="muted" className="text-center">
        {label}
      </Text>
    </View>
  );
}
