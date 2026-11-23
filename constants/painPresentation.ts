import type { Tema } from './preferences.ts';
import type { ColorPaletteMode } from './colorPaletteMode.ts';

export function painNeedsContrastOutline(mode: ColorPaletteMode, intensity: number): boolean {
  return mode === 'original' && intensity >= 9;
}

export function calendarPainTintOpacity(tema: Tema, modo: ColorPaletteMode): number {
  return tema === 'alto-contraste' && modo !== 'original' ? 0.2 : 0.3;
}
