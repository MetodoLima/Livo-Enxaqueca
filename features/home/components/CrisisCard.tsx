import { useState } from 'react';
import { Image, View } from 'react-native';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Text, { type TextVariant } from '@/components/ui/Text';
import Elipse from '@/features/home/components/Elipse';

const ASPECTO = 288 / 382;
const PES = 0.585;
const PADDING_DO_CARTAO = 24;
const LARGURA_DO_CHAO = 92;
const ALTURA_DO_CHAO = 0.15;
const LARGURA_DO_ESPACO = 96;
const VAO = 16;

export type EstadoDaCrise =
  | { tipo: 'sem-crise' }
  | { tipo: 'em-andamento' }
  | { tipo: 'desconhecido' }
  | { tipo: 'tempo'; tempo: string };

const APOIO = 'Está começando a sentir algo?';

function textos(estado: EstadoDaCrise): { titulo: string; tamanho: TextVariant; apoio: string | null } {
  switch (estado.tipo) {
    case 'tempo':
      return { titulo: `Você está há ${estado.tempo} sem enxaqueca`, tamanho: 'title', apoio: APOIO };
    case 'sem-crise':
      return { titulo: 'Nenhuma crise registrada até agora', tamanho: 'title', apoio: APOIO };
    case 'em-andamento':
      return { titulo: 'Você está com uma crise em andamento', tamanho: 'title', apoio: null };
    case 'desconhecido':
      return { titulo: APOIO, tamanho: 'body', apoio: null };
  }
}

interface CrisisCardProps {
  estado: EstadoDaCrise;
  onRegistrar: () => void;
}

export default function CrisisCard({ estado, onRegistrar }: CrisisCardProps) {
  const { titulo, tamanho, apoio } = textos(estado);
  const [espaco, setEspaco] = useState({ width: 0, height: 0 });
  const [larguraInterna, setLarguraInterna] = useState(0);
  const [palavras, setPalavras] = useState<Record<number, number>>({});
  const base = espaco.height;
  const alturaDoDesenho = espaco.width / ASPECTO;
  const centroDoChao = espaco.width * PES;
  const larguraDoChao = Math.min(LARGURA_DO_CHAO, 2 * centroDoChao, 2 * (espaco.width - centroDoChao));

  const listaDePalavras = titulo.split(' ');
  const maiorPalavra = Math.max(0, ...listaDePalavras.map((_, i) => palavras[i] ?? 0));
  const colunaComDesenho = larguraInterna - VAO - LARGURA_DO_ESPACO;
  const mostraDesenho = larguraInterna === 0 || maiorPalavra <= colunaComDesenho;

  return (
    <Card className="flex-row gap-4">
      <View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        className="absolute inset-0"
        onLayout={(e) => setLarguraInterna(e.nativeEvent.layout.width - 2 * PADDING_DO_CARTAO)}
      >
        <View className="absolute items-start opacity-0">
          {listaDePalavras.map((palavra, i) => (
            <Text
              key={`${titulo}-${i}`}
              variant={tamanho}
              onLayout={(e) => {
                const largura = e.nativeEvent.layout.width;
                setPalavras((atual) => (atual[i] === largura ? atual : { ...atual, [i]: largura }));
              }}
            >
              {palavra}
            </Text>
          ))}
        </View>
      </View>
      <View className="flex-1 items-start gap-2">
        <Text variant={tamanho} accessibilityRole="header">
          {titulo}
        </Text>
        {apoio ? (
          <Text variant="caption" tone="muted">
            {apoio}
          </Text>
        ) : null}
        <Button title="Registrar crise" shape="pill" onPress={onRegistrar} className="mt-2" />
      </View>
      {mostraDesenho ? (
        <View
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          className="w-24 self-stretch"
          onLayout={(e) => setEspaco(e.nativeEvent.layout)}
        >
          {espaco.height > 0 ? (
            <>
              <Elipse
                largura={larguraDoChao}
                altura={larguraDoChao * ALTURA_DO_CHAO}
                centroX={centroDoChao}
                centroY={base + 1}
              />
              <Image
                source={require('../../../assets/images/LivoSemCrise.png')}
                resizeMode="contain"
                className="absolute left-0"
                style={{ top: base - alturaDoDesenho, width: espaco.width, height: alturaDoDesenho }}
              />
            </>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
