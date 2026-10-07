import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Keyboard, ScrollView, View } from 'react-native';

type Revelar = (alvo: RefObject<View | null>) => void;

const RevelarContext = createContext<Revelar>(() => {});

export function useRevelarAcimaDoTeclado() {
  return useContext(RevelarContext);
}

const FOLGA = 16;

export interface KeyboardAwareScrollProps {
  children: ReactNode;
  className?: string;
  contentContainerClassName?: string;
}

export default function KeyboardAwareScroll({
  children,
  className = '',
  contentContainerClassName = '',
}: KeyboardAwareScrollProps) {
  const scrollRef = useRef<ScrollView>(null);
  const deslocamento = useRef(0);
  const topoDoTeclado = useRef<number | null>(null);
  const alvoRef = useRef<RefObject<View | null> | null>(null);
  const [alturaTeclado, setAlturaTeclado] = useState(0);

  const ajustar = useCallback(() => {
    const alvo = alvoRef.current?.current;
    const topo = topoDoTeclado.current;
    if (!alvo || topo === null) return;
    alvo.measureInWindow((_x, y, _largura, altura) => {
      const excesso = y + altura + FOLGA - topo;
      if (excesso > 0) {
        scrollRef.current?.scrollTo({ y: deslocamento.current + excesso, animated: true });
      }
    });
  }, []);

  const revelar = useCallback<Revelar>(
    (alvo) => {
      alvoRef.current = alvo;
      ajustar();
    },
    [ajustar],
  );

  useEffect(() => {
    const mostrar = Keyboard.addListener('keyboardDidShow', (e) => {
      topoDoTeclado.current = e.endCoordinates.screenY;
      setAlturaTeclado(e.endCoordinates.height);
    });
    const esconder = Keyboard.addListener('keyboardDidHide', () => {
      topoDoTeclado.current = null;
      alvoRef.current = null;
      setAlturaTeclado(0);
    });
    return () => {
      mostrar.remove();
      esconder.remove();
    };
  }, []);

  useEffect(() => {
    if (alturaTeclado === 0) return;
    const quadro = requestAnimationFrame(ajustar);
    return () => cancelAnimationFrame(quadro);
  }, [alturaTeclado, ajustar]);

  return (
    <RevelarContext.Provider value={revelar}>
      <ScrollView
        ref={scrollRef}
        className={className}
        contentContainerClassName={contentContainerClassName}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={(e) => {
          deslocamento.current = e.nativeEvent.contentOffset.y;
        }}
      >
        {children}
        {alturaTeclado > 0 ? <View style={{ height: alturaTeclado }} /> : null}
      </ScrollView>
    </RevelarContext.Provider>
  );
}
