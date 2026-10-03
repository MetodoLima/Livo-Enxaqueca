import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native';

export type TextVariant = 'caption' | 'body' | 'heading' | 'title' | 'display' | 'hero';

export type TextTone =
  | 'content'
  | 'muted'
  | 'primary'
  | 'secondary'
  | 'attention'
  | 'danger'
  | 'success';

export type TextWeight = 'regular' | 'semibold' | 'bold';

const VARIANT: Record<TextVariant, string> = {
  caption: 'text-caption',
  body: 'text-body',
  heading: 'text-heading',
  title: 'text-title',
  display: 'text-display',
  hero: 'text-hero',
};

const DEFAULT_WEIGHT: Record<TextVariant, TextWeight> = {
  caption: 'regular',
  body: 'regular',
  heading: 'semibold',
  title: 'bold',
  display: 'bold',
  hero: 'bold',
};

const WEIGHT: Record<TextWeight, string> = {
  regular: 'font-epilogue',
  semibold: 'font-epilogue-semi',
  bold: 'font-epilogue-bold',
};

const TONE: Record<TextTone, string> = {
  content: 'text-content',
  muted: 'text-content-muted',
  primary: 'text-primary',
  secondary: 'text-secondary',
  attention: 'text-attention',
  danger: 'text-danger',
  success: 'text-success',
};

export interface TextProps extends NativeTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  weight?: TextWeight;
  className?: string;
}

export default function Text({
  variant = 'body',
  tone = 'content',
  weight,
  className = '',
  accessibilityRole,
  ...props
}: TextProps) {
  const isHeader = variant === 'title' || variant === 'heading';

  return (
    <NativeText
      accessibilityRole={accessibilityRole ?? (isHeader ? 'header' : undefined)}
      className={`${VARIANT[variant]} ${WEIGHT[weight ?? DEFAULT_WEIGHT[variant]]} ${TONE[tone]} ${className}`}
      {...props}
    />
  );
}
