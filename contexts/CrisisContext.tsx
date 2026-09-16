import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CrisisRecord, createEmptyCrisis } from '@/types/crisis';

const STORAGE_KEY = 'livo:active-crisis';

// O slider de intensidade dispara updateActiveCrisis durante todo o arraste.
// Sem espera, seriam dezenas de gravações por gesto.
const PERSIST_DEBOUNCE_MS = 500;

// ── Persistência ──────────────────────────────────────────────────────
// JSON não tem tipo de data: o stringify vira ISO e o parse devolve string.
// Sem reviver, crisisService quebra ao chamar toISOString na hora de gravar.
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

export function CrisisProvider({ children }: { children: React.ReactNode }) {
  const [activeCrisis, setActiveCrisis] = useState<CrisisRecord | null>(null);
  const [phases, setPhases] = useState<CrisisRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Restaura a crise em andamento na abertura do app.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled || !raw) return;

        const stored: StoredState = JSON.parse(raw);
        if (stored.activeCrisis) setActiveCrisis(reviveCrisis(stored.activeCrisis));
        if (stored.phases?.length) setPhases(stored.phases.map(reviveCrisis));
      } catch (err) {
        // Registro corrompido não pode impedir o app de abrir.
        console.error('Erro ao restaurar crise em andamento:', err);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Grava a cada alteração, depois da restauração para não sobrescrever o
  // que ainda não foi lido.
  useEffect(() => {
    if (!hydrated) return;

    const timer = setTimeout(() => {
      if (!activeCrisis && phases.length === 0) {
        AsyncStorage.removeItem(STORAGE_KEY).catch((err) =>
          console.error('Erro ao limpar crise em andamento:', err),
        );
        return;
      }

      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ activeCrisis, phases })).catch((err) =>
        console.error('Erro ao salvar crise em andamento:', err),
      );
    }, PERSIST_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [activeCrisis, phases, hydrated]);

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
    setActiveCrisis(null);
    setPhases([]);
    // Apaga na hora em vez de esperar o debounce: se o app morrer nesse
    // intervalo logo após finalizar, a crise já gravada voltaria na próxima
    // abertura e poderia ser enviada de novo.
    AsyncStorage.removeItem(STORAGE_KEY).catch((err) =>
      console.error('Erro ao limpar crise em andamento:', err),
    );
  }, []);

  return (
    <CrisisContext.Provider
      value={{
        activeCrisis,
        phases,
        saveCrisis,
        updateActiveCrisis,
        addPhase,
        removePhase,
        clearCrisis,
        hasActiveCrisis: activeCrisis !== null,
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
