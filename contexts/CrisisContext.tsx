import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { CrisisRecord, createEmptyCrisis } from '@/types/crisis';

// Uma chave por usuário. Com uma chave só, quem entrasse depois no mesmo aparelho via, e podia
// finalizar em nome próprio, a crise em andamento de quem saiu.
const STORAGE_KEY_PREFIX = 'livo:active-crisis:';

// Chave única de antes. Não dá para saber de quem é o que ficou nela, então é apagada.
const LEGACY_STORAGE_KEY = 'livo:active-crisis';

// O slider de intensidade dispara updateActiveCrisis durante todo o arraste.
// Sem espera, seriam dezenas de gravações por gesto.
const PERSIST_DEBOUNCE_MS = 500;

// ── Persistência ──────────────────────────────────────────────────────
// JSON não tem tipo de data: o stringify vira ISO e o parse devolve string.
// Sem reviver, o repositorio de crise quebra ao chamar toISOString na hora de gravar.
type SerializedCrisis = Omit<CrisisRecord, 'startTime' | 'endTime'> & {
  startTime: string;
  endTime: string | null;
};

interface StoredState {
  activeCrisis: SerializedCrisis | null;
  phases: SerializedCrisis[];
}

function reviveCrisis(stored: SerializedCrisis): CrisisRecord {
  return {
    ...stored,
    startTime: new Date(stored.startTime),
    endTime: stored.endTime ? new Date(stored.endTime) : null,
  };
}

function persist(key: string, activeCrisis: CrisisRecord | null, phases: CrisisRecord[]): void {
  if (!activeCrisis && phases.length === 0) {
    AsyncStorage.removeItem(key).catch((err) =>
      console.error('Erro ao limpar crise em andamento:', err),
    );
    return;
  }

  AsyncStorage.setItem(key, JSON.stringify({ activeCrisis, phases })).catch((err) =>
    console.error('Erro ao salvar crise em andamento:', err),
  );
}

interface CrisisContextValue {
  /** The current active (editable) crisis phase */
  activeCrisis: CrisisRecord | null;
  /** Confirmed past phases of the same crisis episode */
  phases: CrisisRecord[];
  /** Start a new crisis from the wizard */
  saveCrisis: (crisis: CrisisRecord) => void;
  /** Update specific fields of the active crisis */
  updateActiveCrisis: (patch: Partial<CrisisRecord>) => void;
  /** Confirm the current phase and start a new one */
  addPhase: () => void;
  /** Remove a confirmed past phase by index */
  removePhase: (index: number) => void;
  /** Clear the active crisis and all phases (finish/discard) */
  clearCrisis: () => void;
  /** Whether there's an active crisis right now */
  hasActiveCrisis: boolean;
  /** Whether the stored crisis was already read from the device */
  hydrated: boolean;
}

const CrisisContext = createContext<CrisisContextValue>({
  activeCrisis: null,
  phases: [],
  saveCrisis: () => {},
  updateActiveCrisis: () => {},
  addPhase: () => {},
  removePhase: () => {},
  clearCrisis: () => {},
  hasActiveCrisis: false,
  hydrated: false,
});

/**
 * Fica montado mesmo sem sessão, e sem sessão não lê nem grava nada. Antes ele só existia com
 * sessão, e trocar a árvore no login recriava o navegador no meio de um redirecionamento.
 */
export function CrisisProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const storageKey = user ? `${STORAGE_KEY_PREFIX}${user.id}` : null;

  const [activeCrisis, setActiveCrisis] = useState<CrisisRecord | null>(null);
  const [phases, setPhases] = useState<CrisisRecord[]>([]);
  // De QUAL chave o estado veio, e não só se veio. Na troca de usuário há um render em que a
  // chave já é a do novo e o estado ainda é o do anterior; com um booleano, esse render
  // agendaria a crise de um na chave do outro.
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);
  const hydrated = storageKey !== null && hydratedKey === storageKey;

  // A gravação que o debounce ainda não fez, já com a chave do dono. Fica fora do efeito para
  // poder ser feita na hora quando o app sai de primeiro plano, troca de usuário ou desmonta.
  const pendingWrite = useRef<(() => void) | null>(null);

  const flushPendingWrite = useCallback(() => {
    const write = pendingWrite.current;
    pendingWrite.current = null;
    write?.();
  }, []);

  // Restaura a crise em andamento do usuário da sessão.
  useEffect(() => {
    // O que o usuário anterior deixou pendente vai para a chave dele antes de trocar.
    flushPendingWrite();
    setActiveCrisis(null);
    setPhases([]);
    setHydratedKey(null);

    if (!storageKey) return;

    let cancelled = false;

    (async () => {
      try {
        AsyncStorage.removeItem(LEGACY_STORAGE_KEY).catch(() => undefined);

        const raw = await AsyncStorage.getItem(storageKey);
        if (cancelled || !raw) return;

        const stored: StoredState = JSON.parse(raw);
        if (stored.activeCrisis) setActiveCrisis(reviveCrisis(stored.activeCrisis));
        if (stored.phases?.length) setPhases(stored.phases.map(reviveCrisis));
      } catch (err) {
        // Registro corrompido não pode impedir o app de abrir.
        console.error('Erro ao restaurar crise em andamento:', err);
      } finally {
        if (!cancelled) setHydratedKey(storageKey);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storageKey, flushPendingWrite]);

  // Grava a cada alteração, depois da restauração para não sobrescrever o
  // que ainda não foi lido.
  useEffect(() => {
    if (!hydrated || !storageKey) return;

    pendingWrite.current = () => persist(storageKey, activeCrisis, phases);
    const timer = setTimeout(flushPendingWrite, PERSIST_DEBOUNCE_MS);

    // Só cancela o timer. A gravação pendente continua no ref: ou a próxima alteração a
    // substitui, ou ela é feita na saída.
    return () => clearTimeout(timer);
  }, [activeCrisis, phases, hydrated, storageKey, flushPendingWrite]);

  // O sistema pode encerrar o app em segundo plano a qualquer momento, inclusive dentro do
  // intervalo do debounce. Sair de primeiro plano grava na hora.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') flushPendingWrite();
    });

    return () => {
      subscription.remove();
      flushPendingWrite();
    };
  }, [flushPendingWrite]);

  const saveCrisis = useCallback((crisis: CrisisRecord) => {
    setActiveCrisis(crisis);
    setPhases([]);
  }, []);

  const updateActiveCrisis = useCallback((patch: Partial<CrisisRecord>) => {
    setActiveCrisis((prev) => (prev ? { ...prev, ...patch } : null));
  }, []);

  const removePhase = useCallback((index: number) => {
    setPhases((ps) => ps.filter((_, i) => i !== index));
  }, []);

  const addPhase = useCallback(() => {
    setActiveCrisis((prev) => {
      if (!prev) return null;
      const endTime = prev.endTime ?? new Date();
      const confirmedPhase: CrisisRecord = { ...prev, endTime };
      setPhases((ps) => [...ps, confirmedPhase]);
      return {
        ...createEmptyCrisis(),
        startTime: endTime,
        // Pre-fill location and side from previous phase
        location: prev.location,
        side: prev.side,
      };
    });
  }, []);

  const clearCrisis = useCallback(() => {
    // Uma gravação pendente com a crise antiga, feita depois da remoção abaixo, traria de volta
    // a crise já finalizada.
    pendingWrite.current = null;
    setActiveCrisis(null);
    setPhases([]);
    if (!storageKey) return;
    // Apaga na hora em vez de esperar o debounce: se o app morrer nesse
    // intervalo logo após finalizar, a crise já gravada voltaria na próxima
    // abertura e poderia ser enviada de novo.
    AsyncStorage.removeItem(storageKey).catch((err) =>
      console.error('Erro ao limpar crise em andamento:', err),
    );
  }, [storageKey]);

  return (
    <CrisisContext.Provider
      value={{
        // Pelo mesmo motivo do hydratedKey: nenhuma tela vê a crise de outro usuário, nem por um render.
        activeCrisis: hydrated ? activeCrisis : null,
        phases: hydrated ? phases : [],
        saveCrisis,
        updateActiveCrisis,
        addPhase,
        removePhase,
        clearCrisis,
        hasActiveCrisis: hydrated && activeCrisis !== null,
        hydrated,
      }}
    >
      {children}
    </CrisisContext.Provider>
  );
}

export function useCrisis() {
  return useContext(CrisisContext);
}
