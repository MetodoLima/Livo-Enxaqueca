import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ESPACOS,
  FONTES,
  PREFERENCIAS_PADRAO,
  TAMANHOS,
  type Preferencias,
} from '@/constants/typography';

const CHAVE = 'livo.preferencias.v1';
const VERSAO = 1;
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

const umDe = <T extends string>(lista: readonly T[], valor: unknown, padrao: T): T =>
  lista.includes(valor as T) ? (valor as T) : padrao;

function interpretar(bruto: string | null): Preferencias {
  if (!bruto) return PREFERENCIAS_PADRAO;
  try {
    const salvo = JSON.parse(bruto);
    if (!salvo || salvo.versao !== VERSAO) return PREFERENCIAS_PADRAO;
    return {
      tamanho: umDe(TAMANHOS, salvo.tamanho, PREFERENCIAS_PADRAO.tamanho),
      fonte: umDe(FONTES, salvo.fonte, PREFERENCIAS_PADRAO.fonte),
      negrito: typeof salvo.negrito === 'boolean' ? salvo.negrito : PREFERENCIAS_PADRAO.negrito,
      linhas: umDe(ESPACOS, salvo.linhas, PREFERENCIAS_PADRAO.linhas),
      letras: umDe(ESPACOS, salvo.letras, PREFERENCIAS_PADRAO.letras),
    };
  } catch {
    return PREFERENCIAS_PADRAO;
  }
}

function salvar(preferencias: Preferencias) {
  AsyncStorage.setItem(CHAVE, JSON.stringify({ versao: VERSAO, ...preferencias })).catch(() => undefined);
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferencias, setPreferencias] = useState<Preferencias>(PREFERENCIAS_PADRAO);
  const [pronto, setPronto] = useState(false);
  const atuais = useRef(PREFERENCIAS_PADRAO);
  const alteradas = useRef(false);

  useEffect(() => {
    let ativo = true;
    const limite = setTimeout(() => {
      if (ativo) setPronto(true);
    }, TEMPO_MAXIMO_DE_LEITURA_MS);

    AsyncStorage.getItem(CHAVE)
      .then((bruto) => {
        if (!ativo || alteradas.current) return;
        const lidas = interpretar(bruto);
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
    const proximas = { ...atuais.current, ...mudanca };
    const iguais = (Object.keys(proximas) as (keyof Preferencias)[]).every(
      (chave) => proximas[chave] === atuais.current[chave],
    );
    if (iguais) return;
    alteradas.current = true;
    atuais.current = proximas;
    setPreferencias(proximas);
    salvar(proximas);
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
