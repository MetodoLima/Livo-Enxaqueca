import type { ReactNode, Ref } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

export type CardVariant = 'default' | 'accent-border';
export type CardPadding = 'xs' | 'sm' | 'md';
export type CardSurface = 'default' | 'raised';

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  surface?: CardSurface;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
  ref?: Ref<View>;
}

const VARIANT: Record<CardVariant, string> = {
  default: '',
  'accent-border': 'border-l-4 border-l-primary',
};

const SURFACE: Record<CardSurface, string> = {
  default: 'border-line bg-surface',
  raised: 'border-line bg-surface-raised',
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
  surface = 'default',
  selected,
  onPress,
  accessibilityLabel,
  className = '',
  style,
  ref,
}: CardProps) {
  const fundo = selected ? 'border-primary bg-primary-subtle' : SURFACE[surface];
  const base = `rounded-lg border ${fundo} ${PADDING[padding]} ${VARIANT[variant]} ${className}`;

  if (onPress) {
    return (
      <Pressable
        ref={ref}
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
    <View ref={ref} className={base} style={style}>
      {children}
    </View>
  );
}
