import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

export type CardVariant = 'default' | 'accent-border';
export type CardPadding = 'xs' | 'sm' | 'md';

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const VARIANT: Record<CardVariant, string> = {
  default: '',
  'accent-border': 'border-l-4 border-l-primary',
};

const PADDING: Record<CardPadding, string> = {
  xs: 'p-1',
  sm: 'p-3',
  md: 'p-6',
};

export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  selected,
  onPress,
  accessibilityLabel,
  className = '',
  style,
}: CardProps) {
  const surface = selected ? 'border-primary bg-primary-subtle' : 'border-line bg-surface';
  const base = `rounded-lg border ${surface} ${PADDING[padding]} ${VARIANT[variant]} ${className}`;

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={selected === undefined ? undefined : { selected }}
        onPress={onPress}
        className={`${base} active:opacity-80`}
        style={style}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={base} style={style}>
      {children}
    </View>
  );
}
