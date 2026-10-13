import { useEffect, useState, type RefObject } from 'react';
import { View } from 'react-native';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Dialog from '@/components/ui/Dialog';

export const FAIXAS_AGUA = [
  { label: 'Até 1 L', ml: 500 },
  { label: '1 a 2 L', ml: 1500 },
  { label: '2 a 3 L', ml: 2500 },
  { label: '3 a 4 L', ml: 3500 },
  { label: 'Mais de 4 L', ml: 4000 },
] as const;

interface WaterDialogProps {
  visible: boolean;
  current: number | null;
  onCancel: () => void;
  onConfirm: (ml: number | null) => void;
  returnFocusTo?: RefObject<View | null>;
}

export default function WaterDialog({ visible, current, onCancel, onConfirm, returnFocusTo }: WaterDialogProps) {
  const [selecionado, setSelecionado] = useState<number | null>(current);

  useEffect(() => {
    if (visible) setSelecionado(current);
  }, [visible, current]);

  const nadaParaGravar = selecionado === null && current === null;

  return (
    <Dialog
      visible={visible}
      title="Água de hoje"
      onClose={onCancel}
      returnFocusTo={returnFocusTo}
      footer={
        <View className="flex-row flex-wrap gap-3">
          <Button title="Cancelar" variant="ghost" onPress={onCancel} className="flex-grow" />
          <Button
            title="Confirmar"
            disabled={nadaParaGravar}
            accessibilityHint={nadaParaGravar ? 'Escolha uma faixa de água para confirmar' : undefined}
            onPress={() => onConfirm(selecionado)}
            className="flex-grow"
          />
        </View>
      }
    >
      <View className="flex-row flex-wrap gap-2">
        {FAIXAS_AGUA.map((faixa) => (
          <Chip
            key={faixa.ml}
            label={faixa.label}
            tone="primary"
            selected={selecionado === faixa.ml}
            onPress={() => setSelecionado(selecionado === faixa.ml ? null : faixa.ml)}
          />
        ))}
      </View>
    </Dialog>
  );
}
