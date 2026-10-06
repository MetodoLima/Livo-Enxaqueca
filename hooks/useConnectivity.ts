import { useContext } from 'react';
import { ConnectivityContext } from '@/contexts/ConnectivityContext';

export function useConnectivity() {
  return useContext(ConnectivityContext);
}
