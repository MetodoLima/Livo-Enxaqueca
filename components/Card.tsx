import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'accent-border';
  className?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function Card({ children, variant = 'default', className = '', onPress, style }: CardProps) {
  const base = 'rounded-[28px] p-6';

  const accentBorderStyle: ViewStyle = variant === 'accent-border'
    ? { borderLeftColor: 'rgba(37, 183, 187, 0.4)', borderLeftWidth: 3 }
    : {};

  const Component = onPress ? Pressable : View;

  return (
    <Component
      onPress={onPress}
      style={[{ backgroundColor: '#232533', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.10)' }, accentBorderStyle, style]}
      className={`${base} ${className}`}
    >
      {children}
    </Component>
  );
}
