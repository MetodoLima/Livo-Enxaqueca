import React, { createContext, useContext, useState, useCallback } from 'react';
import { CrisisRecord, createEmptyCrisis } from '@/types/crisis';

interface CrisisContextValue {
  /** The current active crisis (null = no active crisis) */
  activeCrisis: CrisisRecord | null;
  /** Start a new crisis from the wizard */
  saveCrisis: (crisis: CrisisRecord) => void;
  /** Update specific fields of the active crisis */
  updateActiveCrisis: (patch: Partial<CrisisRecord>) => void;
  /** Clear the active crisis (finish/discard) */
  clearCrisis: () => void;
  /** Whether there's an active crisis right now */
  hasActiveCrisis: boolean;
}

const CrisisContext = createContext<CrisisContextValue>({
  activeCrisis: null,
  saveCrisis: () => {},
  updateActiveCrisis: () => {},
  clearCrisis: () => {},
  hasActiveCrisis: false,
});

export function CrisisProvider({ children }: { children: React.ReactNode }) {
  const [activeCrisis, setActiveCrisis] = useState<CrisisRecord | null>(null);

  const saveCrisis = useCallback((crisis: CrisisRecord) => {
    setActiveCrisis(crisis);
  }, []);

  const updateActiveCrisis = useCallback((patch: Partial<CrisisRecord>) => {
    setActiveCrisis((prev) => (prev ? { ...prev, ...patch } : null));
  }, []);

  const clearCrisis = useCallback(() => {
    setActiveCrisis(null);
  }, []);

  return (
    <CrisisContext.Provider
      value={{
        activeCrisis,
        saveCrisis,
        updateActiveCrisis,
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
