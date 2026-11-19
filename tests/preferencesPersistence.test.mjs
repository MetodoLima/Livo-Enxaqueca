import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPreferenceWriteQueue,
  interpretPreferences,
  mergePreferences,
  serializePreferences,
  shouldApplyHydration,
} from '../contexts/preferencesPersistence.ts';
import {
  COLOR_PALETTE_MODES,
  isColorPaletteMode,
  selectColorPalette,
} from '../constants/colorPaletteMode.ts';
import { PREFERENCIAS_PADRAO } from '../constants/preferences.ts';

const TYPOGRAPHY = {
  tamanho: 'maior',
  fonte: 'dislexia',
  negrito: true,
  linhas: 'amplo',
  letras: 'medio',
};

test('defaults a fresh installation to Original without changing typography defaults', () => {
  assert.deepEqual(interpretPreferences(null), {
    tamanho: 'padrao',
    fonte: 'padrao',
    negrito: false,
    linhas: 'padrao',
    letras: 'padrao',
    modoDeCores: 'original',
  });
});

test('migrates an old v1 payload by preserving typography and adding Original', () => {
  const stored = JSON.stringify({ versao: 1, ...TYPOGRAPHY });

  assert.deepEqual(interpretPreferences(stored), {
    ...TYPOGRAPHY,
    modoDeCores: 'original',
  });
});

test('reads every valid color mode from a v1 payload', () => {
  for (const modoDeCores of ['original', 'deuteranopia', 'protanopia', 'tritanopia']) {
    assert.equal(
      interpretPreferences(JSON.stringify({ versao: 1, ...TYPOGRAPHY, modoDeCores })).modoDeCores,
      modoDeCores,
    );
  }
});

test('falls back only an invalid color mode while preserving valid typography', () => {
  assert.deepEqual(
    interpretPreferences(JSON.stringify({ versao: 1, ...TYPOGRAPHY, modoDeCores: 'inexistente' })),
    { ...TYPOGRAPHY, modoDeCores: 'original' },
  );
});

test('falls back safely when stored JSON is malformed', () => {
  assert.deepEqual(interpretPreferences('{nao-e-json'), {
    tamanho: 'padrao',
    fonte: 'padrao',
    negrito: false,
    linhas: 'padrao',
    letras: 'padrao',
    modoDeCores: 'original',
  });
});

test('normalizes invalid typography fields independently', () => {
  const stored = JSON.stringify({
    versao: 1,
    tamanho: 'gigante',
    fonte: 'dislexia',
    negrito: 'sim',
    linhas: 'amplo',
    letras: 5,
    modoDeCores: 'protanopia',
  });

  assert.deepEqual(interpretPreferences(stored), {
    tamanho: 'padrao',
    fonte: 'dislexia',
    negrito: false,
    linhas: 'amplo',
    letras: 'padrao',
    modoDeCores: 'protanopia',
  });
});

test('merges a mode change without overwriting typography and serializes the complete v1 payload', () => {
  const next = mergePreferences({ ...TYPOGRAPHY, modoDeCores: 'original' }, { modoDeCores: 'tritanopia' });

  assert.deepEqual(next, { ...TYPOGRAPHY, modoDeCores: 'tritanopia' });
  assert.deepEqual(JSON.parse(serializePreferences(next)), {
    versao: 1,
    ...TYPOGRAPHY,
    modoDeCores: 'tritanopia',
  });
});

test('the complete default used by restore selects Original', () => {
  assert.deepEqual(PREFERENCIAS_PADRAO, {
    tamanho: 'padrao',
    fonte: 'padrao',
    negrito: false,
    linhas: 'padrao',
    letras: 'padrao',
    modoDeCores: 'original',
  });
});

test('restoring defaults replaces every typography preference and the color mode together', () => {
  const customized = {
    ...TYPOGRAPHY,
    modoDeCores: 'tritanopia',
  };

  assert.deepEqual(mergePreferences(customized, PREFERENCIAS_PADRAO), PREFERENCIAS_PADRAO);
});

test('selects registry values by the single typed mode identifiers', () => {
  const registry = {
    original: 'paleta-original',
    deuteranopia: 'paleta-deuteranopia',
    protanopia: 'paleta-protanopia',
    tritanopia: 'paleta-tritanopia',
  };

  assert.deepEqual(COLOR_PALETTE_MODES, ['original', 'deuteranopia', 'protanopia', 'tritanopia']);
  assert.equal(isColorPaletteMode('tritanopia'), true);
  assert.equal(isColorPaletteMode('desconhecido'), false);
  assert.equal(selectColorPalette(registry, 'protanopia'), 'paleta-protanopia');
});

test('rejects hydration that started before a local preference change', () => {
  assert.equal(shouldApplyHydration(3, 3), true);
  assert.equal(shouldApplyHydration(3, 4), false);
});

test('serializes consecutive writes so the latest preference is persisted last', async () => {
  const events = [];
  let releaseFirst;
  const firstBlocked = new Promise((resolve) => { releaseFirst = resolve; });
  let calls = 0;
  const enqueue = createPreferenceWriteQueue(async (serialized) => {
    calls += 1;
    const mode = JSON.parse(serialized).modoDeCores;
    events.push(`start:${mode}`);
    if (calls === 1) await firstBlocked;
    events.push(`finish:${mode}`);
  });

  const first = enqueue({ ...PREFERENCIAS_PADRAO, modoDeCores: 'deuteranopia' });
  const second = enqueue({ ...PREFERENCIAS_PADRAO, modoDeCores: 'tritanopia' });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(events, ['start:deuteranopia']);

  releaseFirst();
  await Promise.all([first, second]);
  assert.deepEqual(events, [
    'start:deuteranopia',
    'finish:deuteranopia',
    'start:tritanopia',
    'finish:tritanopia',
  ]);
});

test('continues the write queue after a failed persistence attempt', async () => {
  const persisted = [];
  let calls = 0;
  const enqueue = createPreferenceWriteQueue(async (serialized) => {
    calls += 1;
    if (calls === 1) throw new Error('falha temporaria');
    persisted.push(JSON.parse(serialized).modoDeCores);
  });

  await assert.rejects(enqueue({ ...PREFERENCIAS_PADRAO, modoDeCores: 'deuteranopia' }));
  await enqueue({ ...PREFERENCIAS_PADRAO, modoDeCores: 'protanopia' });
  assert.deepEqual(persisted, ['protanopia']);
});
