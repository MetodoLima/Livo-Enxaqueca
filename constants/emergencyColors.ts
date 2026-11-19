import type { ColorPalette } from './Colors';

export const ORIGINAL_EMERGENCY_INTENSITY_COLORS = [
  '#FEE2E2', '#FEE2E2', '#FECACA', '#FECACA', '#FCA5A5',
  '#FCA5A5', '#F87171', '#F87171', '#EF4444', '#B91C1C',
] as const;

export function emergencyIntensityColor(
  palette: ColorPalette,
  intensity: number,
  original: boolean,
): string {
  if (original) return ORIGINAL_EMERGENCY_INTENSITY_COLORS[intensity - 1];
  return palette.pain[String(intensity) as keyof ColorPalette['pain']];
}

export function emergencyIntensityLabelUsesInnerSurface(original: boolean): boolean {
  return original;
}
