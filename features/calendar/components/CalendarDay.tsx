import { Pressable, View } from 'react-native';
import Text from '@/components/ui/Text';
import { hexToRgba, rgbaToHex } from '@/constants/Colors';
import { calendarPainTintOpacity, painNeedsContrastOutline } from '@/constants/painPresentation';
import { useColorPalette, useColorPaletteMode } from '@/contexts/ColorThemeContext';
import { PAIN_BG } from '@/features/crisis/components/IntensityScale';
import { usePreferences } from '@/contexts/PreferencesContext';

const PAIN_BORDER: Record<number, string> = {
  0: 'border-pain-0',
  1: 'border-pain-1',
  2: 'border-pain-2',
  3: 'border-pain-3',
  4: 'border-pain-4',
  5: 'border-pain-5',
  6: 'border-pain-6',
  7: 'border-pain-7',
  8: 'border-pain-8',
  9: 'border-pain-9',
  10: 'border-pain-10',
};

interface CalendarDayProps {
  day: number;
  accessibilityLabel: string;
  crises: number;
  dorMaxima: number | null;
  temEvento: boolean;
  hoje: boolean;
  selecionado: boolean;
  onPress: () => void;
}

export default function CalendarDay({
  day,
  accessibilityLabel,
  crises,
  dorMaxima,
  temEvento,
  hoje,
  selecionado,
  onPress,
}: CalendarDayProps) {
  const mode = useColorPaletteMode();
  const { pain } = useColorPalette();
  const { preferencias: { tema } } = usePreferences();
  const temCrise = crises > 0 && dorMaxima !== null;
  const tint = temCrise ? pain[String(dorMaxima) as keyof typeof pain] : undefined;
  let backgroundColor: string | undefined;
  if (tint) {
    const [r, g, b] = hexToRgba(tint);
    backgroundColor = rgbaToHex([r, g, b, calendarPainTintOpacity(tema, mode)]);
  }
  const precisaDeContorno = temCrise && painNeedsContrastOutline(mode, dorMaxima);
  const corDeHoje = precisaDeContorno
    ? 'border-content'
    : temCrise
      ? PAIN_BORDER[dorMaxima]
      : 'border-line-strong';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: selecionado }}
      className={`min-h-11 flex-1 items-center justify-center gap-0.5 overflow-visible rounded-sm pb-1.5 active:opacity-80`}
      style={{ backgroundColor, zIndex: crises > 1 ? 1 : undefined }}
    >
      <Text weight={temCrise ? 'bold' : 'regular'} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {day}
      </Text>
      <View className="min-h-1.5 flex-row items-center gap-1">
        {temCrise ? (
          <View
            className={`h-1.5 w-1.5 rounded-full ${PAIN_BG[dorMaxima]} ${precisaDeContorno ? 'border border-content' : ''}`}
          />
        ) : null}
        {temEvento ? <View className="h-1.5 w-1.5 bg-secondary" /> : null}
      </View>
      {hoje && !selecionado ? (
        <View className={`absolute inset-0 rounded-sm border-[1.5px] ${corDeHoje}`} style={{ pointerEvents: 'none' }} />
      ) : null}
      {selecionado ? (
        <View className="absolute inset-0 rounded-sm border-[2.5px] border-primary" style={{ pointerEvents: 'none' }} />
      ) : null}
      {selecionado && hoje ? (
        <View
          className={`absolute rounded-sm border-[1.5px] ${corDeHoje}`}
          style={{ top: 4.5, right: 4.5, bottom: 4.5, left: 4.5, pointerEvents: 'none' }}
        />
      ) : null}
      {crises > 1 ? (
        <View
          className="absolute min-h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1"
          style={{ top: -7, right: -5 }}
        >
          <Text variant="caption" weight="bold" tone="canvas">
            {crises}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
