import type { LucideIcon } from 'lucide-react-native';
import { Pressable, type PressableProps } from 'react-native';
import { color } from '@/constants/Colors';

export type IconButtonTone = 'content' | 'muted' | 'primary' | 'danger';

const TONE_COLOR: Record<IconButtonTone, string> = {
  get content() { return color.content; },
  get muted() { return color.contentMuted; },
  get primary() { return color.primary; },
  get danger() { return color.danger; },
};

export interface IconButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  icon: LucideIcon;
  accessibilityLabel: string;
  tone?: IconButtonTone;
  filled?: boolean;
  className?: string;
}

export default function IconButton({
  icon: Icon,
  accessibilityLabel,
  tone = 'muted',
  filled = false,
  disabled,
  className = '',
  ...props
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      className={`h-12 w-12 items-center justify-center rounded-full ${filled ? 'bg-surface-raised' : 'bg-transparent'} ${disabled ? 'opacity-50' : 'active:opacity-70'} ${className}`}
      {...props}
    >
      <Icon size={22} color={TONE_COLOR[tone]} />
    </Pressable>
  );
}
