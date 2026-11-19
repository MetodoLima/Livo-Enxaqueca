import type { ColorPaletteMode } from './colorPaletteMode.ts';

export const TAMANHOS = ['padrao', 'grande', 'maior'] as const;
export type Tamanho = (typeof TAMANHOS)[number];

export const FONTES = ['padrao', 'legivel', 'dislexia'] as const;
export type Fonte = (typeof FONTES)[number];

export const ESPACOS = ['padrao', 'medio', 'amplo'] as const;
export type Espaco = (typeof ESPACOS)[number];

export interface Preferencias {
  tamanho: Tamanho;
  fonte: Fonte;
  negrito: boolean;
  linhas: Espaco;
  letras: Espaco;
  modoDeCores: ColorPaletteMode;
}

export const PREFERENCIAS_PADRAO: Preferencias = {
  tamanho: 'padrao',
  fonte: 'padrao',
  negrito: false,
  linhas: 'padrao',
  letras: 'padrao',
  modoDeCores: 'original',
};
