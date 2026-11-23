import rawPalette from './colors.json' with { type: 'json' };
import { PALETAS, type Tema } from './temas.ts';
import { deuteranopiaPalette, protanopiaPalette, tritanopiaPalette } from './accessibilityPalettes.ts';
import { parseColor } from './colorTheme.ts';
import type { ColorPaletteMode } from './colorPaletteMode.ts';
import type { IntensidadeCores } from './preferences.ts';

export type { IntensidadeCores } from './preferences.ts';
export type ThemeMode = Tema;

export interface ColorPalette {
  roles: typeof rawPalette.roles;
  pain: typeof rawPalette.pain;
  mood: typeof rawPalette.mood;
  legacy: typeof rawPalette.legacy;
}

const { roles, pain, mood, legacy } = rawPalette;
export const originalPalette: ColorPalette = { roles, pain, mood, legacy };

const alternativas = {
  deuteranopia: deuteranopiaPalette,
  protanopia: protanopiaPalette,
  tritanopia: tritanopiaPalette,
};

export function hexToRgba(cor: string): [number, number, number, number] {
  const parsed = parseColor(cor);
  if (!parsed) return [0, 0, 0, 1];
  const [r, g, b] = parsed.channels.split(' ').map(Number);
  return [r, g, b, Number(parsed.alpha)];
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
  if (tema === 'escuro') return originalPalette;
  return { ...(PALETAS[tema] ?? PALETAS.escuro), legacy };
}

const tons = ['primary', 'secondary', 'attention', 'danger', 'success'] as const;

function linearRgb(cor: string) {
  return hexToRgba(cor).slice(0, 3).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
}

function luminancia(cor: string): number {
  return calcularLuminanciaRelativa(...linearRgb(cor));
}

/** Recolore um token com a tonalidade adaptada e a luminância exigida pelo tema. */
function ajustarLuminancia(cor: string, alvo: number, claro: boolean): string {
  const rgb = linearRgb(cor);
  const atual = calcularLuminanciaRelativa(...rgb);
  const canais = rgb.map((canal) => {
    const linear = alvo <= atual
      ? canal * (atual ? alvo / atual : 0)
      : canal + (1 - canal) * ((alvo - atual) / (1 - atual));
    const srgb = linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055;
    return claro ? Math.floor(srgb * 255 + 1e-8) : Math.ceil(srgb * 255 - 1e-8);
  });
  return rgbaToHex([canais[0], canais[1], canais[2], 1]);
}

function adaptarDaltonismo(base: ColorPalette, alternativa: ColorPalette, tema: ThemeMode): ColorPalette {
  const claro = tema === 'claro';
  const superficies = [base.roles.canvas, base.roles.surface, base.roles.surfaceRaised];
  const limite = (fundos: string[], proporcao: number) => {
    const niveis = fundos.map(luminancia);
    return claro
      ? (Math.min(...niveis) + 0.05) / proporcao - 0.05
      : (Math.max(...niveis) + 0.05) * proporcao - 0.05;
  };
  const adaptar = (original: string, cor: string, fundos: string[], proporcao: number, manterNivel = true) => {
    const nivel = luminancia(manterNivel ? original : cor);
    const minimo = limite(fundos, proporcao);
    const alvo = claro ? Math.min(nivel, minimo) : Math.max(nivel, minimo);
    return ajustarLuminancia(cor, Math.min(1, Math.max(0, alvo)), claro);
  };

  const roles = { ...base.roles };
  for (const tom of tons) {
    roles[tom] = adaptar(base.roles[tom], alternativa.roles[tom], [...superficies, base.roles[`${tom}Subtle`]], 4.5);
  }
  // O preenchimento do botão contrasta com onPrimary, que pertence ao tema.
  const textoDoBotaoClaro = luminancia(base.roles.onPrimary) > luminancia(base.roles.primaryStrong);
  roles.primaryStrong = ajustarLuminancia(
    alternativa.roles.primaryStrong,
    luminancia(base.roles.primaryStrong),
    textoDoBotaoClaro,
  );

  const adaptarGrupo = <T extends Record<string, string>>(grupo: T, cores: T, fundos: string[], proporcao: number): T =>
    Object.fromEntries(Object.keys(grupo).map((chave) => [
      chave,
      adaptar(grupo[chave], cores[chave], fundos, proporcao, tema === 'alto-contraste'),
    ])) as T;

  return {
    roles,
    pain: adaptarGrupo(base.pain, alternativa.pain, [base.roles.canvas], 4.5),
    mood: adaptarGrupo(base.mood, alternativa.mood, superficies, 3),
    legacy: { ...base.legacy, accent: roles.primary, purple: roles.secondary, orange: roles.attention },
  };
}

export function resolverPaleta(
  tema: ThemeMode = 'escuro',
  intensidade: IntensidadeCores = 'normal',
  modoDeCores: ColorPaletteMode = 'original',
): ColorPalette {
  const base = gerarPaletaComIntensidade(obterPaletaDoTema(tema), intensidade);
  if (modoDeCores === 'original') return base;
  const alternativa = gerarPaletaComIntensidade(alternativas[modoDeCores], intensidade);
  return adaptarDaltonismo(base, alternativa, tema);
}

let paletaAtiva = originalPalette;

export function definirPaletaAtiva(paleta: ColorPalette) {
  paletaAtiva = paleta;
}

export function obterPaletaAtiva(): ColorPalette {
  return paletaAtiva;
}

function grupoAtivo<K extends keyof ColorPalette>(grupo: K): ColorPalette[K] {
  return new Proxy(originalPalette[grupo], {
    get(alvo, chave) {
      return Reflect.get(paletaAtiva[grupo], chave) ?? Reflect.get(alvo, chave);
    },
    getOwnPropertyDescriptor(alvo, chave) {
      return Reflect.getOwnPropertyDescriptor(paletaAtiva[grupo], chave) ?? Reflect.getOwnPropertyDescriptor(alvo, chave);
    },
  });
}

export const color = grupoAtivo('roles');
export const painColor = grupoAtivo('pain');
export const moodColor = grupoAtivo('mood');
export const Colors = grupoAtivo('legacy');
