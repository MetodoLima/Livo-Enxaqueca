import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { PREFERENCIAS_PADRAO, type Preferencias } from '@/constants/typography';
import {
  createPreferenceWriteQueue,
  interpretPreferences,
  mergePreferences,
  PREFERENCES_STORAGE_KEY,
  shouldApplyHydration,
} from '@/contexts/preferencesPersistence';

const TEMPO_MAXIMO_DE_LEITURA_MS = 500;

interface PreferencesContextValue {
  preferencias: Preferencias;
  pronto: boolean;
  definir: (mudanca: Partial<Preferencias>) => void;
  restaurar: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue>({
  preferencias: PREFERENCIAS_PADRAO,
  pronto: true,
  definir: () => {},
  restaurar: () => {},
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferencias, setPreferencias] = useState<Preferencias>(PREFERENCIAS_PADRAO);
  const [pronto, setPronto] = useState(false);
  const atuais = useRef(PREFERENCIAS_PADRAO);
  const revisao = useRef(0);
  const filaDeGravacao = useRef<ReturnType<typeof createPreferenceWriteQueue> | null>(null);
  if (!filaDeGravacao.current) {
    filaDeGravacao.current = createPreferenceWriteQueue((serialized) =>
      AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, serialized),
    );
  }

  useEffect(() => {
    let ativo = true;
    const revisaoAoIniciar = revisao.current;
    const limite = setTimeout(() => {
      if (ativo) setPronto(true);
    }, TEMPO_MAXIMO_DE_LEITURA_MS);

    AsyncStorage.getItem(PREFERENCES_STORAGE_KEY)
      .then((bruto) => {
        if (!ativo || !shouldApplyHydration(revisaoAoIniciar, revisao.current)) return;
        const lidas = interpretPreferences(bruto);
        atuais.current = lidas;
        setPreferencias(lidas);
      })
      .catch(() => undefined)
      .finally(() => {
        clearTimeout(limite);
        if (ativo) setPronto(true);
      });

    return () => {
      ativo = false;
      clearTimeout(limite);
    };
  }, []);

  const definir = useCallback((mudanca: Partial<Preferencias>) => {
    const proximas = mergePreferences(atuais.current, mudanca);
    const iguais = (Object.keys(proximas) as (keyof Preferencias)[]).every(
      (chave) => proximas[chave] === atuais.current[chave],
    );
    if (iguais) return;
    revisao.current += 1;
    atuais.current = proximas;
    setPreferencias(proximas);
    void filaDeGravacao.current?.(proximas).catch(() => undefined);
  }, []);

  const restaurar = useCallback(() => definir(PREFERENCIAS_PADRAO), [definir]);

  const valor = useMemo(
    () => ({ preferencias, pronto, definir, restaurar }),
    [preferencias, pronto, definir, restaurar],
  );

  return <PreferencesContext.Provider value={valor}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  return useContext(PreferencesContext);
}
