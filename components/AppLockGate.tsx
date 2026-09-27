import React from 'react';
import { Modal, View } from 'react-native';
import AppLockScreen from '@/components/AppLockScreen';
import { Colors } from '@/constants/Colors';
import { useAppLock } from '@/contexts/AppLockContext';

export function AppLockGate({ children }: { children: React.ReactNode }) {
  const { status, privacyCover } = useAppLock();

  const locked = status === 'locked';
  const covered = locked || status === 'loading' || privacyCover;

  return (
    <>
      {children}
      <Modal
        visible={covered}
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => {}}
      >
        {locked
          ? <AppLockScreen />
          : <View style={{ flex: 1, backgroundColor: Colors.bgDark }} />}
      </Modal>
    </>
  );
}
