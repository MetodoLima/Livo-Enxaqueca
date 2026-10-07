import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';
import Text, { type TextTone } from '@/components/ui/Text';
import { color } from '@/constants/Colors';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

const CONTAINER: Record<ButtonVariant, string> = {
  primary: 'bg-primary-strong',
  secondary: 'bg-primary-subtle border border-primary',
  ghost: 'bg-transparent',
  danger: 'bg-danger-subtle border border-danger',
};

const LABEL_TONE: Record<ButtonVariant, TextTone> = {
  primary: 'content',
  secondary: 'content',
  ghost: 'primary',
  danger: 'content',
};

const ICON_COLOR: Record<ButtonVariant, string> = {
  primary: color.content,
  secondary: color.primary,
  ghost: color.primary,
  danger: color.danger,
};

const SIZE: Record<ButtonSize, string> = {
  md: 'min-h-12 px-5 py-2',
  lg: 'min-h-14 px-6 py-3',
};

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  loading?: boolean;
  done?: boolean;
  className?: string;
}

export default function Button({
  title,
  variant = 'primary',
  size = 'lg',
  icon: Icon,
  loading = false,
  done = false,
  disabled,
  className = '',
  accessibilityLabel,
  ...props
}: ButtonProps) {
  const dimmed = !done && (disabled || loading);
  const inactive = disabled || loading || done;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      className={`flex-row items-center justify-center gap-2 rounded-md ${SIZE[size]} ${CONTAINER[variant]} ${dimmed ? 'opacity-50' : inactive ? '' : 'active:opacity-80'} ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={ICON_COLOR[variant]} />
      ) : (
        <>
          {Icon && <Icon size={20} color={ICON_COLOR[variant]} />}
          <Text variant="body" weight="semibold" tone={LABEL_TONE[variant]} className="text-center">
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
