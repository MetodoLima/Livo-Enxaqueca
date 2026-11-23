import type { LucideIcon } from 'lucide-react-native';
import type { Ref } from 'react';
import { ActivityIndicator, Pressable, View, type PressableProps } from 'react-native';
import Text, { type TextTone } from '@/components/ui/Text';
import { useColorPalette } from '@/contexts/ColorThemeContext';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';
export type ButtonShape = 'rounded' | 'pill';

const CONTAINER: Record<ButtonVariant, string> = {
  primary: 'bg-primary-strong',
  secondary: 'bg-primary-subtle border border-primary',
  ghost: 'bg-transparent',
  danger: 'bg-danger-subtle border border-danger',
};

const LABEL_TONE: Record<ButtonVariant, TextTone> = {
  primary: 'onPrimary',
  secondary: 'content',
  ghost: 'primary',
  danger: 'content',
};

const SHAPE: Record<ButtonShape, string> = {
  rounded: 'rounded-md',
  pill: 'rounded-full',
};

const SIZE: Record<ButtonSize, string> = {
  md: 'min-h-12 px-5 py-2',
  lg: 'min-h-14 px-6 py-3',
};

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  icon?: LucideIcon;
  iconPosition?: 'start' | 'end';
  iconOnly?: boolean;
  loading?: boolean;
  done?: boolean;
  className?: string;
  ref?: Ref<View>;
}

export default function Button({
  title,
  variant = 'primary',
  size = 'lg',
  shape = 'rounded',
  icon: Icon,
  iconPosition = 'start',
  iconOnly = false,
  loading = false,
  done = false,
  disabled,
  className = '',
  accessibilityLabel,
  ref,
  ...props
}: ButtonProps) {
  const { roles } = useColorPalette();
  const iconColor: Record<ButtonVariant, string> = {
    primary: roles.onPrimary,
    secondary: roles.primary,
    ghost: roles.primary,
    danger: roles.danger,
  };
  const dimmed = !done && (disabled || loading);
  const inactive = disabled || loading || done;

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      className={`flex-row items-center justify-center gap-2 ${SHAPE[shape]} ${SIZE[size]} ${CONTAINER[variant]} ${dimmed ? 'opacity-50' : inactive ? '' : 'active:opacity-80'} ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={iconColor[variant]} />
      ) : (
        <>
          {Icon && iconPosition === 'start' && <Icon size={20} color={iconColor[variant]} />}
          {iconOnly ? null : (
            <Text variant="body" weight="semibold" tone={LABEL_TONE[variant]} className="text-center">
              {title}
            </Text>
          )}
          {Icon && iconPosition === 'end' && <Icon size={20} color={iconColor[variant]} />}
        </>
      )}
    </Pressable>
  );
}
