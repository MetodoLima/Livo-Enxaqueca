import { X } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { AccessibilityInfo, Modal, Pressable, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import IconButton from '@/components/ui/IconButton';
import KeyboardAwareScroll from '@/components/ui/KeyboardAwareScroll';
import Text from '@/components/ui/Text';

const ESPERA_DO_FOCO_MS = 350;

export type DialogPosicao = 'centro' | 'base';

export interface DialogProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  returnFocusTo?: RefObject<View | null>;
  posicao?: DialogPosicao;
  botaoFechar?: boolean;
}

function focar(alvo: View | null) {
  if (alvo) AccessibilityInfo.sendAccessibilityEvent(alvo, 'focus');
}

export default function Dialog({
  visible,
  title,
  onClose,
  children,
  footer,
  returnFocusTo,
  posicao = 'centro',
  botaoFechar = false,
}: DialogProps) {
  const [semMovimento, setSemMovimento] = useState(false);
  const tituloRef = useRef<View>(null);
  const estavaAberto = useRef(false);
  const naBase = posicao === 'base';

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

  const titulo = (
    <View ref={tituloRef} accessible accessibilityRole="header" className={botaoFechar ? 'flex-1' : ''}>
      <Text variant={naBase ? 'heading' : 'title'}>{title}</Text>
    </View>
  );

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
          <SafeAreaView style={{ flex: 1 }} edges={naBase ? ['top', 'left', 'right'] : undefined}>
            <KeyboardAwareScroll
              className="flex-1"
              contentContainerClassName={naBase ? 'grow justify-end pt-section' : 'grow justify-center px-gutter py-section'}
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
                className={
                  naBase
                    ? 'rounded-t-lg border border-b-0 border-line bg-surface px-gutter pt-6'
                    : 'rounded-lg border border-line bg-surface p-6'
                }
              >
                {botaoFechar ? (
                  <View className="flex-row items-center gap-3">
                    {titulo}
                    <IconButton icon={X} accessibilityLabel="Fechar" onPress={onClose} className="-mr-3" />
                  </View>
                ) : (
                  titulo
                )}
                <View className={naBase ? 'mt-5' : 'mt-6'}>{children}</View>
                {footer ? <View className={naBase ? 'mt-5' : 'mt-8'}>{footer}</View> : null}
                {naBase ? <SafeAreaView edges={['bottom']} style={{ minHeight: 24 }} /> : null}
              </View>
            </KeyboardAwareScroll>
          </SafeAreaView>
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}
