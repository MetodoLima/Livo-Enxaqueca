import palette from './colors.json';

type ColorGroup<T> = {
  readonly [Key in keyof T]: string;
};

export type ColorPalette = {
  readonly [Group in keyof typeof palette]: ColorGroup<(typeof palette)[Group]>;
};

export const originalPalette: ColorPalette = palette;

export const color = originalPalette.roles;

export const painColor = originalPalette.pain;

export const moodColor = originalPalette.mood;

export const Colors = originalPalette.legacy;
