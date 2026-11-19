import type { ColorPaletteMode } from './colorPaletteMode.ts';

export function painNeedsContrastOutline(mode: ColorPaletteMode, intensity: number): boolean {
  return mode === 'original' && intensity >= 9;
}
