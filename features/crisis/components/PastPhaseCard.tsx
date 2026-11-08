import { ChevronDown, Trash2 } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import Dialog from '@/components/ui/Dialog';
import SectionDivider from '@/components/ui/SectionDivider';
import Text from '@/components/ui/Text';
import { color } from '@/constants/Colors';
import { IntensityMarker } from '@/features/crisis/components/IntensityScale';
import { LOCATIONS, MEDICATIONS, SIDES, SYMPTOMS, type CrisisRecord } from '@/types/crisis';

interface PastPhaseCardProps {
  phase: CrisisRecord;
  index: number;
  onDelete: () => void;
}

const fmtTime = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export default function PastPhaseCard({ phase, index, onDelete }: PastPhaseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const removerRef = useRef<View>(null);

  const numero = index + 1;
  const locationData = LOCATIONS.find((l) => l.id === phase.location);
  const sideData = SIDES.find((s) => s.id === phase.side);
  const symptoms = phase.symptoms.map((id) => SYMPTOMS.find((s) => s.id === id)).filter((s) => !!s);
  const medicationNames = [
    ...phase.medications.map((id) => MEDICATIONS.find((m) => m.id === id)?.label).filter((m) => !!m),
    ...phase.customMedications,
  ];

  const timeRange = `${fmtTime(phase.startTime)} – ${phase.endTime ? fmtTime(phase.endTime) : 'Em andamento'}`;
  const local = [locationData?.label, sideData?.label].filter(Boolean).join(' · ');

  const remover = () => {
    setConfirmando(false);
    onDelete();
  };

  return (
    <Card padding="sm">
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={`Fase ${numero}: ${timeRange}${phase.intensity !== null ? `, intensidade ${phase.intensity} de 10` : ''}${local ? `, ${local}` : ''}`}
        accessibilityState={{ expanded }}
        accessibilityHint={expanded ? 'Toque para recolher os detalhes' : 'Toque para ver os detalhes'}
        className="min-h-12 flex-row items-center gap-3 active:opacity-80"
      >
        <View className="flex-1 gap-1">
          <Text variant="caption" weight="semibold" tone="muted">
            Fase {numero}
          </Text>
          <Text weight="semibold">{timeRange}</Text>
          {local ? (
            <Text variant="caption" tone="muted">
              {local}
            </Text>
          ) : null}
        </View>
        {phase.intensity !== null ? <IntensityMarker value={phase.intensity} showLabel={false} /> : null}
        <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
          <ChevronDown size={20} color={color.contentMuted} />
        </View>
      </Pressable>

      {expanded ? (
        <View className="mt-4 gap-4">
          <SectionDivider />
          {phase.intensity !== null ? (
            <View className="gap-1">
              <Text variant="caption" weight="semibold" tone="muted">
                Intensidade
              </Text>
              <IntensityMarker value={phase.intensity} />
            </View>
          ) : null}
          {local ? (
            <View className="gap-1">
              <Text variant="caption" weight="semibold" tone="muted">
                Localização
              </Text>
              <Text weight="semibold">{local}</Text>
            </View>
          ) : null}
          {symptoms.length > 0 ? (
            <View className="gap-2">
              <Text variant="caption" weight="semibold" tone="muted">
                Sintomas
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {symptoms.map((s) => (
                  <Chip key={s.id} label={s.label} />
                ))}
              </View>
            </View>
          ) : null}
          {medicationNames.length > 0 ? (
            <View className="gap-1">
              <Text variant="caption" weight="semibold" tone="muted">
                Medicamentos
              </Text>
              <Text weight="semibold">{medicationNames.join(', ')}</Text>
            </View>
          ) : null}
          <Button
            ref={removerRef}
            title="Remover esta fase"
            variant="danger"
            size="md"
            icon={Trash2}
            accessibilityLabel={`Remover fase ${numero}`}
            accessibilityHint="Será pedida confirmação antes de remover"
            onPress={() => setConfirmando(true)}
            className="self-start"
          />
        </View>
      ) : null}

      <Dialog
        visible={confirmando}
        title="Remover fase?"
        onClose={() => setConfirmando(false)}
        returnFocusTo={removerRef}
        footer={
          <View className="flex-row flex-wrap gap-3">
            <Button title="Cancelar" variant="ghost" onPress={() => setConfirmando(false)} className="flex-grow" />
            <Button
              title="Remover"
              variant="danger"
              accessibilityLabel={`Remover a fase ${numero}`}
              onPress={remover}
              className="flex-grow"
            />
          </View>
        }
      >
        <Text tone="muted">A Fase {numero} será removida do registro.</Text>
      </Dialog>
    </Card>
  );
}
