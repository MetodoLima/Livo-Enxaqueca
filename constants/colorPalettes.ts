import { originalPalette, type ColorPalette } from './Colors';
import {
  deuteranopiaPalette,
  protanopiaPalette,
  tritanopiaPalette,
} from './accessibilityPalettes';

export type ColorPaletteMode = 'original' | 'deuteranopia' | 'protanopia' | 'tritanopia';

export const colorPalettes = {
  original: originalPalette,
  deuteranopia: deuteranopiaPalette,
  protanopia: protanopiaPalette,
  tritanopia: tritanopiaPalette,
} as const satisfies Record<ColorPaletteMode, ColorPalette>;

export {
  deuteranopiaPalette,
  protanopiaPalette,
  tritanopiaPalette,
};
