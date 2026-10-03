import type { LucideIcon } from 'lucide-react-native';
import { Image, View, type ImageSourcePropType } from 'react-native';
import Button from '@/components/ui/Button';
import IconBadge from '@/components/ui/IconBadge';
import Text from '@/components/ui/Text';

export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: LucideIcon;
  image?: ImageSourcePropType;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  title,
  message,
  icon,
  image,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <View className={`items-center justify-center gap-4 py-section ${className}`}>
      {image ? (
        <Image source={image} className="h-40 w-40" resizeMode="contain" accessibilityIgnoresInvertColors />
      ) : icon ? (
        <IconBadge icon={icon} tone="neutral" />
      ) : null}
      <View className="items-center gap-2">
        <Text variant="heading" className="text-center">
          {title}
        </Text>
        {message ? (
          <Text variant="body" tone="muted" className="text-center">
            {message}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} className="self-stretch" /> : null}
    </View>
  );
}
