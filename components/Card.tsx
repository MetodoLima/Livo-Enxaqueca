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
  const base = 'rounded-[20px] p-5 bg-slate-800';

  const variants = {
    default: '',
    elevated: 'shadow-lg',
    'accent-border': 'border-l-[3px]',
  };

  // accent-border needs style prop because hex opacity in className doesn't work reliably in RN
  const accentBorderStyle: ViewStyle = variant === 'accent-border'
    ? { borderLeftColor: 'rgba(37, 183, 187, 0.4)' }
    : {};

  const Component = onPress ? Pressable : View;

  return (
    <Component
      onPress={onPress}
      style={[accentBorderStyle, style]}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </Component>
  );
}
