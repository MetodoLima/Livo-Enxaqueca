import { View } from 'react-native';
import Chip from '@/components/ui/Chip';
import Text from '@/components/ui/Text';
import { SYMPTOMS, type SymptomId } from '@/types/crisis';

interface SymptomPickerProps {
  symptoms: SymptomId[];
  onChange: (symptoms: SymptomId[]) => void;
}

export default function SymptomPicker({ symptoms, onChange }: SymptomPickerProps) {
  const toggleSymptom = (id: SymptomId) => {
    onChange(symptoms.includes(id) ? symptoms.filter((s) => s !== id) : [...symptoms, id]);
  };

  return (
    <View className="gap-6">
      <View className="flex-row flex-wrap gap-2">
        {SYMPTOMS.map((symptom) => (
          <Chip
            key={symptom.id}
            label={symptom.label}
            emoji={symptom.emoji}
            tone="primary"
            selected={symptoms.includes(symptom.id)}
            onPress={() => toggleSymptom(symptom.id)}
          />
        ))}
      </View>

      {symptoms.length > 0 ? (
        <Text variant="caption" weight="semibold" tone="muted" accessibilityLiveRegion="polite">
          {symptoms.length} selecionado{symptoms.length > 1 ? 's' : ''}
        </Text>
      ) : null}
    </View>
  );
}
