import { View } from 'react-native';
import Text from '@/components/ui/Text';
import MedicationPicker from '@/features/crisis/components/MedicationPicker';
import type { CrisisRecord } from '@/types/crisis';

interface StepMedicationProps {
  data: CrisisRecord;
  onChange: (patch: Partial<CrisisRecord>) => void;
  onNext: () => void;
}

export default function StepMedication({ data, onChange }: StepMedicationProps) {
  return (
    <View className="gap-6">
      <Text variant="title">Tomou algum remédio?</Text>
      <MedicationPicker
        medications={data.medications}
        customMedications={data.customMedications}
        onChange={onChange}
      />
    </View>
  );
}
