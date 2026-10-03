import { View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import type { CalendarTab } from '@/features/calendar/types';

export default function CalendarTabBar({ active, onChange, hasCrises, hasRegistro }: {
  active: CalendarTab;
  onChange: (t: CalendarTab) => void;
  hasCrises: boolean;
  hasRegistro: boolean;
}) {
  const tabs: { key: CalendarTab; label: string }[] = [
    { key: 'todos', label: 'Tudo' },
    { key: 'crises', label: 'Crises' },
    { key: 'eventos', label: 'Eventos' },
  ];

  return (
    <View style={{
      flexDirection: 'row', backgroundColor: '#0F1E2E',
      borderRadius: 14, padding: 4, marginBottom: 16,
    }}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        const hasData = tab.key === 'crises' ? hasCrises : tab.key === 'eventos' ? hasRegistro : hasCrises || hasRegistro;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={{
              flex: 1, paddingVertical: 8, borderRadius: 10,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: isActive ? Colors.accent : 'transparent',
              flexDirection: 'row', gap: 6,
            }}
          >
            <Text style={{
              color: isActive ? 'white' : Colors.muted,
              fontFamily: isActive ? 'Epilogue_700Bold' : 'Epilogue_400Regular',
              fontSize: 13,
            }}>
              {tab.label}
            </Text>
            {hasData && !isActive && (
              <View style={{
                width: 6, height: 6, borderRadius: 3,
                backgroundColor: tab.key === 'crises' ? '#EF4444' : Colors.accent,
              }} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
