import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import Chip from '@/components/ui/Chip';
import IconButton from '@/components/ui/IconButton';
import OptionCard from '@/components/ui/OptionCard';
import Text from '@/components/ui/Text';
import TextField from '@/components/ui/TextField';
import { MEDICATIONS, type CrisisRecord, type MedicationId } from '@/types/crisis';

interface StepMedicationProps {
  data: CrisisRecord;
  onChange: (patch: Partial<CrisisRecord>) => void;
  onNext: () => void;
}

export default function StepMedication({ data, onChange }: StepMedicationProps) {
  const [customText, setCustomText] = useState('');

  const toggleMedication = (id: MedicationId) => {
    const current = data.medications;

    if (id === 'nenhum') {
      if (current.includes('nenhum')) {
        onChange({ medications: [] });
      } else {
        onChange({ medications: ['nenhum'], customMedications: [] });
      }
      return;
    }

    const withoutNenhum = current.filter((m) => m !== 'nenhum');
    const next = withoutNenhum.includes(id)
      ? withoutNenhum.filter((m) => m !== id)
      : [...withoutNenhum, id];
    onChange({ medications: next });
  };

  const addCustomMedication = () => {
    const trimmed = customText.trim();
    if (!trimmed) return;
    if (data.customMedications.includes(trimmed)) return;

    const medsWithoutNenhum = data.medications.filter((m) => m !== 'nenhum');
    onChange({
      medications: medsWithoutNenhum,
      customMedications: [...data.customMedications, trimmed],
    });
    setCustomText('');
  };

  const removeCustomMedication = (name: string) => {
    onChange({
      customMedications: data.customMedications.filter((m) => m !== name),
    });
  };

  const regularMeds = MEDICATIONS.filter((m) => m.id !== 'nenhum');
  const nenhumMed = MEDICATIONS.find((m) => m.id === 'nenhum')!;
  const semTexto = !customText.trim();

  const totalSelected =
    data.medications.filter((m) => m !== 'nenhum').length + data.customMedications.length;

  return (
    <View className="gap-6">
      <Text variant="title">Tomou algum remédio?</Text>

      <OptionCard
        label="Não tomei nenhum remédio"
        emoji={nenhumMed.emoji}
        mode="checkbox"
        checked={data.medications.includes('nenhum')}
        onPress={() => toggleMedication('nenhum')}
      />

      <View className="flex-row flex-wrap gap-2">
        {regularMeds.map((med) => (
          <Chip
            key={med.id}
            label={med.label}
            emoji={med.emoji}
            tone="primary"
            selected={data.medications.includes(med.id)}
            onPress={() => toggleMedication(med.id)}
          />
        ))}
      </View>

      <View className="gap-3">
        <Text variant="heading">Outro remédio</Text>
        <View className="flex-row items-end gap-3">
          <TextField
            label="Nome do medicamento"
            value={customText}
            onChangeText={setCustomText}
            placeholder="Ex: Cefaliv, Dorflex..."
            onSubmitEditing={addCustomMedication}
            returnKeyType="done"
            accessibilityLabel="Nome do medicamento personalizado"
            hint="Digite o nome e toque no botão de adicionar"
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
            className="mb-1"
          />
        </View>

        {data.customMedications.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {data.customMedications.map((name) => (
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
      </View>

      {totalSelected > 0 ? (
        <Text variant="caption" weight="semibold" tone="muted" accessibilityLiveRegion="polite">
          {totalSelected} selecionado{totalSelected > 1 ? 's' : ''}
        </Text>
      ) : null}
    </View>
  );
}
