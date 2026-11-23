import { Switch, View } from 'react-native';
import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import { useColorPalette } from '@/contexts/ColorThemeContext';

export interface SwitchRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export default function SwitchRow({ label, description, value, onValueChange, disabled, className = '' }: SwitchRowProps) {
  const { roles } = useColorPalette();
  const trackColor = { false: roles.surfaceRaised, true: roles.primaryStrong };

  return (
    <Card padding="sm" className={className}>
      <View className="min-h-12 flex-row items-center gap-4">
        <View className="flex-1 gap-1">
          <Text weight="semibold">{label}</Text>
          {description ? (
            <Text variant="caption" tone="muted">
              {description}
            </Text>
          ) : null}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={trackColor}
          thumbColor={roles.content}
          ios_backgroundColor={roles.surfaceRaised}
          accessibilityLabel={label}
          accessibilityHint={description}
        />
      </View>
    </Card>
  );
}
