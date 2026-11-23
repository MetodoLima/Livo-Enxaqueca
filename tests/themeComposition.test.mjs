import test from 'node:test';
import assert from 'node:assert/strict';
import source from '../constants/colors.json' with { type: 'json' };
import { resolverPaleta } from '../constants/Colors.ts';
import { COLOR_PALETTE_MODES } from '../constants/colorPaletteMode.ts';
import { calendarPainTintOpacity } from '../constants/painPresentation.ts';
import { INTENSIDADES_CORES, TEMAS } from '../constants/preferences.ts';

const rgb = (hex) => hex.slice(1).match(/../g).map((part) => parseInt(part, 16) / 255);
const luminance = (channels) => channels
  .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  .reduce((sum, value, channel) => sum + value * [0.2126, 0.7152, 0.0722][channel], 0);
const contrastRgb = (first, second) => {
  const levels = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (levels[0] + 0.05) / (levels[1] + 0.05);
};

const contrast = (first, second) => contrastRgb(rgb(first), rgb(second));
const blend = (base, tint, opacity) =>
  rgb(base).map((channel, index) => (1 - opacity) * channel + opacity * rgb(tint)[index]);

const surfaces = ['canvas', 'surface', 'surfaceRaised'];
const accents = ['primary', 'secondary', 'attention', 'danger', 'success'];

const minima = new Map();

for (const theme of TEMAS) {
  for (const mode of COLOR_PALETTE_MODES) {
    test(`${theme} / ${mode} preserves theme structure and verifies contrast across intensities`, () => {
      const { roles, pain, mood } = theme === 'escuro' ? source : source.themes[theme];
      assert.deepEqual(resolverPaleta(theme, 'normal'), { roles, pain, mood, legacy: source.legacy });
      if (mode === 'original') return;

      for (const intensity of INTENSIDADES_CORES) {
        const base = resolverPaleta(theme, intensity, 'original');
        const palette = resolverPaleta(theme, intensity, mode);
        for (const key of [...surfaces, 'line', 'lineStrong', 'scrim', 'focus', ...accents.map((role) => `${role}Subtle`)]) {
          assert.equal(palette.roles[key], base.roles[key], key);
        }
        if (intensity !== 'sem-cor') {
          assert.notDeepEqual(palette.pain, base.pain);
          assert.notEqual(palette.roles.primary, base.roles.primary);
          assert.equal(new Set(Object.values(palette.pain)).size, 11);
          assert.equal(new Set(Object.values(palette.mood)).size, 5);
        }

        const pairs = [
          ...surfaces.flatMap((background) => ['content', 'contentMuted', ...accents]
            .map((foreground) => ['roles', foreground, background, 4.5])),
          ...accents.map((accent) => ['roles', accent, `${accent}Subtle`, 4.5]),
          ['roles', 'onPrimary', 'primaryStrong', 4.5],
          ...Object.keys(palette.pain).map((key) => ['pain', key, 'canvas', 4.5]),
          ...Object.keys(palette.mood).map((key) => ['mood', key, 'surfaceRaised', 3]),
        ];
        for (const [group, foreground, background, min] of pairs) {
          const actual = contrast(palette[group][foreground], palette.roles[background]);
          const original = contrast(base[group][foreground], base.roles[background]);
          const threshold = theme === 'alto-contraste' ? Math.max(original, min) : min;
          assert.ok(actual >= threshold, `${intensity}: ${group}.${foreground}/${background} ${actual.toFixed(3)} < ${threshold.toFixed(3)}`);
          const key = `${theme} / ${group}`;
          minima.set(key, Math.min(actual, minima.get(key) ?? Infinity));
        }
      }
    });
  }
}

test('reports minimum measured contrasts in adapted themes', (context) => {
  for (const [key, ratio] of minima) context.diagnostic(`${key}: ${ratio.toFixed(3)}:1`);
});

test('intensity remains an independent transform of the composed palette', () => {
  for (const theme of TEMAS) {
    for (const mode of COLOR_PALETTE_MODES) {
      const normal = resolverPaleta(theme, 'normal', mode);
      const soft = resolverPaleta(theme, 'suaves', mode);
      const gray = resolverPaleta(theme, 'sem-cor', mode);
      assert.notEqual(soft.roles.primary, normal.roles.primary);
      assert.equal(new Set(rgb(gray.roles.primary)).size, 1);
    }
  }
});

test('keeps calendar dates legible and preserves their original high-contrast ratios', (context) => {
  let minimum = Infinity;
  let highContrastMinimum = Infinity;
  for (const theme of TEMAS) {
    for (const intensity of INTENSIDADES_CORES) {
      const base = resolverPaleta(theme, intensity);
      for (const mode of COLOR_PALETTE_MODES) {
        const { roles, pain } = resolverPaleta(theme, intensity, mode);
        const opacity = calendarPainTintOpacity(theme, mode);
        for (const [level, tint] of Object.entries(pain)) {
          const surface = blend(roles.canvas, tint, opacity);
          const ratio = contrastRgb(rgb(roles.content), surface);
          minimum = Math.min(minimum, ratio);
          assert.ok(ratio >= 4.5, `${theme}/${intensity}/${mode}/${level}`);
          if (theme === 'alto-contraste') {
            const originalSurface = blend(base.roles.canvas, base.pain[level], calendarPainTintOpacity(theme, 'original'));
            assert.ok(ratio >= contrastRgb(rgb(base.roles.content), originalSurface));
            if (mode !== 'original') assert.ok(contrastRgb(rgb(tint), surface) >= 3);
            highContrastMinimum = Math.min(highContrastMinimum, ratio);
          }
        }
      }
    }
  }
  context.diagnostic(`calendar: ${minimum.toFixed(3)}:1, high contrast: ${highContrastMinimum.toFixed(3)}:1`);
});
