import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import { useTema } from '@/hooks/useTema';
import { SYMPTOMS, type SymptomId } from '@/types/crisis';

const COLUNAS = 2;
const ESPACO = 12;

interface SymptomPickerProps {
  symptoms: SymptomId[];
  onChange: (symptoms: SymptomId[]) => void;
}

export default function SymptomPicker({ symptoms, onChange }: SymptomPickerProps) {
  const { color } = useTema();
  const [larguraDaGrade, setLarguraDaGrade] = useState(0);
  const larguraDoItem = larguraDaGrade > 0 ? (larguraDaGrade - ESPACO * (COLUNAS - 1)) / COLUNAS : undefined;

  const toggleSymptom = (id: SymptomId) => {
    onChange(symptoms.includes(id) ? symptoms.filter((s) => s !== id) : [...symptoms, id]);
  };

  return (
    <View className="gap-6">
      <View
        className="flex-row flex-wrap justify-center gap-3"
        onLayout={(e) => setLarguraDaGrade(e.nativeEvent.layout.width)}
      >
        {SYMPTOMS.map((symptom) => {
          const isActive = symptoms.includes(symptom.id);
          return (
            <Card
              key={symptom.id}
              padding="sm"
              selected={isActive}
              onPress={() => toggleSymptom(symptom.id)}
              accessibilityLabel={symptom.label}
              className="min-h-28 items-center justify-center gap-2"
              style={{ width: larguraDoItem }}
            >
              <Text variant="heading" accessibilityRole="none">{symptom.emoji}</Text>
              <Text variant="caption" weight="semibold" tone={isActive ? 'content' : 'muted'} className="text-center">
                {symptom.label}
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

      {symptoms.length > 0 ? (
        <Text variant="caption" weight="semibold" tone="muted" accessibilityLiveRegion="polite">
          {symptoms.length} selecionado{symptoms.length > 1 ? 's' : ''}
        </Text>
      ) : null}
    </View>
  );
}
