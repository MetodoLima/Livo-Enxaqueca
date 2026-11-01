import { CircleQuestionMark, X } from 'lucide-react-native';
import { View } from 'react-native';
import IconButton from '@/components/ui/IconButton';
import ProgressSteps from '@/components/ui/ProgressSteps';
import Text from '@/components/ui/Text';
import { TOTAL_STEPS } from '@/types/crisis';

export const STEP_NAMES: Record<number, string> = {
  1: 'Horário',
  2: 'Intensidade',
  3: 'Localização',
  4: 'Sintomas',
  5: 'Medicamentos',
};

interface StepHeaderProps {
  currentStep: number;
  onClose: () => void;
  onHelp?: () => void;
  helpLabel?: string;
}

export default function StepHeader({ currentStep, onClose, onHelp, helpLabel }: StepHeaderProps) {
  const stepName = STEP_NAMES[currentStep] ?? '';

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-2">
        <IconButton icon={X} accessibilityLabel="Fechar registro de crise" onPress={onClose} />
        <Text
          variant="caption"
          weight="semibold"
          tone="muted"
          className="flex-1 text-center"
          accessibilityRole="header"
          accessibilityLabel={`Passo ${currentStep} de ${TOTAL_STEPS}: ${stepName}`}
        >
          {currentStep}/{TOTAL_STEPS} · {stepName}
        </Text>
        {onHelp ? (
          <IconButton icon={CircleQuestionMark} accessibilityLabel={helpLabel ?? 'Ajuda'} onPress={onHelp} />
        ) : (
          <View className="w-12" />
        )}
      </View>
      <ProgressSteps current={currentStep} total={TOTAL_STEPS} />
    </View>
  );
}
