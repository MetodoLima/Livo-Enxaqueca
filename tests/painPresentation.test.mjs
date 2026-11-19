import assert from 'node:assert/strict';
import test from 'node:test';
import { painNeedsContrastOutline } from '../constants/painPresentation.ts';

test('adds a contrast outline only to Original pain levels 9 and 10', () => {
  for (const mode of ['original', 'deuteranopia', 'protanopia', 'tritanopia']) {
    for (let intensity = 0; intensity <= 10; intensity += 1) {
      assert.equal(
        painNeedsContrastOutline(mode, intensity),
        mode === 'original' && intensity >= 9,
        `${mode}: ${intensity}`,
      );
    }
  }
});
