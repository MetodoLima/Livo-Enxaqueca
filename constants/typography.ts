import type { TextStyle } from 'react-native';

export const VARIANTES = ['caption', 'body', 'heading', 'title', 'display', 'hero'] as const;
export type Variante = (typeof VARIANTES)[number];

export const PESOS = ['regular', 'semibold', 'bold'] as const;
export type Peso = (typeof PESOS)[number];

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
}

export const PREFERENCIAS_PADRAO: Preferencias = {
  tamanho: 'padrao',
  fonte: 'padrao',
  negrito: false,
  linhas: 'padrao',
  letras: 'padrao',
};

export const ESCALA: Record<Variante, { tamanho: number; linha: number }> = {
  caption: { tamanho: 13, linha: 18 },
  body: { tamanho: 16, linha: 24 },
  heading: { tamanho: 18, linha: 24 },
  title: { tamanho: 24, linha: 30 },
  display: { tamanho: 32, linha: 38 },
  hero: { tamanho: 48, linha: 52 },
};

export const MULTIPLICADOR_DE_TAMANHO: Record<Tamanho, number> = {
  padrao: 1,
  grande: 1.15,
  maior: 1.3,
};

export const MULTIPLICADOR_DE_LINHA: Record<Espaco, number> = {
  padrao: 1,
  medio: 1.15,
  amplo: 1.3,
};

export const ESPACO_ENTRE_LETRAS_EM: Record<Espaco, number> = {
  padrao: 0,
  medio: 0.05,
  amplo: 0.12,
};

export const AJUSTE_DE_LINHA_DA_FONTE: Record<Fonte, number> = {
  padrao: 1,
  legivel: 1,
  dislexia: 1.2,
};

export const ESCALA_MAXIMA = 2;

export const FAMILIAS: Record<Fonte, Record<Peso, string>> = {
  padrao: {
    regular: 'Epilogue_400Regular',
    semibold: 'Epilogue_600SemiBold',
    bold: 'Epilogue_700Bold',
  },
  legivel: {
    regular: 'AtkinsonHyperlegibleNext_400Regular',
    semibold: 'AtkinsonHyperlegibleNext_600SemiBold',
    bold: 'AtkinsonHyperlegibleNext_700Bold',
  },
  dislexia: {
    regular: 'OpenDyslexic_400Regular',
    semibold: 'OpenDyslexic_700Bold',
    bold: 'OpenDyslexic_700Bold',
  },
};

export const ARQUIVOS_DE_FONTE = {
  AtkinsonHyperlegibleNext_400Regular: require('../assets/fonts/AtkinsonHyperlegibleNext_400Regular.ttf'),
  AtkinsonHyperlegibleNext_600SemiBold: require('../assets/fonts/AtkinsonHyperlegibleNext_600SemiBold.ttf'),
  AtkinsonHyperlegibleNext_700Bold: require('../assets/fonts/AtkinsonHyperlegibleNext_700Bold.ttf'),
  OpenDyslexic_400Regular: require('../assets/fonts/OpenDyslexic-Regular.otf'),
  OpenDyslexic_700Bold: require('../assets/fonts/OpenDyslexic-Bold.otf'),
};

const UM_DEGRAU_ACIMA: Record<Peso, Peso> = {
  regular: 'semibold',
  semibold: 'bold',
  bold: 'bold',
};

export function pesoEfetivo(peso: Peso, negrito: boolean): Peso {
  return negrito ? UM_DEGRAU_ACIMA[peso] : peso;
}

export function escalaMaximaDoSistema(preferencias: Preferencias): number {
  return ESCALA_MAXIMA / MULTIPLICADOR_DE_TAMANHO[preferencias.tamanho];
}

export function fatorDeEscala(preferencias: Preferencias, escalaDoSistema: number): number {
  const sistema = Math.max(1, Math.min(escalaDoSistema, escalaMaximaDoSistema(preferencias)));
  return MULTIPLICADOR_DE_TAMANHO[preferencias.tamanho] * sistema;
}

const cache = new Map<string, TextStyle>();

export function estiloDeTexto(variante: Variante, peso: Peso, preferencias: Preferencias): TextStyle {
  const { tamanho, fonte, negrito, linhas, letras } = preferencias;
  const chave = `${variante}|${peso}|${tamanho}|${fonte}|${negrito}|${linhas}|${letras}`;
  const guardado = cache.get(chave);
  if (guardado) return guardado;

  const base = ESCALA[variante];
  const fontSize = Math.round(base.tamanho * MULTIPLICADOR_DE_TAMANHO[tamanho]);
  const estilo: TextStyle = {
    fontFamily: FAMILIAS[fonte][pesoEfetivo(peso, negrito)],
    fontSize,
    lineHeight: Math.round(
      base.linha * MULTIPLICADOR_DE_TAMANHO[tamanho] * MULTIPLICADOR_DE_LINHA[linhas] * AJUSTE_DE_LINHA_DA_FONTE[fonte],
    ),
    letterSpacing: Math.round(fontSize * ESPACO_ENTRE_LETRAS_EM[letras] * 10) / 10,
  };
  cache.set(chave, estilo);
  return estilo;
}
