import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';
import test from 'node:test';
import rawPalette from '../constants/colors.json' with { type: 'json' };
import { createColorVariables, parseColor } from '../constants/colorTheme.ts';

const require = createRequire(import.meta.url);
const { roles, pain, mood, legacy } = rawPalette;
const palette = { roles, pain, mood, legacy };

test('derives raw, RGB and alpha variables from the original palette', () => {
  const variables = createColorVariables(palette);

  assert.equal(variables['--color-canvas'], '#0F2733');
  assert.equal(variables['--color-canvas-rgb'], '15 39 51');
  assert.equal(variables['--color-surface-raised'], '#1E3A52');
  assert.equal(variables['--color-pain-6'], '#F97316');
  assert.equal(variables['--color-pain-6-rgb'], '249 115 22');
  assert.equal(variables['--color-mood-so-so'], '#EAB308');
  assert.equal(variables['--color-bg-dark'], '#112F3D');
  assert.equal(variables['--color-scrim'], 'rgba(0, 0, 0, 0.6)');
  assert.equal(variables['--color-scrim-rgb'], '0 0 0');
  assert.equal(variables['--color-scrim-alpha'], '0.6');

  const rawVariables = Object.keys(variables).filter((name) => !name.endsWith('-rgb') && !name.endsWith('-alpha'));
  const rgbVariables = Object.keys(variables).filter((name) => name.endsWith('-rgb'));
  const alphaVariables = Object.keys(variables).filter((name) => name.endsWith('-alpha'));
  assert.equal(rawVariables.length, 45);
  assert.equal(rgbVariables.length, 45);
  assert.equal(alphaVariables.length, 45);
});

test('parses supported opaque and transparent CSS color forms', () => {
  assert.deepEqual(parseColor('#abc'), { channels: '170 187 204', alpha: '1' });
  assert.deepEqual(parseColor('#abcd'), { channels: '170 187 204', alpha: '0.8667' });
  assert.deepEqual(parseColor('#AABBCCDD'), { channels: '170 187 204', alpha: '0.8667' });
  assert.deepEqual(parseColor('rgb(1, 2, 3)'), { channels: '1 2 3', alpha: '1' });
  assert.deepEqual(parseColor('rgba(1, 2, 3, 0.25)'), { channels: '1 2 3', alpha: '0.25' });
  assert.deepEqual(parseColor('rgb(4 5 6 / 50%)'), { channels: '4 5 6', alpha: '0.5' });
  assert.deepEqual(parseColor('transparent'), { channels: '0 0 0', alpha: '0' });
});

test('keeps unsupported CSS values raw without inventing RGB channels', () => {
  const customPalette = {
    ...palette,
    roles: { ...palette.roles, primary: 'hsl(180 67% 44%)' },
  };

  assert.equal(parseColor(customPalette.roles.primary), null);
  const variables = createColorVariables(customPalette);
  assert.equal(variables['--color-primary'], 'hsl(180 67% 44%)');
  assert.equal(variables['--color-primary-rgb'], undefined);
  assert.equal(variables['--color-primary-alpha'], undefined);
});

test('maps every semantic NativeWind token to runtime RGB and alpha variables', () => {
  const originalLoad = Module._load;
  Module._load = function load(request, parent, isMain) {
    if (request === 'nativewind/preset') return {};
    return originalLoad.call(this, request, parent, isMain);
  };

  let config;
  try {
    delete require.cache[require.resolve('../tailwind.config.js')];
    config = require('../tailwind.config.js');
  } finally {
    Module._load = originalLoad;
  }

  const colors = config.theme.extend.colors;
  const runtime = (token, value) => {
    const { channels, alpha } = parseColor(value);
    return `rgb(var(--color-${token}-rgb, ${channels}) / calc(var(--color-${token}-alpha, ${alpha}) * <alpha-value>))`;
  };
  const expectedTokens = [
    'canvas', 'surface', 'surface-raised', 'line', 'line-strong', 'content', 'content-muted',
    'primary', 'primary-strong', 'primary-subtle', 'secondary', 'secondary-subtle', 'attention',
    'attention-subtle', 'danger', 'danger-subtle', 'success', 'success-subtle', 'scrim', 'on-primary', 'focus',
    'pain-0', 'pain-1', 'pain-2', 'pain-3', 'pain-4', 'pain-5', 'pain-6', 'pain-7', 'pain-8',
    'pain-9', 'pain-10', 'mood-terrible', 'mood-bad', 'mood-so-so', 'mood-okay', 'mood-great', 'accent', 'bg-dark',
    'muted', 'soft', 'card-dark', 'border-dark', 'purple', 'orange',
  ];

  assert.deepEqual(Object.keys(colors).sort(), expectedTokens.sort());
  const variables = createColorVariables(palette);
  for (const token of expectedTokens) {
    assert.equal(colors[token], runtime(token, variables[`--color-${token}`]));
  }
});

test('derives a deliberately different test palette without mutating the original', () => {
  const testPalette = {
    ...palette,
    roles: { ...palette.roles, primary: '#010203', scrim: 'rgba(4, 5, 6, 0.25)' },
    pain: { ...palette.pain, 6: '#070809' },
    mood: { ...palette.mood, great: '#0A0B0C' },
    legacy: { ...palette.legacy, accent: '#0D0E0F' },
  };

  const variables = createColorVariables(testPalette);
  assert.equal(variables['--color-primary-rgb'], '1 2 3');
  assert.equal(variables['--color-scrim-rgb'], '4 5 6');
  assert.equal(variables['--color-scrim-alpha'], '0.25');
  assert.equal(variables['--color-pain-6-rgb'], '7 8 9');
  assert.equal(variables['--color-mood-great-rgb'], '10 11 12');
  assert.equal(variables['--color-accent-rgb'], '13 14 15');
  assert.equal(palette.roles.primary, '#25B7BB');
  assert.equal(palette.pain[6], '#F97316');
  assert.equal(palette.mood.great, '#10B981');
  assert.equal(palette.legacy.accent, '#25B7BB');
});
