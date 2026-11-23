import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react';
import type { ColorPalette } from '@/constants/Colors';
import type { ColorPaletteMode } from '@/constants/colorPalettes';

interface ColorPaletteContextValue {
  palette: ColorPalette;
  mode: ColorPaletteMode;
}

const ColorPaletteContext = createContext<ColorPaletteContextValue | null>(null);

export function ColorPaletteProvider({
  children,
  palette,
  mode = 'original',
}: {
  children: ReactNode;
  palette: ColorPalette;
  mode?: ColorPaletteMode;
}) {
  const value = useMemo(() => ({ palette, mode }), [palette, mode]);
  return createElement(ColorPaletteContext.Provider, { value }, children);
}

export function useColorPalette(): ColorPalette {
  const value = useContext(ColorPaletteContext);
  if (!value) throw new Error('useColorPalette must be used within ColorThemeProvider');
  return value.palette;
}

export function useColorPaletteMode(): ColorPaletteMode {
  const value = useContext(ColorPaletteContext);
  if (!value) throw new Error('useColorPaletteMode must be used within ColorThemeProvider');
  return value.mode;
}
