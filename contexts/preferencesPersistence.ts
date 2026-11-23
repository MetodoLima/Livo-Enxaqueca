import { isColorPaletteMode } from '../constants/colorPaletteMode.ts';
import {
  ESPACOS,
  FONTES,
  INTENSIDADES_CORES,
  PREFERENCIAS_PADRAO,
  TAMANHOS,
  TEMAS,
  type Preferencias,
} from '../constants/preferences.ts';

export const PREFERENCES_STORAGE_KEY = 'livo.preferencias.v1';
export const PREFERENCES_STORAGE_VERSION = 1;

const oneOf = <T extends string>(values: readonly T[], value: unknown, fallback: T): T =>
  values.includes(value as T) ? (value as T) : fallback;

export function interpretPreferences(raw: string | null): Preferencias {
  if (!raw) return { ...PREFERENCIAS_PADRAO };

  try {
    const stored: unknown = JSON.parse(raw);
    if (!stored || typeof stored !== 'object' || !('versao' in stored) || stored.versao !== PREFERENCES_STORAGE_VERSION) {
      return { ...PREFERENCIAS_PADRAO };
    }

    const value = stored as Record<string, unknown>;
    return {
      tamanho: oneOf(TAMANHOS, value.tamanho, PREFERENCIAS_PADRAO.tamanho),
      fonte: oneOf(FONTES, value.fonte, PREFERENCIAS_PADRAO.fonte),
      negrito: typeof value.negrito === 'boolean' ? value.negrito : PREFERENCIAS_PADRAO.negrito,
      linhas: oneOf(ESPACOS, value.linhas, PREFERENCIAS_PADRAO.linhas),
      letras: oneOf(ESPACOS, value.letras, PREFERENCIAS_PADRAO.letras),
      tema: oneOf(TEMAS, value.tema, PREFERENCIAS_PADRAO.tema),
      intensidadeCores: oneOf(INTENSIDADES_CORES, value.intensidadeCores, PREFERENCIAS_PADRAO.intensidadeCores),
      modoDeCores: isColorPaletteMode(value.modoDeCores)
        ? value.modoDeCores
        : PREFERENCIAS_PADRAO.modoDeCores,
    };
  } catch {
    return { ...PREFERENCIAS_PADRAO };
  }
}

export function serializePreferences(preferences: Preferencias): string {
  return JSON.stringify({ versao: PREFERENCES_STORAGE_VERSION, ...preferences });
}

export function mergePreferences(
  current: Preferencias,
  change: Partial<Preferencias>,
): Preferencias {
  return { ...current, ...change };
}

export function shouldApplyHydration(startRevision: number, currentRevision: number): boolean {
  return startRevision === currentRevision;
}

export function createPreferenceWriteQueue(
  write: (serialized: string) => Promise<void>,
): (preferences: Preferencias) => Promise<void> {
  let pending = Promise.resolve();

  return (preferences) => {
    const writeOperation = pending
      .catch(() => undefined)
      .then(() => write(serializePreferences(preferences)));
    pending = writeOperation;
    return writeOperation;
  };
}
