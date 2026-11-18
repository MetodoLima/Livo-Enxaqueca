import type { ColorPalette } from './Colors';

export type ParsedColor = {
  channels: string;
  alpha: string;
};

export type ColorVariables = Record<`--${string}`, string>;

const GROUP_PREFIX: Record<keyof ColorPalette, string> = {
  roles: '',
  pain: 'pain-',
  mood: 'mood-',
  legacy: '',
};

function kebab(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function alphaFromByte(value: number): string {
  return String(Math.round((value / 255) * 10_000) / 10_000);
}

function parseAlpha(value: string | undefined): string | null {
  if (value === undefined) return '1';

  const trimmed = value.trim();
  const percentage = trimmed.endsWith('%');
  const numeric = Number(percentage ? trimmed.slice(0, -1) : trimmed);
  const alpha = percentage ? numeric / 100 : numeric;

  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) return null;
  return String(alpha);
}

function parseHex(value: string): ParsedColor | null {
  const match = /^#([\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.exec(value);
  if (!match) return null;

  const compact = match[1];
  const expanded = compact.length <= 4
    ? [...compact].map((character) => character.repeat(2)).join('')
    : compact;
  const channels = [0, 2, 4].map((offset) => Number.parseInt(expanded.slice(offset, offset + 2), 16));
  const alpha = expanded.length === 8 ? alphaFromByte(Number.parseInt(expanded.slice(6, 8), 16)) : '1';

  return { channels: channels.join(' '), alpha };
}

function parseRgb(value: string): ParsedColor | null {
  const match = /^rgba?\((.*)\)$/i.exec(value);
  if (!match) return null;

  const slashParts = match[1].split(/\s*\/\s*/);
  if (slashParts.length > 2) return null;

  const parts = slashParts[0].replaceAll(',', ' ').trim().split(/\s+/);
  const inlineAlpha = parts.length === 4 ? parts.pop() : undefined;
  if (parts.length !== 3) return null;

  const channels = parts.map(Number);
  if (channels.some((channel) => !Number.isInteger(channel) || channel < 0 || channel > 255)) return null;

  const alpha = parseAlpha(slashParts[1] ?? inlineAlpha);
  if (alpha === null) return null;

  return { channels: channels.join(' '), alpha };
}

export function parseColor(value: string): ParsedColor | null {
  const normalized = value.trim();
  if (normalized.toLowerCase() === 'transparent') return { channels: '0 0 0', alpha: '0' };
  return parseHex(normalized) ?? parseRgb(normalized);
}

export function createColorVariables(palette: ColorPalette): ColorVariables {
  const variables: ColorVariables = {};

  for (const group of Object.keys(palette) as (keyof ColorPalette)[]) {
    for (const [name, value] of Object.entries(palette[group])) {
      const token = `${GROUP_PREFIX[group]}${kebab(name)}`;
      variables[`--color-${token}`] = value;

      const parsed = parseColor(value);
      if (parsed) {
        variables[`--color-${token}-rgb`] = parsed.channels;
        variables[`--color-${token}-alpha`] = parsed.alpha;
      }
    }
  }

  return variables;
}
