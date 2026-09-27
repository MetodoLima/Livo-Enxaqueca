import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { CrisisRecord, createEmptyCrisis } from '@/types/crisis';

const STORAGE_KEY_PREFIX = 'livo:active-crisis:';

const LEGACY_STORAGE_KEY = 'livo:active-crisis';

const PERSIST_DEBOUNCE_MS = 500;

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
  activeCrisis: CrisisRecord | null;
  phases: CrisisRecord[];
  saveCrisis: (crisis: CrisisRecord) => void;
  updateActiveCrisis: (patch: Partial<CrisisRecord>) => void;
  addPhase: () => void;
  removePhase: (index: number) => void;
  clearCrisis: () => void;
  hasActiveCrisis: boolean;
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
  const { user } = useAuth();
  const storageKey = user ? `${STORAGE_KEY_PREFIX}${user.id}` : null;

  const [activeCrisis, setActiveCrisis] = useState<CrisisRecord | null>(null);
  const [phases, setPhases] = useState<CrisisRecord[]>([]);
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);
  const hydrated = storageKey !== null && hydratedKey === storageKey;

  const pendingWrite = useRef<(() => void) | null>(null);

  const flushPendingWrite = useCallback(() => {
    const write = pendingWrite.current;
    pendingWrite.current = null;
    write?.();
  }, []);

  useEffect(() => {
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
        console.error('Erro ao restaurar crise em andamento:', err);
      } finally {
        if (!cancelled) setHydratedKey(storageKey);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storageKey, flushPendingWrite]);

  useEffect(() => {
    if (!hydrated || !storageKey) return;

    pendingWrite.current = () => persist(storageKey, activeCrisis, phases);
    const timer = setTimeout(flushPendingWrite, PERSIST_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [activeCrisis, phases, hydrated, storageKey, flushPendingWrite]);

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
        location: prev.location,
        side: prev.side,
      };
    });
  }, []);

  const clearCrisis = useCallback(() => {
    pendingWrite.current = null;
    setActiveCrisis(null);
    setPhases([]);
    if (!storageKey) return;
    AsyncStorage.removeItem(storageKey).catch((err) =>
      console.error('Erro ao limpar crise em andamento:', err),
    );
  }, [storageKey]);

  return (
    <CrisisContext.Provider
      value={{
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
