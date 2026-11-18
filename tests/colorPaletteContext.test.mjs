import assert from 'node:assert/strict';
import test from 'node:test';
import React, { createElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import palette from '../constants/colors.json' with { type: 'json' };
import {
  deuteranopiaPalette,
  protanopiaPalette,
  tritanopiaPalette,
} from '../constants/accessibilityPalettes.ts';
import { ColorPaletteProvider, useColorPalette } from '../contexts/ColorPaletteContext.ts';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('updates JavaScript palette consumers immediately when the provider palette changes', async () => {
  const observed = [];
  const testPalette = {
    ...palette,
    roles: { ...palette.roles, primary: '#010203' },
    pain: { ...palette.pain, 6: '#070809' },
    mood: { ...palette.mood, great: '#0A0B0C' },
    legacy: { ...palette.legacy, accent: '#0D0E0F' },
  };

  function Probe() {
    const active = useColorPalette();
    observed.push({
      primary: active.roles.primary,
      pain: active.pain[6],
      mood: active.mood.great,
      legacy: active.legacy.accent,
    });
    return null;
  }

  let renderer;
  await act(async () => {
    renderer = TestRenderer.create(
      createElement(ColorPaletteProvider, { palette }, createElement(Probe)),
    );
  });
  await act(async () => {
    renderer.update(
      createElement(ColorPaletteProvider, { palette: testPalette }, createElement(Probe)),
    );
  });

  assert.deepEqual(observed, [
    { primary: '#25B7BB', pain: '#F97316', mood: '#10B981', legacy: '#25B7BB' },
    { primary: '#010203', pain: '#070809', mood: '#0A0B0C', legacy: '#0D0E0F' },
  ]);

  await act(async () => renderer.unmount());
});

test('switches reactively through all four production palettes without remounting consumers', async () => {
  const observed = [];

  function Probe() {
    const active = useColorPalette();
    observed.push([active.roles.primary, active.pain[10], active.mood.great, active.legacy.accent]);
    return null;
  }

  let renderer;
  const render = (active) => createElement(ColorPaletteProvider, { palette: active }, createElement(Probe));
  await act(async () => { renderer = TestRenderer.create(render(palette)); });
  await act(async () => { renderer.update(render(deuteranopiaPalette)); });
  await act(async () => { renderer.update(render(protanopiaPalette)); });
  await act(async () => { renderer.update(render(tritanopiaPalette)); });

  assert.equal(observed.length, 4);
  assert.equal(new Set(observed.map((values) => values.join('|'))).size, 4);
  assert.deepEqual(observed[0], ['#25B7BB', '#991B1B', '#10B981', '#25B7BB']);

  await act(async () => renderer.unmount());
});
