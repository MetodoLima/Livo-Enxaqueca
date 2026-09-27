import React from 'react';
import { Modal, View } from 'react-native';
import AppLockScreen from '@/components/AppLockScreen';
import { Colors } from '@/constants/Colors';
import { useAppLock } from '@/contexts/AppLockContext';

/**
 * O app fica sempre montado e o bloqueio vai POR CIMA. Antes a tela de bloqueio substituía a
 * árvore, e isso desmontava tudo: a pessoa voltava para o começo da tela em que estava e a
 * gravação pendente da crise em andamento era descartada.
 *
 * Por cima, e não como irmão posicionado: o `Modal` do React Native abre numa janela própria,
 * acima do resto. Um bloqueio desenhado dentro da árvore ficaria embaixo de qualquer modal que
 * estivesse aberto, como o seletor de horário da crise. O `Modal` também recebe o botão voltar
 * do Android, que de outro jeito navegaria a pilha por trás do bloqueio.
 */
export function AppLockGate({ children }: { children: React.ReactNode }) {
  const { status, privacyCover } = useAppLock();

  const locked = status === 'locked';
  // Enquanto a configuração não foi lida, não se sabe se há bloqueio: cobre sem pedir nada.
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
