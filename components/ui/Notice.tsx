import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import Text from '@/components/ui/Text';
import { SUBTLE_BACKGROUND, TONE_BORDER, corDoTom, type Tone } from '@/components/ui/tone';
import { useTema } from '@/hooks/useTema';

export interface NoticeProps {
  icon: LucideIcon;
  children: string;
  tone?: Tone;
  className?: string;
}

export default function Notice({ icon: Icon, children, tone = 'primary', className = '' }: NoticeProps) {
  const { color } = useTema();
  const TONE_COLOR = corDoTom(color);
  return (
    <View
      className={`flex-row items-start gap-3 rounded-md border p-4 ${SUBTLE_BACKGROUND[tone]} ${TONE_BORDER[tone]} ${className}`}
    >
      <Icon size={20} color={TONE_COLOR[tone]} />
      <Text variant="caption" className="flex-1">
        {children}
      </Text>
    </View>
  );
}
