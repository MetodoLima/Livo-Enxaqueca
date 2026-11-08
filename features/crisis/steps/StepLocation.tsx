import { View } from 'react-native';
import Text from '@/components/ui/Text';
import LocationPicker from '@/features/crisis/components/LocationPicker';
import type { CrisisRecord } from '@/types/crisis';

interface StepLocationProps {
  data: CrisisRecord;
  onChange: (patch: Partial<CrisisRecord>) => void;
  onNext: () => void;
}

export default function StepLocation({ data, onChange }: StepLocationProps) {
  return (
    <View className="gap-6">
      <Text variant="title">Onde dói?</Text>
      <LocationPicker location={data.location} side={data.side} onChange={onChange} />
    </View>
  );
}
