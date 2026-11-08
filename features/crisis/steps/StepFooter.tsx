import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { View } from 'react-native';
import Button from '@/components/ui/Button';

interface StepFooterProps {
  onNext: () => void;
  onBack?: () => void;
  disabled?: boolean;
  disabledHint?: string;
}

export default function StepFooter({ onNext, onBack, disabled = false, disabledHint }: StepFooterProps) {
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
      <Button
        title="Avançar"
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
