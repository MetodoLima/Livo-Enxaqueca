import assert from 'node:assert/strict';
import test from 'node:test';
import originalPalette from '../constants/colors.json' with { type: 'json' };
import { deuteranopiaPalette } from '../constants/accessibilityPalettes.ts';
import {
  ORIGINAL_EMERGENCY_INTENSITY_COLORS,
  emergencyIntensityColor,
  emergencyIntensityLabelUsesInnerSurface,
} from '../constants/emergencyColors.ts';

test('preserves every Original emergency intensity color exactly', () => {
  assert.deepEqual(ORIGINAL_EMERGENCY_INTENSITY_COLORS, [
    '#FEE2E2', '#FEE2E2', '#FECACA', '#FECACA', '#FCA5A5',
    '#FCA5A5', '#F87171', '#F87171', '#EF4444', '#B91C1C',
  ]);
  for (let intensity = 1; intensity <= 10; intensity += 1) {
    assert.equal(
      emergencyIntensityColor(originalPalette, intensity, true),
      ORIGINAL_EMERGENCY_INTENSITY_COLORS[intensity - 1],
    );
  }
});

test('uses the active semantic pain scale outside Original mode', () => {
  for (let intensity = 1; intensity <= 10; intensity += 1) {
    assert.equal(
      emergencyIntensityColor(deuteranopiaPalette, intensity, false),
      deuteranopiaPalette.pain[intensity],
    );
  }
});

test('uses a dedicated high-contrast text surface only for Original intensity labels', () => {
  assert.equal(emergencyIntensityLabelUsesInnerSurface(true), true);
  assert.equal(emergencyIntensityLabelUsesInnerSurface(false), false);
});
