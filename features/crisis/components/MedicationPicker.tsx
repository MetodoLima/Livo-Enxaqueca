import { Check, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import IconButton from '@/components/ui/IconButton';
import OptionCard from '@/components/ui/OptionCard';
import Text from '@/components/ui/Text';
import TextField from '@/components/ui/TextField';
import { useTema } from '@/hooks/useTema';
import { MEDICATIONS, type CrisisRecord, type MedicationId } from '@/types/crisis';

const COLUNAS = 2;
const ESPACO = 12;

interface MedicationPickerProps {
  medications: MedicationId[];
  customMedications: string[];
  onChange: (patch: Partial<CrisisRecord>) => void;
}

export default function MedicationPicker({ medications, customMedications, onChange }: MedicationPickerProps) {
  const { color } = useTema();
  const [customText, setCustomText] = useState('');
  const [larguraDaGrade, setLarguraDaGrade] = useState(0);
  const larguraDoItem = larguraDaGrade > 0 ? (larguraDaGrade - ESPACO * (COLUNAS - 1)) / COLUNAS : undefined;

  const toggleMedication = (id: MedicationId) => {
    if (id === 'nenhum') {
      if (medications.includes('nenhum')) {
        onChange({ medications: [] });
      } else {
        onChange({ medications: ['nenhum'], customMedications: [] });
      }
      return;
    }

    const withoutNenhum = medications.filter((m) => m !== 'nenhum');
    const next = withoutNenhum.includes(id)
      ? withoutNenhum.filter((m) => m !== id)
      : [...withoutNenhum, id];
    onChange({ medications: next });
  };

  const addCustomMedication = () => {
    const trimmed = customText.trim();
    if (!trimmed) return;
    if (customMedications.includes(trimmed)) return;

    onChange({
      medications: medications.filter((m) => m !== 'nenhum'),
      customMedications: [...customMedications, trimmed],
    });
    setCustomText('');
  };

  const removeCustomMedication = (name: string) => {
    onChange({ customMedications: customMedications.filter((m) => m !== name) });
  };

  const regularMeds = MEDICATIONS.filter((m) => m.id !== 'nenhum');
  const nenhumMed = MEDICATIONS.find((m) => m.id === 'nenhum')!;
  const semTexto = !customText.trim();

  const totalSelected = medications.filter((m) => m !== 'nenhum').length + customMedications.length;

  return (
    <View className="gap-6">
      <View className="gap-2">
        <Text variant="caption" weight="semibold" tone="muted">
          Adicionar remédio
        </Text>
        <View className="flex-row items-center gap-3">
          <TextField
            value={customText}
            onChangeText={setCustomText}
            placeholder="Ex: Cefaliv, Dorflex..."
            onSubmitEditing={addCustomMedication}
            returnKeyType="done"
            accessibilityLabel="Nome do medicamento personalizado"
            className="flex-1"
          />
          <IconButton
            icon={Plus}
            tone="primary"
            filled
            accessibilityLabel="Adicionar medicamento"
            accessibilityHint={semTexto ? 'Digite o nome do remédio para adicionar.' : undefined}
            disabled={semTexto}
            onPress={addCustomMedication}
          />
        </View>
        <Text variant="caption" tone="muted">
          Digite o nome e toque no botão de adicionar
        </Text>
      </View>

      {customMedications.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {customMedications.map((name) => (
            <Chip
              key={name}
              label={name}
              emoji="💊"
              tone="primary"
              onRemove={() => removeCustomMedication(name)}
            />
          ))}
        </View>
      ) : null}

      <View
        className="flex-row flex-wrap justify-center gap-3"
        onLayout={(e) => setLarguraDaGrade(e.nativeEvent.layout.width)}
      >
        {regularMeds.map((med) => {
          const isActive = medications.includes(med.id);
          return (
            <Card
              key={med.id}
              padding="sm"
              selected={isActive}
              onPress={() => toggleMedication(med.id)}
              accessibilityLabel={med.label}
              className="min-h-28 items-center justify-center gap-2"
              style={{ width: larguraDoItem }}
            >
              <Text variant="heading" accessibilityRole="none">{med.emoji}</Text>
              <Text variant="caption" weight="semibold" tone={isActive ? 'content' : 'muted'} className="text-center">
                {med.label}
              </Text>
              {isActive ? (
                <View className="absolute right-3 top-3">
                  <Check size={16} color={color.primary} />
                </View>
              ) : null}
            </Card>
          );
        })}
      </View>

      <OptionCard
        label="Não tomei nenhum remédio"
        emoji={nenhumMed.emoji}
        mode="checkbox"
        checked={medications.includes('nenhum')}
        onPress={() => toggleMedication('nenhum')}
      />

      {totalSelected > 0 ? (
        <Text variant="caption" weight="semibold" tone="muted" accessibilityLiveRegion="polite">
          {totalSelected} selecionado{totalSelected > 1 ? 's' : ''}
        </Text>
      ) : null}
    </View>
  );
}
