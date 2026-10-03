import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import Text from '@/components/ui/Text';
import { SUBTLE_BACKGROUND, TONE_COLOR, type Tone } from '@/components/ui/tone';

export interface IconBadgeProps {
  icon?: LucideIcon;
  emoji?: string;
  tone?: Tone;
  className?: string;
}

export default function IconBadge({ icon: Icon, emoji, tone = 'primary', className = '' }: IconBadgeProps) {
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      className={`h-12 w-12 items-center justify-center rounded-md ${SUBTLE_BACKGROUND[tone]} ${className}`}
    >
      {Icon ? <Icon size={22} color={TONE_COLOR[tone]} /> : null}
      {!Icon && emoji ? <Text variant="heading">{emoji}</Text> : null}
    </View>
  );
}
