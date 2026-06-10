import React, { createContext, useContext, useState, useCallback } from 'react';
import { CrisisRecord, createEmptyCrisis } from '@/types/crisis';

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
});

export function CrisisProvider({ children }: { children: React.ReactNode }) {
  const [activeCrisis, setActiveCrisis] = useState<CrisisRecord | null>(null);
  const [phases, setPhases] = useState<CrisisRecord[]>([]);

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
      }}
    >
      {children}
    </CrisisContext.Provider>
  );
}

export function useCrisis() {
  return useContext(CrisisContext);
}
