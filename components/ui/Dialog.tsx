import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { AccessibilityInfo, Modal, Pressable, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import KeyboardAwareScroll from '@/components/ui/KeyboardAwareScroll';
import Text from '@/components/ui/Text';

const ESPERA_DO_FOCO_MS = 350;

export interface DialogProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  returnFocusTo?: RefObject<View | null>;
}

function focar(alvo: View | null) {
  if (alvo) AccessibilityInfo.sendAccessibilityEvent(alvo, 'focus');
}

export default function Dialog({ visible, title, onClose, children, footer, returnFocusTo }: DialogProps) {
  const [semMovimento, setSemMovimento] = useState(false);
  const tituloRef = useRef<View>(null);
  const estavaAberto = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setSemMovimento)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (visible) {
      estavaAberto.current = true;
      const espera = setTimeout(() => focar(tituloRef.current), ESPERA_DO_FOCO_MS);
      return () => clearTimeout(espera);
    }
    if (!estavaAberto.current) return;
    estavaAberto.current = false;
    const espera = setTimeout(() => focar(returnFocusTo?.current ?? null), ESPERA_DO_FOCO_MS);
    return () => clearTimeout(espera);
  }, [visible, returnFocusTo]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType={semMovimento ? 'none' : 'fade'}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <View className="flex-1 bg-scrim">
          <Pressable
            accessible={false}
            importantForAccessibility="no"
            onPress={onClose}
            className="absolute bottom-0 left-0 right-0 top-0"
          />
          <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAwareScroll
              className="flex-1"
              contentContainerClassName="grow justify-center px-gutter py-section"
            >
              <Pressable
                accessible={false}
                importantForAccessibility="no"
                onPress={onClose}
                className="absolute bottom-0 left-0 right-0 top-0"
              />
              <View
                accessibilityViewIsModal
                onAccessibilityEscape={onClose}
                className="rounded-lg border border-line bg-surface p-6"
              >
                <View ref={tituloRef} accessible accessibilityRole="header">
                  <Text variant="title">{title}</Text>
                </View>
                <View className="mt-6">{children}</View>
                {footer ? <View className="mt-8">{footer}</View> : null}
              </View>
            </KeyboardAwareScroll>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}
