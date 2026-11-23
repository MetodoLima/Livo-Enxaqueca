import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PDF_COLORS,
  PDF_INTENSITY_BACKGROUNDS,
  pdfIntensityBackground,
} from '../features/profile/pdfPresentation.ts';

function linearChannel(byte) {
  const value = byte / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(color) {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16));
  const [red, green, blue] = channels.map(linearChannel);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

test('PDF normal-text pairs meet WCAG AA contrast', () => {
  const pairs = [
    ['brand', 'header'],
    ['headerText', 'header'],
    ['headerMuted', 'header'],
    ['bodyText', 'page'],
    ['subtleText', 'page'],
    ['subtleText', 'card'],
    ['statLabel', 'statCard'],
    ['pillText', 'pillBackground'],
  ];

  for (const [foreground, background] of pairs) {
    assert.ok(
      contrast(PDF_COLORS[foreground], PDF_COLORS[background]) >= 4.5,
      `${foreground}/${background}`,
    );
  }
});

test('PDF intensity badges retain numeric bands and readable text', () => {
  assert.equal(pdfIntensityBackground(0), PDF_INTENSITY_BACKGROUNDS.low);
  assert.equal(pdfIntensityBackground(3), PDF_INTENSITY_BACKGROUNDS.low);
  assert.equal(pdfIntensityBackground(4), PDF_INTENSITY_BACKGROUNDS.medium);
  assert.equal(pdfIntensityBackground(6), PDF_INTENSITY_BACKGROUNDS.medium);
  assert.equal(pdfIntensityBackground(7), PDF_INTENSITY_BACKGROUNDS.high);
  assert.equal(pdfIntensityBackground(10), PDF_INTENSITY_BACKGROUNDS.high);

  for (const background of Object.values(PDF_INTENSITY_BACKGROUNDS)) {
    assert.ok(contrast(PDF_COLORS.badgeText, background) >= 4.5, background);
  }
});

test('PDF essential borders meet non-text contrast on every used surface', () => {
  for (const background of ['page', 'card', 'statCard', 'pillBackground']) {
    assert.ok(contrast(PDF_COLORS.line, PDF_COLORS[background]) >= 3, background);
  }
});
