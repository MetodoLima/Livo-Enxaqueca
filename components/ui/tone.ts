import { color } from '@/constants/Colors';

export type Tone = 'neutral' | 'primary' | 'secondary' | 'attention' | 'danger' | 'success';

export const SUBTLE_BACKGROUND: Record<Tone, string> = {
  neutral: 'bg-surface-raised',
  primary: 'bg-primary-subtle',
  secondary: 'bg-secondary-subtle',
  attention: 'bg-attention-subtle',
  danger: 'bg-danger-subtle',
  success: 'bg-success-subtle',
};

export const TONE_BORDER: Record<Tone, string> = {
  neutral: 'border-line',
  primary: 'border-primary',
  secondary: 'border-secondary',
  attention: 'border-attention',
  danger: 'border-danger',
  success: 'border-success',
};

export const TONE_COLOR: Record<Tone, string> = {
  neutral: color.contentMuted,
  primary: color.primary,
  secondary: color.secondary,
  attention: color.attention,
  danger: color.danger,
  success: color.success,
};
