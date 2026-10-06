import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import React, { createContext, useEffect, useState } from 'react';

export type ConnectivityStatus = 'unknown' | 'online' | 'offline';

export type ConnectivityState = {
  status: ConnectivityStatus;
  isOnline: boolean;
  isOffline: boolean;
  isDetermining: boolean;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

export const INITIAL_CONNECTIVITY_STATE: ConnectivityState = {
  status: 'unknown',
  isOnline: false,
  isOffline: false,
  isDetermining: true,
  isConnected: null,
  isInternetReachable: null,
};

export function normalizeConnectivityState(state: NetInfoState): ConnectivityState {
  const { isConnected, isInternetReachable } = state;

  let status: ConnectivityStatus = 'unknown';

  if (isConnected === false || isInternetReachable === false) {
    status = 'offline';
  } else if (isConnected === true && isInternetReachable === true) {
    status = 'online';
  }

  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    isDetermining: status === 'unknown',
    isConnected,
    isInternetReachable,
  };
}

export const ConnectivityContext = createContext<ConnectivityState>(INITIAL_CONNECTIVITY_STATE);

export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  const [connectivity, setConnectivity] = useState<ConnectivityState>(INITIAL_CONNECTIVITY_STATE);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const nextConnectivity = normalizeConnectivityState(state);

      setConnectivity(nextConnectivity);
    });

    return unsubscribe;
  }, []);

  return <ConnectivityContext.Provider value={connectivity}>{children}</ConnectivityContext.Provider>;
}
