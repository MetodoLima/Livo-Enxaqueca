import type { LucideIcon } from 'lucide-react-native';
import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Text from '@/components/ui/Text';
import { color } from '@/constants/Colors';

export type OptionCardMode = 'radio' | 'checkbox';

export interface OptionCardProps {
  label: string;
  description?: string;
  tag?: string;
  icon?: LucideIcon;
  emoji?: string;
  mode: OptionCardMode;
  checked: boolean;
  onPress: () => void;
  className?: string;
}

export default function OptionCard({
  label,
  description,
  tag,
  icon: Icon,
  emoji,
  mode,
  checked,
  onPress,
  className = '',
}: OptionCardProps) {
  const superficie = checked ? 'border-primary bg-primary-subtle' : 'border-line-strong bg-surface-raised';
  const indicador = checked ? 'border-primary' : 'border-line-strong';

  return (
    <Pressable
      accessibilityRole={mode}
      accessibilityState={{ checked }}
      accessibilityLabel={[label, description, tag].filter(Boolean).join(', ')}
      onPress={onPress}
      className={`min-h-14 flex-row items-center gap-3 rounded-md border p-4 active:opacity-80 ${superficie} ${className}`}
    >
      {Icon ? <Icon size={24} color={checked ? color.primary : color.contentMuted} /> : null}
      {!Icon && emoji ? (
        <Text variant="heading" importantForAccessibility="no" accessibilityElementsHidden>
          {emoji}
        </Text>
      ) : null}
      <View className="flex-1 gap-1">
        <Text weight="semibold">{label}</Text>
        {description ? (
          <Text variant="caption" tone="muted">
            {description}
          </Text>
        ) : null}
        {tag ? (
          <Text variant="caption" weight="semibold" tone="muted">
            {tag}
          </Text>
        ) : null}
      </View>
      {mode === 'radio' ? (
        <View className={`h-6 w-6 items-center justify-center rounded-full border-2 ${indicador}`}>
          {checked ? <View className="h-3 w-3 rounded-full bg-primary" /> : null}
        </View>
      ) : (
        <View
          className={`h-6 w-6 items-center justify-center rounded-sm border-2 ${indicador} ${checked ? 'bg-primary' : ''}`}
        >
          {checked ? <Check size={16} color={color.canvas} /> : null}
        </View>
      )}
    </Pressable>
  );
}
