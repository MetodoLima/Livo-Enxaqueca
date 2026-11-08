import { View } from 'react-native';
import Text from '@/components/ui/Text';
import IntensityScale from '@/features/crisis/components/IntensityScale';
import type { CrisisRecord } from '@/types/crisis';

interface StepIntensityProps {
  data: CrisisRecord;
  onChange: (patch: Partial<CrisisRecord>) => void;
  onNext: () => void;
}

export default function StepIntensity({ data, onChange }: StepIntensityProps) {
  return (
    <View className="flex-1 gap-6">
      <Text variant="title">Qual o nível da dor?</Text>
      <IntensityScale value={data.intensity} onChange={(intensity) => onChange({ intensity })} className="flex-1" />
    </View>
  );
}
