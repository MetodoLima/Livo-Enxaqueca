import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { View } from 'react-native';
import Button from '@/components/ui/Button';

interface StepFooterProps {
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  disabled?: boolean;
  disabledHint?: string;
  showSkip?: boolean;
  onSkip?: () => void;
  skipLabel?: string;
}

export default function StepFooter({
  onNext,
  onBack,
  nextLabel = 'Avançar',
  disabled = false,
  disabledHint,
  showSkip = false,
  onSkip,
  skipLabel = 'Pular',
}: StepFooterProps) {
  return (
    <View className="flex-1 flex-row gap-3">
      {onBack ? (
        <Button
          title="Voltar"
          icon={ChevronLeft}
          iconOnly
          variant="secondary"
          accessibilityHint="Volta para a etapa anterior"
          onPress={onBack}
          className="w-24"
        />
      ) : null}
      {showSkip && onSkip ? (
        <Button
          title={skipLabel}
          variant="ghost"
          accessibilityHint="Pula esta etapa e avança para a próxima"
          onPress={onSkip}
        />
      ) : null}
      <Button
        title={nextLabel}
        icon={ChevronRight}
        iconPosition="end"
        disabled={disabled}
        accessibilityHint={disabled ? disabledHint : 'Avança para a próxima etapa'}
        onPress={onNext}
        className="flex-1"
      />
    </View>
  );
}
