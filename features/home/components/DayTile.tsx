import type { LucideIcon } from 'lucide-react-native';
import { Pencil, Plus } from 'lucide-react-native';
import { useState, type Ref } from 'react';
import { Image, View, type ImageSourcePropType, type LayoutChangeEvent } from 'react-native';
import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import { color } from '@/constants/Colors';
import Elipse from '@/features/home/components/Elipse';

export type DayTileTone = 'primary' | 'secondary';

export interface Ilustracao {
  source: ImageSourcePropType;
  aspecto: number;
  deslocamento: number;
  larguraMaxima: number;
  pes: number;
  chao: number;
}

const BOLINHA: Record<DayTileTone, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
};

const COR_DO_ICONE: Record<DayTileTone, string> = {
  primary: color.primary,
  secondary: color.secondary,
};

const PADDING = 12;
const BORDA = 1;
const ICONE = 20;
const VAO = 8;
const BASE = 8;
const FUNDO = { largura: 102, altura: 74, centroY: 84 };
const ALTURA_DO_CHAO = 0.12;

interface DayTileProps {
  title: string;
  icon: LucideIcon;
  value: string | null;
  spokenValue: string | null;
  tone: DayTileTone;
  side: number;
  ilustracao: Ilustracao;
  onPress: () => void;
  ref?: Ref<View>;
}

function larguraDe(e: LayoutChangeEvent): number {
  return e.nativeEvent.layout.width;
}

export default function DayTile({
  title,
  icon: Icone,
  value,
  spokenValue,
  tone,
  side,
  ilustracao,
  onPress,
  ref,
}: DayTileProps) {
  const [nome, setNome] = useState(0);
  const [traco, setTraco] = useState(0);
  const [valor, setValor] = useState(0);
  const [fimDoTexto, setFimDoTexto] = useState(0);
  const [cartao, setCartao] = useState({ largura: 0, altura: 0 });

  const IconeDaAcao = value ? Pencil : Plus;
  const rotulo = value
    ? `${title}, ${spokenValue ?? value}, toque para editar`
    : `${title}, não registrado, toque para registrar`;

  const disponivel = side - 2 * (PADDING + BORDA);
  const cabe = ICONE + VAO + nome + VAO + traco + VAO + valor <= disponivel;

  const topoDaArea = fimDoTexto + VAO;
  const base = cartao.altura - BASE;
  const largura = Math.min(disponivel * ilustracao.larguraMaxima, (base - topoDaArea) * ilustracao.aspecto);
  const altura = largura / ilustracao.aspecto;
  const esquerda = PADDING + ilustracao.deslocamento;
  const mostraDesenho = cartao.altura > 0 && fimDoTexto > 0 && largura > 0;
  const larguraDoChao = largura * ilustracao.chao;

  return (
    <Card
      ref={ref}
      surface="raised"
      padding="sm"
      onPress={onPress}
      accessibilityLabel={rotulo}
      className="justify-between"
      style={{ width: side, minHeight: side }}
    >
      <View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        className="absolute inset-0"
        onLayout={(e) => setCartao({ largura: e.nativeEvent.layout.width, altura: e.nativeEvent.layout.height })}
      >
        {mostraDesenho ? (
          <>
            <Elipse
              largura={FUNDO.largura}
              altura={FUNDO.altura}
              centroX={esquerda + largura / 2}
              centroY={FUNDO.centroY}
            />
            <Elipse
              largura={larguraDoChao}
              altura={larguraDoChao * ALTURA_DO_CHAO}
              centroX={esquerda + largura * ilustracao.pes}
              centroY={base - 1}
            />
            <Image
              source={ilustracao.source}
              resizeMode="contain"
              className="absolute"
              style={{ left: esquerda, top: base - altura, width: largura, height: altura }}
            />
          </>
        ) : null}
      </View>

      <View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        className="absolute items-start opacity-0"
      >
        <Text weight="semibold" onLayout={(e) => setNome(larguraDe(e))}>
          {title}
        </Text>
        <Text weight="semibold" onLayout={(e) => setTraco(larguraDe(e))}>
          –
        </Text>
        {value ? (
          <Text weight="semibold" onLayout={(e) => setValor(larguraDe(e))}>
            {value}
          </Text>
        ) : null}
      </View>

      <View
        className="items-start gap-1"
        onLayout={(e) => setFimDoTexto(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
      >
        <View className="flex-row items-center gap-2">
          <Icone size={ICONE} color={COR_DO_ICONE[tone]} />
          <Text weight="semibold" className="shrink">
            {title}
          </Text>
          {value && cabe ? (
            <>
              <Text weight="semibold" tone="muted">
                –
              </Text>
              <Text weight="semibold">{value}</Text>
            </>
          ) : null}
        </View>
        {value && !cabe ? <Text weight="semibold">{value}</Text> : null}
      </View>
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        className="min-h-4 flex-1"
      />
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        className={`h-10 w-10 items-center justify-center self-end rounded-full ${BOLINHA[tone]}`}
      >
        <IconeDaAcao size={20} color={color.canvas} />
      </View>
    </Card>
  );
}
