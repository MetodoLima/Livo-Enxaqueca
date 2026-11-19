export const COLOR_PALETTE_MODES = [
  'original',
  'deuteranopia',
  'protanopia',
  'tritanopia',
] as const;

export type ColorPaletteMode = (typeof COLOR_PALETTE_MODES)[number];

export function isColorPaletteMode(value: unknown): value is ColorPaletteMode {
  return COLOR_PALETTE_MODES.includes(value as ColorPaletteMode);
}

export function selectColorPalette<T>(
  palettes: Record<ColorPaletteMode, T>,
  mode: ColorPaletteMode,
): T {
  return palettes[mode];
}
