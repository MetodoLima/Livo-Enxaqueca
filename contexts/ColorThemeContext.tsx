import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { vars } from 'nativewind';
import { originalPalette, type ColorPalette } from '@/constants/Colors';
import type { ColorPaletteMode } from '@/constants/colorPalettes';
import { createColorVariables } from '@/constants/colorTheme';
import { ColorPaletteProvider, useColorPalette } from '@/contexts/ColorPaletteContext';

export { useColorPalette, useColorPaletteMode } from '@/contexts/ColorPaletteContext';

export function useThemeVars() {
  const palette = useColorPalette();
  return useMemo(() => vars(createColorVariables(palette)), [palette]);
}

export function ColorVariableScope({
  children,
  fill = false,
  style,
  ...viewProps
}: ViewProps & { children: ReactNode; fill?: boolean }) {
  const variableStyle = useThemeVars();

  return (
    <View {...viewProps} style={[fill ? styles.root : undefined, variableStyle, style]}>
      {children}
    </View>
  );
}

export function ColorThemeProvider({
  children,
  palette = originalPalette,
  mode = 'original',
}: {
  children: ReactNode;
  palette?: ColorPalette;
  mode?: ColorPaletteMode;
}) {
  return (
    <ColorPaletteProvider palette={palette} mode={mode}>
      <ColorVariableScope fill>{children}</ColorVariableScope>
    </ColorPaletteProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
