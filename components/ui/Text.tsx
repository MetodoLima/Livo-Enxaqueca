import { Text as NativeText, type TextProps as NativeTextProps } from 'react-native';
import {
  escalaMaximaDoSistema,
  estiloDeTexto,
  type Peso,
  type Preferencias,
  type Variante,
} from '@/constants/typography';
import { usePreferences } from '@/contexts/PreferencesContext';

export type TextVariant = Variante;

export type TextTone =
  | 'content'
  | 'muted'
  | 'primary'
  | 'secondary'
  | 'attention'
  | 'danger'
  | 'success'
  | 'canvas';

export type TextWeight = Peso;

const DEFAULT_WEIGHT: Record<TextVariant, TextWeight> = {
  caption: 'regular',
  body: 'regular',
  heading: 'semibold',
  title: 'bold',
  display: 'bold',
  hero: 'bold',
};

const TONE: Record<TextTone, string> = {
  content: 'text-content',
  muted: 'text-content-muted',
  primary: 'text-primary',
  secondary: 'text-secondary',
  attention: 'text-attention',
  danger: 'text-danger',
  success: 'text-success',
  canvas: 'text-canvas',
};

export interface TextProps extends NativeTextProps {
  variant?: TextVariant;
  tone?: TextTone;
  weight?: TextWeight;
  amostra?: Partial<Preferencias>;
  className?: string;
}

export default function Text({
  variant = 'body',
  tone = 'content',
  weight,
  amostra,
  className = '',
  accessibilityRole,
  style,
  maxFontSizeMultiplier,
  ...props
}: TextProps) {
  const { preferencias } = usePreferences();
  const isHeader = variant === 'title' || variant === 'heading';
  const efetivas = amostra ? { ...preferencias, ...amostra } : preferencias;

  return (
    <NativeText
      accessibilityRole={accessibilityRole ?? (isHeader ? 'header' : undefined)}
      className={`${TONE[tone]} ${className}`}
      style={[estiloDeTexto(variant, weight ?? DEFAULT_WEIGHT[variant], efetivas), style]}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? escalaMaximaDoSistema(efetivas)}
      {...props}
    />
  );
}
