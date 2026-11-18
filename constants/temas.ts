import palette from './colors.json';

export const TEMAS = ['escuro', 'claro', 'alto-contraste'] as const;
export type Tema = (typeof TEMAS)[number];

export const TEMA_PADRAO: Tema = 'escuro';

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

const kebab = (nome: string) => nome.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`);

const canais = (hex: string) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(' ');
};

/**
 * Variáveis CSS (canais RGB) consumidas pelo Tailwind em tailwind.config.js.
 * O scrim fica de fora porque carrega opacidade própria; use `color.scrim` direto.
 */
export function variaveisDoTema(tema: Tema): Record<string, string> {
  const { roles, pain, mood } = PALETAS[tema];
  const saida: Record<string, string> = {};
  for (const [nome, hex] of Object.entries(roles)) {
    if (nome !== 'scrim') saida[`--c-${kebab(nome)}`] = canais(hex);
  }
  for (const [nome, hex] of Object.entries(pain)) saida[`--c-pain-${nome}`] = canais(hex);
  for (const [nome, hex] of Object.entries(mood)) saida[`--c-mood-${kebab(nome)}`] = canais(hex);
  return saida;
}

export const ROTULO_DO_TEMA: Record<Tema, string> = {
  escuro: 'Escuro',
  claro: 'Claro',
  'alto-contraste': 'Alto contraste',
};
