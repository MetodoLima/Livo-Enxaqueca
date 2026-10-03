import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import IconButton from '@/components/ui/IconButton';
import Text from '@/components/ui/Text';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: ReactNode;
  className?: string;
}

export default function ScreenHeader({ title, subtitle, onBack, action, className = '' }: ScreenHeaderProps) {
  return (
    <View className={`flex-row items-center gap-3 pb-6 pt-4 ${className}`}>
      {onBack ? (
        <IconButton icon={ArrowLeft} accessibilityLabel="Voltar" tone="content" filled onPress={onBack} />
      ) : null}
      <View className="flex-1">
        <Text variant="title">{title}</Text>
        {subtitle ? (
          <Text variant="body" tone="muted" className="mt-1">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}
