import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  TextInput,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useRevelarAcimaDoTeclado } from '@/components/ui/KeyboardAwareScroll';
import Text from '@/components/ui/Text';
import { color } from '@/constants/Colors';
import type { Horario } from '@/lib/format';

const VISIVEIS = 5;
const COPIAS = 3;

type Coluna = 'hora' | 'minuto';

export type TimeWheelSize = 'md' | 'lg';

const ITEM: Record<TimeWheelSize, number> = { md: 48, lg: 64 };
const COLUNA: Record<TimeWheelSize, string> = { md: 'w-16', lg: 'w-24' };
const NUMERO: Record<TimeWheelSize, 'heading' | 'title'> = { md: 'heading', lg: 'title' };
const DIGITACAO: Record<TimeWheelSize, string> = { md: 'text-heading', lg: 'text-title' };

const pad = (n: number) => String(n).padStart(2, '0');
const modulo = (n: number, total: number) => ((n % total) + total) % total;

interface ColunaProps {
  total: number;
  valor: number;
  altura: number;
  size: TimeWheelSize;
  rotulo: string;
  falado: (n: number) => string;
  editando: boolean;
  onChange: (n: number) => void;
  onEditar: () => void;
  onDigitado: (n: number | null, completo: boolean) => void;
}

function ColunaDaRoda({ total, valor, altura, size, rotulo, falado, editando, onChange, onEditar, onDigitado }: ColunaProps) {
  const scrollRef = useRef<ScrollView>(null);
  const indice = useRef(total + valor);
  const [texto, setTexto] = useState(pad(valor));
  const faixaRef = useRef<View>(null);
  const revelar = useRevelarAcimaDoTeclado();
  const itens = Array.from({ length: total * COPIAS }, (_, i) => i);

  const irPara = (alvo: number, animado: boolean) => {
    indice.current = alvo;
    scrollRef.current?.scrollTo({ y: alvo * altura, animated: animado });
  };

  useEffect(() => {
    if (modulo(indice.current, total) !== valor) irPara(total + valor, true);
  }, [valor, total]);

  useEffect(() => {
    if (!editando) return;
    setTexto(pad(valor));
    revelar(faixaRef);
  }, [editando, revelar]);

  const mover = (passos: number) => {
    const base = total + modulo(indice.current, total);
    if (base !== indice.current) irPara(base, false);
    irPara(base + passos, true);
    onChange(modulo(base + passos, total));
  };

  const assentar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const parado = Math.round(e.nativeEvent.contentOffset.y / altura);
    const novo = modulo(parado, total);
    indice.current = parado;
    if (parado < total || parado >= total * 2) irPara(total + novo, false);
    if (novo !== valor) onChange(novo);
  };

  const confirmar = (digitado: string, completo: boolean) => {
    const n = Number.parseInt(digitado, 10);
    onDigitado(Number.isNaN(n) || n < 0 || n >= total ? null : n, completo);
  };

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={rotulo}
      accessibilityValue={{ text: falado(valor) }}
      accessibilityHint="Toque duas vezes para digitar"
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }, { name: 'activate' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') mover(1);
        if (e.nativeEvent.actionName === 'decrement') mover(-1);
        if (e.nativeEvent.actionName === 'activate') onEditar();
      }}
      className={COLUNA[size]}
      style={{ height: altura * VISIVEIS }}
    >
      <View
        pointerEvents="none"
        className="absolute left-0 right-0 items-center justify-end rounded-md border border-line-strong bg-surface-raised pb-2"
        style={{ top: altura * 2, height: altura }}
      >
        <View className="w-8 border-b border-content-muted" />
      </View>
      <ScrollView
        ref={scrollRef}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        snapToInterval={altura}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: (total + valor) * altura }}
        onLayout={() => irPara(indice.current, false)}
        onMomentumScrollEnd={assentar}
        onScrollEndDrag={(e) => {
          if (!e.nativeEvent.velocity?.y) assentar(e);
        }}
      >
        <View style={{ height: altura * 2 }} />
        {itens.map((i) => {
          const numero = modulo(i, total);
          const atual = numero === valor;
          return (
            <Pressable
              key={i}
              onPress={() => {
                const passos = i - indice.current;
                if (passos === 0) onEditar();
                else mover(passos);
              }}
              className="items-center justify-center"
              style={{ height: altura }}
            >
              <Text variant={NUMERO[size]} weight={atual ? 'bold' : 'regular'} tone={atual ? 'content' : 'muted'}>
                {pad(numero)}
              </Text>
            </Pressable>
          );
        })}
        <View style={{ height: altura * 2 }} />
      </ScrollView>
      {editando ? (
        <View ref={faixaRef} className="absolute left-0 right-0" style={{ top: altura * 2, height: altura }}>
          <TextInput
            accessibilityLabel={`${rotulo}, digitar`}
            autoFocus
            selectTextOnFocus
            keyboardType="number-pad"
            returnKeyType="done"
            maxLength={2}
            value={texto}
            selectionColor={color.primary}
            onChangeText={(t) => {
              const digitos = t.replace(/\D/g, '');
              setTexto(digitos);
              const n = Number.parseInt(digitos, 10);
              if (!Number.isNaN(n) && n < total) onChange(n);
              if (digitos.length === 2) confirmar(digitos, true);
            }}
            onSubmitEditing={() => confirmar(texto, false)}
            onBlur={() => confirmar(texto, false)}
            className={`flex-1 rounded-md border border-primary bg-surface-raised text-center font-epilogue-bold text-content ${DIGITACAO[size]}`}
          />
        </View>
      ) : null}
    </View>
  );
}

export interface TimeWheelProps {
  value: Horario;
  onChange: (horario: Horario) => void;
  label: string;
  size?: TimeWheelSize;
  className?: string;
}

export default function TimeWheel({ value, onChange, label, size = 'md', className = '' }: TimeWheelProps) {
  const { fontScale } = useWindowDimensions();
  const altura = Math.round(ITEM[size] * Math.max(1, fontScale));
  const [editando, setEditando] = useState<Coluna | null>(null);

  const fimDaDigitacao = (coluna: Coluna, n: number | null, completo: boolean) => {
    if (n !== null) onChange(coluna === 'hora' ? { ...value, hora: n } : { ...value, minuto: n });
    if (coluna === 'hora' && completo && n !== null) {
      setEditando('minuto');
      return;
    }
    setEditando((atual) => (atual === coluna ? null : atual));
  };

  return (
    <View className={`flex-row items-center justify-center gap-3 ${className}`}>
      <ColunaDaRoda
        total={24}
        valor={value.hora}
        altura={altura}
        size={size}
        rotulo={`${label}, hora`}
        falado={(n) => `${n} ${n === 1 ? 'hora' : 'horas'}`}
        editando={editando === 'hora'}
        onChange={(hora) => onChange({ ...value, hora })}
        onEditar={() => setEditando('hora')}
        onDigitado={(n, completo) => fimDaDigitacao('hora', n, completo)}
      />
      <Text variant={NUMERO[size]} weight="bold" accessible={false}>
        :
      </Text>
      <ColunaDaRoda
        total={60}
        valor={value.minuto}
        altura={altura}
        size={size}
        rotulo={`${label}, minuto`}
        falado={(n) => `${n} ${n === 1 ? 'minuto' : 'minutos'}`}
        editando={editando === 'minuto'}
        onChange={(minuto) => onChange({ ...value, minuto })}
        onEditar={() => setEditando('minuto')}
        onDigitado={(n, completo) => fimDaDigitacao('minuto', n, completo)}
      />
    </View>
  );
}
