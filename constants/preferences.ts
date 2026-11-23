import type { ColorPaletteMode } from './colorPaletteMode.ts';

export const TAMANHOS = ['padrao', 'grande', 'maior'] as const;
export type Tamanho = (typeof TAMANHOS)[number];

export const FONTES = ['padrao', 'legivel', 'dislexia'] as const;
export type Fonte = (typeof FONTES)[number];

export const ESPACOS = ['padrao', 'medio', 'amplo'] as const;
export type Espaco = (typeof ESPACOS)[number];

export const TEMAS = ['escuro', 'claro', 'alto-contraste'] as const;
export type Tema = (typeof TEMAS)[number];
export const TEMA_PADRAO: Tema = 'escuro';

export const INTENSIDADES_CORES = ['normal', 'suaves', 'sem-cor'] as const;
export type IntensidadeCores = (typeof INTENSIDADES_CORES)[number];

export interface Preferencias {
  tamanho: Tamanho;
  fonte: Fonte;
  negrito: boolean;
  linhas: Espaco;
  letras: Espaco;
  modoDeCores: ColorPaletteMode;
  tema: Tema;
  intensidadeCores: IntensidadeCores;
}

export const PREFERENCIAS_PADRAO: Preferencias = {
  tamanho: 'padrao',
  fonte: 'padrao',
  negrito: false,
  linhas: 'padrao',
  letras: 'padrao',
  modoDeCores: 'original',
  tema: TEMA_PADRAO,
  intensidadeCores: 'normal',
};
