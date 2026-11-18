import { createContext, createElement, useContext, type ReactNode } from 'react';
import type { ColorPalette } from '@/constants/Colors';

const ColorPaletteContext = createContext<ColorPalette | null>(null);

export function ColorPaletteProvider({
  children,
  palette,
}: {
  children: ReactNode;
  palette: ColorPalette;
}) {
  return createElement(ColorPaletteContext.Provider, { value: palette }, children);
}

export function useColorPalette(): ColorPalette {
  const palette = useContext(ColorPaletteContext);
  if (!palette) throw new Error('useColorPalette must be used within ColorThemeProvider');
  return palette;
}
