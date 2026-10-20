import { View } from 'react-native';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';

export type EstadoDaCrise =
  | { tipo: 'sem-crise' }
  | { tipo: 'em-andamento' }
  | { tipo: 'desconhecido' }
  | { tipo: 'tempo'; tempo: string };

const APOIO = 'Está começando a sentir algo?';

function textos(estado: EstadoDaCrise): { titulo: string; apoio: string | null } {
  switch (estado.tipo) {
    case 'tempo':
      return { titulo: `Você está há ${estado.tempo} sem enxaqueca`, apoio: APOIO };
    case 'sem-crise':
      return { titulo: 'Nenhuma crise registrada até agora', apoio: APOIO };
    case 'em-andamento':
      return { titulo: 'Você está com uma crise em andamento', apoio: null };
    case 'desconhecido':
      return { titulo: APOIO, apoio: null };
  }
}

interface CrisisCardProps {
  estado: EstadoDaCrise;
  onRegistrar: () => void;
}

export default function CrisisCard({ estado, onRegistrar }: CrisisCardProps) {
  const { titulo, apoio } = textos(estado);

  return (
    <Card className="flex-row gap-4">
      <View className="flex-1 items-start gap-2">
        <Text variant="title">{titulo}</Text>
        {apoio ? (
          <Text variant="caption" tone="muted">
            {apoio}
          </Text>
        ) : null}
        <Button title="Registrar crise" shape="pill" onPress={onRegistrar} className="mt-2" />
      </View>
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        className="w-24 self-stretch"
      />
    </Card>
  );
}
