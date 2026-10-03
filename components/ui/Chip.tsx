import type { LucideIcon } from 'lucide-react-native';
import { X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import Text from '@/components/ui/Text';
import { SUBTLE_BACKGROUND, TONE_BORDER, TONE_COLOR, type Tone } from '@/components/ui/tone';

export interface ChipProps {
  label: string;
  tone?: Tone;
  emoji?: string;
  icon?: LucideIcon;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  className?: string;
}

export default function Chip({
  label,
  tone = 'neutral',
  emoji,
  icon: Icon,
  selected,
  onPress,
  onRemove,
  className = '',
}: ChipProps) {
  const selectable = selected !== undefined;
  const active = selectable ? selected : true;
  const surface = active ? `${SUBTLE_BACKGROUND[tone]} ${TONE_BORDER[tone]}` : 'bg-surface-raised border-line-strong';
  const interactive = !!onPress || !!onRemove;
  const height = interactive ? 'min-h-12' : 'min-h-10';

  const content = (
    <>
      {emoji ? <Text variant="body">{emoji}</Text> : null}
      {Icon ? <Icon size={16} color={active ? TONE_COLOR[tone] : TONE_COLOR.neutral} /> : null}
      <Text variant="caption" weight="semibold" tone={active ? 'content' : 'muted'}>
        {label}
      </Text>
    </>
  );

  const base = `flex-row items-center gap-2 self-start rounded-md border ${height} ${surface} ${className}`;

  if (onRemove) {
    return (
      <View className={`${base} pl-3`}>
        {content}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remover ${label}`}
          onPress={onRemove}
          className="h-12 w-10 items-center justify-center active:opacity-70"
        >
          <X size={16} color={TONE_COLOR.neutral} />
        </Pressable>
      </View>
    );
  }

  if (onPress) {
    return (
      <Pressable
        accessibilityRole={selectable ? 'checkbox' : 'button'}
        accessibilityState={selectable ? { checked: selected } : undefined}
        accessibilityLabel={label}
        onPress={onPress}
        className={`${base} px-3 active:opacity-80`}
      >
        {content}
      </Pressable>
    );
  }

  return <View className={`${base} px-3`}>{content}</View>;
}
