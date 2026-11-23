import palette from './colors.json' with { type: 'json' };

import type { Tema } from './preferences.ts';

export { TEMAS, TEMA_PADRAO, type Tema } from './preferences.ts';

export type Papeis = typeof palette.roles;
export type EscalaDeDor = typeof palette.pain;
export type EscalaDeHumor = typeof palette.mood;

export interface Paleta {
  roles: Papeis;
  pain: EscalaDeDor;
  mood: EscalaDeHumor;
}

export const PALETAS: Record<Tema, Paleta> = {
  escuro: { roles: palette.roles, pain: palette.pain, mood: palette.mood },
  claro: palette.themes.claro,
  'alto-contraste': palette.themes['alto-contraste'],
};

export const ROTULO_DO_TEMA: Record<Tema, string> = {
  escuro: 'Escuro',
  claro: 'Claro',
  'alto-contraste': 'Alto contraste',
};
