import React from 'react';
import AppLockScreen from '@/components/AppLockScreen';
import { useAppLock } from '@/contexts/AppLockContext';

export function AppLockGate({ children }: { children: React.ReactNode }) {
  const { status } = useAppLock();

  if (status === 'loading') return null;
  if (status === 'locked') return <AppLockScreen />;
  return <>{children}</>;
}
