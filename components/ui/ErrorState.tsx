import { CircleAlert } from 'lucide-react-native';
import { View } from 'react-native';
import Button from '@/components/ui/Button';
import IconBadge from '@/components/ui/IconBadge';
import Text from '@/components/ui/Text';

export interface ErrorStateProps {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({
  title = 'Não foi possível carregar',
  message,
  retryLabel = 'Tentar de novo',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      className={`items-center justify-center gap-4 py-section ${className}`}
    >
      <IconBadge icon={CircleAlert} tone="danger" />
      <View className="items-center gap-2">
        <Text variant="heading" className="text-center">
          {title}
        </Text>
        <Text variant="body" tone="muted" className="text-center">
          {message}
        </Text>
      </View>
      {onRetry ? <Button title={retryLabel} variant="secondary" onPress={onRetry} className="self-stretch" /> : null}
    </View>
  );
}
