import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

export type CardVariant = 'default' | 'accent-border';

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  accessibilityLabel?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const VARIANT: Record<CardVariant, string> = {
  default: '',
  'accent-border': 'border-l-4 border-l-primary',
};

export default function Card({
  children,
  variant = 'default',
  onPress,
  accessibilityLabel,
  className = '',
  style,
}: CardProps) {
  const base = `rounded-lg border border-line bg-surface p-6 ${VARIANT[variant]} ${className}`;

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
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
