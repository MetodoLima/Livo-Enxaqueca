import { memo, useEffect, useMemo, useRef, useState } from 'react';
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

const COPIAS = 3;
const FOLGA = 12;

type Coluna = 'hora' | 'minuto';

export type TimeWheelSize = 'md' | 'lg';
export type TimeWheelVisibleItems = 3 | 5;

const ITEM: Record<TimeWheelSize, number> = { md: 48, lg: 64 };
const COLUNA: Record<TimeWheelSize, string> = { md: 'w-16', lg: 'w-24' };
const NUMERO: Record<TimeWheelSize, 'heading' | 'title'> = { md: 'heading', lg: 'title' };
const DIGITACAO: Record<TimeWheelSize, string> = { md: 'text-heading', lg: 'text-title' };

const pad = (n: number) => String(n).padStart(2, '0');
const modulo = (n: number, total: number) => ((n % total) + total) % total;

interface ItemProps {
  numero: number;
  atual: boolean;
  altura: number;
  size: TimeWheelSize;
}

const ItemDaRoda = memo(function ItemDaRoda({ numero, atual, altura, size }: ItemProps) {
  return (
    <Text
      variant={NUMERO[size]}
      weight={atual ? 'bold' : 'regular'}
      tone={atual ? 'content' : 'muted'}
      className="text-center"
      style={{ height: altura, lineHeight: altura }}
    >
      {pad(numero)}
    </Text>
  );
});

interface ColunaProps {
  total: number;
  valor: number;
  altura: number;
  visiveis: TimeWheelVisibleItems;
  size: TimeWheelSize;
  rotulo: string;
  dica?: string;
  falado: (n: number) => string;
  editando: boolean;
  onChange: (n: number) => void;
  onEditar: () => void;
  onDigitado: (n: number | null, completo: boolean) => void;
  onInteragir: () => void;
}

function ColunaDaRoda({
  total,
  valor,
  altura,
  visiveis,
  size,
  rotulo,
  dica,
  falado,
  editando,
  onChange,
  onEditar,
  onDigitado,
  onInteragir,
}: ColunaProps) {
  const meio = Math.floor(visiveis / 2);
  const scrollRef = useRef<ScrollView>(null);
  const indice = useRef(total + valor);
  const [texto, setTexto] = useState(pad(valor));
  const faixaRef = useRef<View>(null);
  const revelar = useRevelarAcimaDoTeclado();
  const quantidade = total * COPIAS;
  const [centros, setCentros] = useState<number[]>([total + valor]);
  const centrosRef = useRef(centros);
  const pendente = useRef<{ alvo: number; animado: boolean } | null>(null);

  const definirCentros = (novos: number[]) => {
    centrosRef.current = novos;
    setCentros(novos);
  };

  const lista = useMemo(() => {
    const raio = FOLGA + meio;
    const incluidos = new Set<number>();
    for (const c of centros) {
      for (let i = Math.max(0, c - raio); i <= Math.min(quantidade - 1, c + raio); i += 1) incluidos.add(i);
    }
    const elementos = [];
    let vazioDesde = -1;
    for (let i = 0; i <= quantidade; i += 1) {
      const dentro = i < quantidade && incluidos.has(i);
      if (!dentro && i < quantidade) {
        if (vazioDesde < 0) vazioDesde = i;
        continue;
      }
      if (vazioDesde >= 0) {
        elementos.push(<View key={`vazio-${vazioDesde}`} style={{ height: (i - vazioDesde) * altura }} />);
        vazioDesde = -1;
      }
      if (dentro) {
        const numero = modulo(i, total);
        elementos.push(
          <ItemDaRoda key={i} numero={numero} atual={numero === valor} altura={altura} size={size} />,
        );
      }
    }
    return elementos;
  }, [centros, quantidade, meio, total, valor, altura, size]);

  const dentroDaJanela = (alvo: number) =>
    centrosRef.current.some((c) => Math.abs(alvo - c) <= FOLGA - meio);

  const irPara = (alvo: number, animado: boolean) => {
    indice.current = alvo;
    if (dentroDaJanela(alvo)) {
      scrollRef.current?.scrollTo({ y: alvo * altura, animated: animado });
      return;
    }
    pendente.current = { alvo, animado: false };
    definirCentros([centrosRef.current[0], alvo]);
  };

  useEffect(() => {
    const salto = pendente.current;
    if (!salto) return;
    pendente.current = null;
    scrollRef.current?.scrollTo({ y: salto.alvo * altura, animated: salto.animado });
    definirCentros([salto.alvo]);
  }, [centros, altura]);

  const acompanhar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (pendente.current) return;
    const atual = Math.round(e.nativeEvent.contentOffset.y / altura);
    const [centro] = centrosRef.current;
    if (centrosRef.current.length > 1 || Math.abs(atual - centro) > FOLGA / 2) definirCentros([atual]);
  };

  useEffect(() => {
    if (modulo(indice.current, total) !== valor) irPara(total + valor, true);
  }, [valor, total]);

  useEffect(() => {
    if (!editando) return;
    setTexto(pad(valor));
    revelar(faixaRef);
  }, [editando, revelar]);

  const editar = () => {
    onInteragir();
    onEditar();
  };

  const mover = (passos: number) => {
    onInteragir();
    const alvo = indice.current + passos;
    irPara(alvo, true);
    onChange(modulo(alvo, total));
    if (alvo < total || alvo >= total * 2) {
      setTimeout(() => {
        if (indice.current === alvo) irPara(total + modulo(alvo, total), false);
      }, 350);
    }
  };

  const assentar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const parado = Math.round(e.nativeEvent.contentOffset.y / altura);
    const novo = modulo(parado, total);
    indice.current = parado;
    onInteragir();
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
      accessibilityHint={dica ? `${dica}. Toque duas vezes para digitar` : 'Toque duas vezes para digitar'}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }, { name: 'activate' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') mover(1);
        if (e.nativeEvent.actionName === 'decrement') mover(-1);
        if (e.nativeEvent.actionName === 'activate') editar();
      }}
      className={COLUNA[size]}
      style={{ height: altura * visiveis }}
    >
      <View
        pointerEvents="none"
        className="absolute left-0 right-0 items-center justify-end rounded-md border border-line-strong bg-surface-raised pb-2"
        style={{ top: altura * meio, height: altura }}
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
        scrollEventThrottle={16}
        onScroll={acompanhar}
        onMomentumScrollEnd={assentar}
        onScrollEndDrag={(e) => {
          if (!e.nativeEvent.velocity?.y) assentar(e);
        }}
      >
        <View style={{ height: altura * meio }} />
        <Pressable
          onPress={(e) => {
            const tocado = Math.floor(e.nativeEvent.locationY / altura);
            const passos = tocado - indice.current;
            if (passos === 0) editar();
            else mover(passos);
          }}
        >
          <View pointerEvents="none">{lista}</View>
        </Pressable>
        <View style={{ height: altura * meio }} />
      </ScrollView>
      {editando ? (
        <View ref={faixaRef} className="absolute left-0 right-0" style={{ top: altura * meio, height: altura }}>
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
  visibleItems?: TimeWheelVisibleItems;
  hint?: string;
  onInteraction?: () => void;
  className?: string;
}

export default function TimeWheel({
  value,
  onChange,
  label,
  size = 'md',
  visibleItems = 5,
  hint,
  onInteraction,
  className = '',
}: TimeWheelProps) {
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
        visiveis={visibleItems}
        size={size}
        dica={hint}
        onInteragir={() => onInteraction?.()}
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
        visiveis={visibleItems}
        size={size}
        dica={hint}
        onInteragir={() => onInteraction?.()}
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
