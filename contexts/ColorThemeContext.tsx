import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { vars } from 'nativewind';
import { originalPalette, type ColorPalette } from '@/constants/Colors';
import { createColorVariables } from '@/constants/colorTheme';
import { ColorPaletteProvider, useColorPalette } from '@/contexts/ColorPaletteContext';

export { useColorPalette } from '@/contexts/ColorPaletteContext';

export function ColorVariableScope({
  children,
  fill = false,
  style,
  ...viewProps
}: ViewProps & { children: ReactNode; fill?: boolean }) {
  const palette = useColorPalette();
  const variableStyle = useMemo(() => vars(createColorVariables(palette)), [palette]);

  return (
    <View {...viewProps} style={[fill ? styles.root : undefined, variableStyle, style]}>
      {children}
    </View>
  );
}

export function ColorThemeProvider({
  children,
  palette = originalPalette,
}: {
  children: ReactNode;
  palette?: ColorPalette;
}) {
  return (
    <ColorPaletteProvider palette={palette}>
      <ColorVariableScope fill>{children}</ColorVariableScope>
    </ColorPaletteProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
