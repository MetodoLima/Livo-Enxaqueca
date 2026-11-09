import { CalendarDays, ChevronRight } from 'lucide-react-native';
import type { RefObject } from 'react';
import { View } from 'react-native';
import Card from '@/components/ui/Card';
import Dialog from '@/components/ui/Dialog';
import LoadingState from '@/components/ui/LoadingState';
import Text from '@/components/ui/Text';
import { color } from '@/constants/Colors';

export const TIME_OPTIONS = [
  { months: 1, label: 'Último mês', sublabel: 'Crises dos últimos 30 dias' },
  { months: 3, label: 'Últimos 3 meses', sublabel: 'Crises dos últimos 3 meses' },
  { months: 6, label: 'Últimos 6 meses', sublabel: 'Crises dos últimos 6 meses' },
  { months: 12, label: 'Último ano', sublabel: 'Crises dos últimos 12 meses' },
];

interface ExportModalProps {
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onSelect: (months: number) => void;
  returnFocusTo?: RefObject<View | null>;
}

export default function ExportModal({ visible, loading, onClose, onSelect, returnFocusTo }: ExportModalProps) {
  return (
    <Dialog
      visible={visible}
      title="Exportar dados"
      onClose={loading ? () => {} : onClose}
      posicao="base"
      botaoFechar={!loading}
      returnFocusTo={returnFocusTo}
    >
      {loading ? (
        <Card padding="sm">
          <LoadingState label="Gerando relatório…" />
        </Card>
      ) : (
        <View className="gap-3">
          <Text variant="heading">Escolha o período</Text>
          {TIME_OPTIONS.map((opt) => (
            <Card
              key={opt.months}
              padding="sm"
              surface="raised"
              accessibilityLabel={`${opt.label}. ${opt.sublabel}. Gera o PDF deste período`}
              onPress={() => onSelect(opt.months)}
            >
              <View className="flex-row items-center gap-3">
                <CalendarDays size={22} color={color.contentMuted} />
                <View className="flex-1">
                  <Text weight="semibold">{opt.label}</Text>
                  <Text variant="caption" tone="muted">
                    {opt.sublabel}
                  </Text>
                </View>
                <ChevronRight size={20} color={color.contentMuted} />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Dialog>
  );
}
