import { View } from 'react-native';
import Text from '@/components/ui/Text';
import SymptomPicker from '@/features/crisis/components/SymptomPicker';
import type { CrisisRecord } from '@/types/crisis';

interface StepSymptomsProps {
  data: CrisisRecord;
  onChange: (patch: Partial<CrisisRecord>) => void;
  onNext: () => void;
}

export default function StepSymptoms({ data, onChange }: StepSymptomsProps) {
  return (
    <View className="gap-6">
      <Text variant="title">Sintomas associados</Text>
      <SymptomPicker symptoms={data.symptoms} onChange={(symptoms) => onChange({ symptoms })} />
    </View>
  );
}
