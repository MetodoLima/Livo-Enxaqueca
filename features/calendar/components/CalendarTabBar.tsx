import { View } from 'react-native';
import Chip from '@/components/ui/Chip';
import type { CalendarTab } from '@/features/calendar/types';

interface CalendarTabBarProps {
  active: CalendarTab;
  onChange: (t: CalendarTab) => void;
}

const TABS: { key: CalendarTab; label: string }[] = [
  { key: 'todos', label: 'Tudo' },
  { key: 'crises', label: 'Crises' },
  { key: 'eventos', label: 'Eventos' },
];

export default function CalendarTabBar({ active, onChange }: CalendarTabBarProps) {
  return (
    <View className="flex-row gap-2">
      {TABS.map((tab) => (
        <Chip
          key={tab.key}
          label={tab.label}
          selected={active === tab.key}
          tone="primary"
          onPress={() => onChange(tab.key)}
          className="flex-1"
        />
      ))}
    </View>
  );
}
