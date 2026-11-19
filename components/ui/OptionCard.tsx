import type { LucideIcon } from 'lucide-react-native';
import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Text from '@/components/ui/Text';
import { optionCardSupportingTextTone } from '@/components/ui/optionCardPresentation';
import { useColorPalette } from '@/contexts/ColorThemeContext';

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
  disabled?: boolean;
  previewColors?: readonly string[];
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
  disabled = false,
  previewColors,
  className = '',
}: OptionCardProps) {
  const { roles } = useColorPalette();
  const superficie = checked ? 'border-primary bg-primary-subtle' : 'border-line-strong bg-surface-raised';
  const indicador = checked ? 'border-primary' : 'border-line-strong';
  const supportingTextTone = optionCardSupportingTextTone(checked);

  return (
    <Pressable
      accessibilityRole={mode}
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={[label, description, tag].filter(Boolean).join(', ')}
      onPress={onPress}
      disabled={disabled}
      className={`min-h-14 flex-row items-center gap-3 rounded-md border p-4 ${disabled ? '' : 'active:opacity-80'} ${superficie} ${className}`}
    >
      {Icon ? <Icon size={24} color={checked ? roles.primary : roles.contentMuted} /> : null}
      {!Icon && emoji ? (
        <Text variant="heading" importantForAccessibility="no" accessibilityElementsHidden>
          {emoji}
        </Text>
      ) : null}
      <View className="flex-1 gap-1">
        <Text weight="semibold">{label}</Text>
        {description ? (
          <Text variant="caption" tone={supportingTextTone}>
            {description}
          </Text>
        ) : null}
        {tag ? (
          <Text variant="caption" weight="semibold" tone={supportingTextTone}>
            {tag}
          </Text>
        ) : null}
        {previewColors?.length ? (
          <View
            className="flex-row gap-2 pt-1"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
          >
            {previewColors.map((color, index) => (
              <View
                key={`${color}-${index}`}
                className="h-4 w-4 rounded-full border border-line-strong"
                style={{ backgroundColor: color }}
              />
            ))}
          </View>
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
          {checked ? <Check size={16} color={roles.canvas} /> : null}
        </View>
      )}
    </Pressable>
  );
}
