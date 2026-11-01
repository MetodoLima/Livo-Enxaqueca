import { View } from 'react-native';
import Chip from '@/components/ui/Chip';
import Text from '@/components/ui/Text';
import { SYMPTOMS, type CrisisRecord, type SymptomId } from '@/types/crisis';

interface StepSymptomsProps {
  data: CrisisRecord;
  onChange: (patch: Partial<CrisisRecord>) => void;
  onNext: () => void;
}

export default function StepSymptoms({ data, onChange }: StepSymptomsProps) {
  const toggleSymptom = (id: SymptomId) => {
    const current = data.symptoms;
    const next = current.includes(id) ? current.filter((s) => s !== id) : [...current, id];
    onChange({ symptoms: next });
  };

  return (
    <View className="gap-6">
      <Text variant="title">Sintomas associados</Text>

      <View className="flex-row flex-wrap gap-2">
        {SYMPTOMS.map((symptom) => (
          <Chip
            key={symptom.id}
            label={symptom.label}
            emoji={symptom.emoji}
            tone="primary"
            selected={data.symptoms.includes(symptom.id)}
            onPress={() => toggleSymptom(symptom.id)}
          />
        ))}
      </View>

      {data.symptoms.length > 0 ? (
        <Text variant="caption" weight="semibold" tone="muted" accessibilityLiveRegion="polite">
          {data.symptoms.length} selecionado{data.symptoms.length > 1 ? 's' : ''}
        </Text>
      ) : null}
    </View>
  );
}
