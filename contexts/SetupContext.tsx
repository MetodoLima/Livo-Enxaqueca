import React, { createContext, useContext, useState } from 'react';

export interface SetupData {
  [key: string]: any;
}

interface SetupContextType {
  setupData: SetupData;
  updateSetupData: (newData: Partial<SetupData>) => void;
  clearSetupData: () => void;
}

const SetupContext = createContext<SetupContextType>({
  setupData: {},
  updateSetupData: () => { },
  clearSetupData: () => { },
});

export const useSetup = () => useContext(SetupContext);

export const SetupProvider = ({ children }: { children: React.ReactNode }) => {
  const [setupData, setSetupData] = useState<SetupData>({});

  const updateSetupData = (newData: Partial<SetupData>) => {
    setSetupData((prev) => ({ ...prev, ...newData }));
  };

  const clearSetupData = () => {
    setSetupData({});
  };

  return (
    <SetupContext.Provider value={{ setupData, updateSetupData, clearSetupData }}>
      {children}
    </SetupContext.Provider>
  );
};
