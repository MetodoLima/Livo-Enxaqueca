import { useMemo } from 'react';
import { vars } from 'nativewind';
import rawPalette from './colors.json';
import { PALETAS, type Tema } from './temas';
import { usePreferences } from '@/contexts/PreferencesContext';

export type IntensidadeCores = 'normal' | 'suaves' | 'sem-cor';
export type ThemeMode = Tema;

export type ColorRoles = typeof rawPalette.roles;
export type ColorPain = typeof rawPalette.pain;
export type ColorMood = typeof rawPalette.mood;
export type ColorLegacy = typeof rawPalette.legacy;

export interface ColorPalette {
  roles: ColorRoles;
  pain: ColorPain;
  mood: ColorMood;
  legacy: ColorLegacy;
}

export function hexToRgba(cor: string): [number, number, number, number] {
  if (cor.startsWith('rgba')) {
    const m = cor.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
    if (m) {
      return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10), parseFloat(m[4])];
    }
  }
  const limpo = cor.replace('#', '');
  const r = parseInt(limpo.substring(0, 2), 16) || 0;
  const g = parseInt(limpo.substring(2, 4), 16) || 0;
  const b = parseInt(limpo.substring(4, 6), 16) || 0;
  return [r, g, b, 1];
}

export function rgbaToHex([r, g, b, a]: [number, number, number, number]): string {
  if (a < 1) {
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
  }
  const paraHex = (n: number) => Math.min(255, Math.max(0, Math.round(n))).toString(16).padStart(2, '0').toUpperCase();
  return `#${paraHex(r)}${paraHex(g)}${paraHex(b)}`;
}

export function calcularLuminanciaRelativa(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function aplicarIntensidadeNaCor(cor: string, intensidade: IntensidadeCores): string {
  if (intensidade === 'normal') return cor;

  const [r, g, b, a] = hexToRgba(cor);
  const y = calcularLuminanciaRelativa(r, g, b);
  const fator = intensidade === 'suaves' ? 0.5 : 1.0;

  const nr = (1 - fator) * r + fator * y;
  const ng = (1 - fator) * g + fator * y;
  const nb = (1 - fator) * b + fator * y;

  return rgbaToHex([nr, ng, nb, a]);
}

function transformarGrupo<T extends Record<string, string>>(grupo: T, intensidade: IntensidadeCores): T {
  if (intensidade === 'normal') return grupo;
  const resultado: Record<string, string> = {};
  for (const [chave, valor] of Object.entries(grupo)) {
    resultado[chave] = aplicarIntensidadeNaCor(valor, intensidade);
  }
  return resultado as T;
}

export function gerarPaletaComIntensidade(base: ColorPalette, intensidade: IntensidadeCores): ColorPalette {
  if (intensidade === 'normal') return base;
  return {
    roles: transformarGrupo(base.roles, intensidade),
    pain: transformarGrupo(base.pain, intensidade),
    mood: transformarGrupo(base.mood, intensidade),
    legacy: transformarGrupo(base.legacy, intensidade),
  };
}

export function obterPaletaDoTema(tema: ThemeMode): ColorPalette {
  const { roles, pain, mood } = PALETAS[tema] ?? PALETAS.escuro;
  return { roles, pain, mood, legacy: rawPalette.legacy };
}

export function resolverPaleta(tema: ThemeMode = 'escuro', intensidade: IntensidadeCores = 'normal'): ColorPalette {
  const base = obterPaletaDoTema(tema);
  return gerarPaletaComIntensidade(base, intensidade);
}

const kebab = (nome: string) => nome.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`);

export function gerarVariaveisCss(paleta: ColorPalette): Record<string, string | number> {
  const variaveis: Record<string, string | number> = {};

  const registrar = (grupo: Record<string, string>, prefixo = '') => {
    for (const [chave, cor] of Object.entries(grupo)) {
      const token = `${prefixo}${kebab(chave)}`;
      const [r, g, b, a] = hexToRgba(cor);
      variaveis[`--color-${token}-rgb`] = `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`;
      variaveis[`--color-${token}-alpha`] = a;
      variaveis[`--color-${token}`] = cor;
    }
  };

  registrar(paleta.roles);
  registrar(paleta.pain, 'pain-');
  registrar(paleta.mood, 'mood-');
  registrar(paleta.legacy);

  return variaveis;
}

let paletaAtiva: ColorPalette = rawPalette as ColorPalette;

export function definirPaletaAtiva(novaPaleta: ColorPalette) {
  paletaAtiva = novaPaleta;
}

export function obterPaletaAtiva(): ColorPalette {
  return paletaAtiva;
}

export const color = new Proxy({} as ColorRoles, {
  get(_target, prop: string) {
    return Reflect.get(paletaAtiva.roles, prop) ?? Reflect.get(rawPalette.roles, prop);
  },
  ownKeys() {
    return Reflect.ownKeys(paletaAtiva.roles);
  },
  getOwnPropertyDescriptor(_target, prop) {
    return {
      value: Reflect.get(paletaAtiva.roles, prop),
      enumerable: true,
      configurable: true,
    };
  },
});

export const painColor = new Proxy({} as ColorPain, {
  get(_target, prop: string) {
    return Reflect.get(paletaAtiva.pain, prop) ?? Reflect.get(rawPalette.pain, prop);
  },
  ownKeys() {
    return Reflect.ownKeys(paletaAtiva.pain);
  },
  getOwnPropertyDescriptor(_target, prop) {
    return {
      value: Reflect.get(paletaAtiva.pain, prop),
      enumerable: true,
      configurable: true,
    };
  },
});

export const moodColor = new Proxy({} as ColorMood, {
  get(_target, prop: string) {
    return Reflect.get(paletaAtiva.mood, prop) ?? Reflect.get(rawPalette.mood, prop);
  },
  ownKeys() {
    return Reflect.ownKeys(paletaAtiva.mood);
  },
  getOwnPropertyDescriptor(_target, prop) {
    return {
      value: Reflect.get(paletaAtiva.mood, prop),
      enumerable: true,
      configurable: true,
    };
  },
});

export const Colors = new Proxy({} as ColorLegacy, {
  get(_target, prop: string) {
    return Reflect.get(paletaAtiva.legacy, prop) ?? Reflect.get(rawPalette.legacy, prop);
  },
  ownKeys() {
    return Reflect.ownKeys(paletaAtiva.legacy);
  },
  getOwnPropertyDescriptor(_target, prop) {
    return {
      value: Reflect.get(paletaAtiva.legacy, prop),
      enumerable: true,
      configurable: true,
    };
  },
});

export function useThemeColors(): ColorPalette {
  const { preferencias } = usePreferences();
  return useMemo(
    () => resolverPaleta(preferencias.tema, preferencias.intensidadeCores),
    [preferencias.tema, preferencias.intensidadeCores],
  );
}

export function useThemeVars() {
  const { preferencias } = usePreferences();
  return useMemo(() => {
    const paleta = resolverPaleta(preferencias.tema, preferencias.intensidadeCores);
    return vars(gerarVariaveisCss(paleta));
  }, [preferencias.tema, preferencias.intensidadeCores]);
}
