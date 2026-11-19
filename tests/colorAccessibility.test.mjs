import assert from 'node:assert/strict';
import test from 'node:test';
import originalPalette from '../constants/colors.json' with { type: 'json' };
import {
  deuteranopiaPalette,
  protanopiaPalette,
  tritanopiaPalette,
} from '../constants/accessibilityPalettes.ts';
import { ORIGINAL_EMERGENCY_INTENSITY_COLORS } from '../constants/emergencyColors.ts';
import { createColorVariables, parseColor } from '../constants/colorTheme.ts';
import { optionCardSupportingTextTone } from '../components/ui/optionCardPresentation.ts';

const alternatives = {
  deuteranopia: deuteranopiaPalette,
  protanopia: protanopiaPalette,
  tritanopia: tritanopiaPalette,
};

const allPalettes = {
  original: originalPalette,
  ...alternatives,
};

const MACHADO_DICHROMACY = {
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

function linearChannel(byte) {
  const value = byte / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function linearRgb(color) {
  const parsed = parseColor(color);
  assert.ok(parsed, `unsupported color: ${color}`);
  return parsed.channels.split(' ').map(Number).map(linearChannel);
}

function luminance(color) {
  const [red, green, blue] = linearRgb(color);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function simulate(color, matrix) {
  const source = linearRgb(color);
  return matrix.map((row) => Math.max(0, Math.min(1, row.reduce((sum, value, index) => sum + value * source[index], 0))));
}

function oklab([red, green, blue]) {
  const l = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
  const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function screenedDistance(first, second, matrix) {
  const a = oklab(simulate(first, matrix));
  const b = oklab(simulate(second, matrix));
  return Math.hypot(...a.map((value, index) => value - b[index]));
}

const textPairs = [
  ['content', 'canvas'],
  ['content', 'surface'],
  ['content', 'surfaceRaised'],
  ['contentMuted', 'canvas'],
  ['contentMuted', 'surface'],
  ['contentMuted', 'surfaceRaised'],
  ['primary', 'canvas'],
  ['secondary', 'canvas'],
  ['attention', 'canvas'],
  ['danger', 'canvas'],
  ['success', 'canvas'],
  ['content', 'primaryStrong'],
  ['content', 'primarySubtle'],
  ['content', 'secondarySubtle'],
  ['content', 'attentionSubtle'],
  ['content', 'dangerSubtle'],
  ['content', 'successSubtle'],
];

test('each accessibility palette preserves the complete semantic shape and supported formats', () => {
  const expectedGroups = ['roles', 'pain', 'mood', 'legacy'];
  for (const [mode, palette] of Object.entries(alternatives)) {
    assert.deepEqual(Object.keys(palette), expectedGroups, mode);
    for (const group of expectedGroups) {
      assert.deepEqual(Object.keys(palette[group]), Object.keys(originalPalette[group]), `${mode}.${group}`);
      for (const [token, value] of Object.entries(palette[group])) {
        assert.equal(typeof value, 'string', `${mode}.${group}.${token}`);
        assert.ok(parseColor(value), `${mode}.${group}.${token}: ${value}`);
      }
    }
  }
});

test('each accessibility palette produces raw RGB and alpha variables for all 43 tokens', () => {
  for (const [mode, palette] of Object.entries(alternatives)) {
    const variables = createColorVariables(palette);
    assert.equal(Object.keys(variables).length, 129, mode);
    assert.equal(variables['--color-primary-rgb']?.split(' ').length, 3, mode);
    assert.equal(variables['--color-scrim-alpha'], '0.6', mode);
    assert.equal(variables['--color-pain-10-alpha'], '1', mode);
  }
});

test('accessibility palettes meet WCAG AA for real normal-text pairs', () => {
  for (const [mode, palette] of Object.entries(alternatives)) {
    for (const [foreground, background] of textPairs) {
      assert.ok(
        contrast(palette.roles[foreground], palette.roles[background]) >= 4.5,
        `${mode}: ${foreground} on ${background}`,
      );
    }
  }
});

test('accessibility palettes meet non-text contrast for semantic controls and pain markers', () => {
  const tones = ['primary', 'secondary', 'attention', 'danger', 'success'];
  for (const [mode, palette] of Object.entries(alternatives)) {
    for (const tone of tones) {
      assert.ok(contrast(palette.roles[tone], palette.roles.canvas) >= 3, `${mode}: ${tone} on canvas`);
      assert.ok(contrast(palette.roles[tone], palette.roles[`${tone}Subtle`]) >= 3, `${mode}: ${tone} on subtle`);
    }
    for (let intensity = 0; intensity <= 10; intensity += 1) {
      assert.ok(contrast(palette.pain[intensity], palette.roles.canvas) >= 3, `${mode}: pain ${intensity}`);
    }
  }
});

test('alternative Emergency intensity labels meet normal-text contrast', () => {
  for (const [mode, palette] of Object.entries(alternatives)) {
    for (let intensity = 1; intensity <= 10; intensity += 1) {
      assert.ok(
        contrast(palette.roles.canvas, palette.pain[intensity]) >= 4.5,
        `${mode}: Emergency intensity ${intensity}`,
      );
    }
  }
});

test('Original Emergency inner label surface meets normal-text contrast', () => {
  assert.ok(contrast(originalPalette.roles.content, originalPalette.roles.canvas) >= 4.5);
});

test('targeted CVD screening keeps key semantic roles and pain bands separated', () => {
  for (const [mode, palette] of Object.entries(alternatives)) {
    const matrix = MACHADO_DICHROMACY[mode];
    const pairs = [
      ['primary', 'attention'],
      ['primary', 'danger'],
      ['attention', 'danger'],
      ['success', 'danger'],
    ];
    for (const [first, second] of pairs) {
      assert.ok(
        screenedDistance(palette.roles[first], palette.roles[second], matrix) >= 0.1,
        `${mode}: ${first}/${second}`,
      );
    }
    assert.ok(screenedDistance(palette.pain[0], palette.pain[5], matrix) >= 0.08, `${mode}: pain 0/5`);
    assert.ok(screenedDistance(palette.pain[5], palette.pain[10], matrix) >= 0.08, `${mode}: pain 5/10`);
  }
});

test('alternative palettes retain numeric pain keys and do not mutate Original', () => {
  const originalSnapshot = JSON.stringify(originalPalette);
  for (const palette of Object.values(alternatives)) {
    assert.deepEqual(Object.keys(palette.pain), ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
    assert.notEqual(palette.pain[0], originalPalette.pain[0]);
    assert.notEqual(palette.pain[10], originalPalette.pain[10]);
  }
  assert.equal(JSON.stringify(originalPalette), originalSnapshot);
});

test('Original graphical contrast failures are identified separately from alternatives', () => {
  const painFailures = Object.entries(originalPalette.pain)
    .filter(([, color]) => contrast(color, originalPalette.roles.canvas) < 3)
    .map(([intensity]) => Number(intensity));
  assert.deepEqual(painFailures, [9, 10]);

  const emergencyTextFailures = ORIGINAL_EMERGENCY_INTENSITY_COLORS
    .map((background, index) => ({ intensity: index + 1, ratio: contrast('#FFFFFF', background) }))
    .filter(({ ratio }) => ratio < 4.5)
    .map(({ intensity }) => intensity);
  assert.deepEqual(emergencyTextFailures, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

test('OptionCard supporting text passes in selected, unselected and disabled states', () => {
  for (const [mode, palette] of Object.entries(allPalettes)) {
    const selectedRole = optionCardSupportingTextTone(true) === 'content' ? 'content' : 'contentMuted';
    const unselectedRole = optionCardSupportingTextTone(false) === 'content' ? 'content' : 'contentMuted';

    assert.ok(contrast(palette.roles[selectedRole], palette.roles.primarySubtle) >= 4.5, `${mode}: selected`);
    assert.ok(contrast(palette.roles[unselectedRole], palette.roles.surfaceRaised) >= 4.5, `${mode}: unselected`);
    assert.equal(optionCardSupportingTextTone(true), 'content', `${mode}: disabled selected keeps contrast`);
  }
});
