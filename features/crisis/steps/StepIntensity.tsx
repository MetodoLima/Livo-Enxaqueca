import { useRef, useState } from 'react';
import { AccessibilityInfo, Image, PanResponder, View, type ImageSourcePropType } from 'react-native';
import Text from '@/components/ui/Text';
import { INTENSITY_CONFIG, type CrisisRecord } from '@/types/crisis';

const VALORES = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
const ALTURA_MAXIMA_DA_LINHA = 48;
const PINO = 48;

const PAIN_BG: Record<number, string> = {
  0: 'bg-pain-0',
  1: 'bg-pain-1',
  2: 'bg-pain-2',
  3: 'bg-pain-3',
  4: 'bg-pain-4',
  5: 'bg-pain-5',
  6: 'bg-pain-6',
  7: 'bg-pain-7',
  8: 'bg-pain-8',
  9: 'bg-pain-9',
  10: 'bg-pain-10',
};

const IMAGEM_SEM_DOR: ImageSourcePropType = require('@/assets/images/crisis/intensity/SemDor.png');

const IMAGEM_POR_PAR: Record<number, ImageSourcePropType> = {
  2: require('@/assets/images/crisis/intensity/Leve.png'),
  4: require('@/assets/images/crisis/intensity/Incomoda.png'),
  6: require('@/assets/images/crisis/intensity/Forte.png'),
  8: require('@/assets/images/crisis/intensity/MuitoForte.png'),
  10: require('@/assets/images/crisis/intensity/Insuportave.png'),
};

function imagemDa(valor: number): ImageSourcePropType {
  if (valor === 0) return IMAGEM_SEM_DOR;
  return IMAGEM_POR_PAR[Math.ceil(valor / 2) * 2];
}

function limitar(valor: number): number {
  return Math.max(0, Math.min(10, valor));
}

interface StepIntensityProps {
  data: CrisisRecord;
  onChange: (patch: Partial<CrisisRecord>) => void;
  onNext: () => void;
}

export default function StepIntensity({ data, onChange }: StepIntensityProps) {
  const [value, setValue] = useState<number | null>(data.intensity);
  const [alturaDisponivel, setAlturaDisponivel] = useState(0);

  const alturaDaLinha = Math.min(ALTURA_MAXIMA_DA_LINHA, alturaDisponivel / VALORES.length);
  const config = value !== null ? INTENSITY_CONFIG[value] : null;

  const valueRef = useRef(value);
  const alturaRef = useRef(alturaDaLinha);
  const inicioRef = useRef(0);
  const onChangeRef = useRef(onChange);
  valueRef.current = value;
  alturaRef.current = alturaDaLinha;
  onChangeRef.current = onChange;

  const aplicar = (novo: number) => {
    if (novo === valueRef.current) return;
    valueRef.current = novo;
    setValue(novo);
    onChangeRef.current({ intensity: novo });
  };

  const valorNaAltura = (y: number) => {
    const linha = alturaRef.current;
    if (linha <= 0) return null;
    return limitar(10 - Math.floor(y / linha));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        inicioRef.current = e.nativeEvent.locationY;
        const novo = valorNaAltura(inicioRef.current);
        if (novo !== null) aplicar(novo);
      },
      onPanResponderMove: (_, gesto) => {
        const novo = valorNaAltura(inicioRef.current + gesto.dy);
        if (novo !== null) aplicar(novo);
      },
      onPanResponderRelease: () => {
        const final = valueRef.current;
        if (final === null) return;
        AccessibilityInfo.announceForAccessibility(
          `Intensidade ${final} de 10: ${INTENSITY_CONFIG[final].label}`,
        );
      },
    }),
  ).current;

  const mover = (passo: 1 | -1) => {
    const atual = valueRef.current;
    aplicar(atual === null ? 0 : limitar(atual + passo));
  };

  const topoDoPino = value !== null ? (10 - value) * alturaDaLinha + alturaDaLinha / 2 - PINO / 2 : 0;

  return (
    <View className="flex-1 gap-6">
      <Text variant="title">Qual o nível da dor?</Text>

      <View className="flex-1 flex-row items-center gap-4">
        <View
          className="flex-1 items-center gap-2"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <Image
            source={value !== null ? imagemDa(value) : IMAGEM_SEM_DOR}
            resizeMode="contain"
            className={`h-40 w-40 ${value === null ? 'opacity-50' : ''}`}
          />
          <Text variant="hero" className="text-center">
            {value !== null ? value : '–'}
          </Text>
          <Text variant="heading" className="text-center">
            {config ? config.label : 'Toque na escala'}
          </Text>
          {config ? (
            <Text tone="muted" className="text-center">
              {config.sublabel}
            </Text>
          ) : null}
        </View>

        <View
          className="self-stretch justify-center"
          onLayout={(e) => setAlturaDisponivel(e.nativeEvent.layout.height)}
        >
          <View
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="Nível da dor"
            accessibilityValue={
              value !== null && config
                ? { min: 0, max: 10, now: value, text: `${value}, ${config.label}` }
                : { text: 'não definido' }
            }
            accessibilityHint="Arraste para cima ou para baixo para ajustar a intensidade da dor"
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(e) => {
              if (e.nativeEvent.actionName === 'increment') mover(1);
              if (e.nativeEvent.actionName === 'decrement') mover(-1);
            }}
            className="w-20"
            style={{ height: alturaDaLinha * VALORES.length }}
            {...panResponder.panHandlers}
          >
            <View pointerEvents="none" className="flex-1 flex-row gap-2">
              <View className="w-6">
                {VALORES.map((n) => (
                  <View key={n} className="items-end justify-center" style={{ height: alturaDaLinha }}>
                    <Text
                      variant="caption"
                      weight={n === value ? 'bold' : 'regular'}
                      tone={n === value ? 'content' : 'muted'}
                    >
                      {n}
                    </Text>
                  </View>
                ))}
              </View>
              <View className="w-12">
                {VALORES.map((n) => (
                  <View key={n} className="items-center justify-center" style={{ height: alturaDaLinha }}>
                    <View
                      className={`w-4 rounded-sm ${PAIN_BG[n]}`}
                      style={{ height: Math.max(0, alturaDaLinha - 4) }}
                    />
                  </View>
                ))}
                {value !== null ? (
                  <View
                    className={`absolute left-0 h-12 w-12 rounded-full border-2 border-content ${PAIN_BG[value]}`}
                    style={{ top: topoDoPino }}
                  />
                ) : null}
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
