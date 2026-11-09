import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Calendar, Wind, BarChart2, User } from 'lucide-react-native';
import Text from '@/components/ui/Text';
import { color } from '@/constants/Colors';
import { useCrisis } from '@/contexts/CrisisContext';

function Rotulo({ texto, focused }: { texto: string; focused: boolean }) {
  return (
    <Text variant="caption" tone={focused ? 'primary' : 'muted'}>
      {texto}
    </Text>
  );
}

export default function TabLayout() {
  const { hasActiveCrisis } = useCrisis();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: color.primary,
        tabBarInactiveTintColor: color.contentMuted,
        tabBarStyle: {
          backgroundColor: color.surface,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 70 + insets.bottom,
          paddingBottom: 12 + insets.bottom,
          paddingTop: 8,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarLabel: ({ focused }) => <Rotulo texto="Início" focused={focused} />,
          tabBarIcon: (props) => <Home size={24} color={props.color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Histórico',
          tabBarLabel: ({ focused }) => <Rotulo texto="Histórico" focused={focused} />,
          tabBarIcon: (props) => <Calendar size={24} color={props.color} />,
        }}
      />

      <Tabs.Screen
        name="crisis"
        options={{
          title: '',
          tabBarAccessibilityLabel: hasActiveCrisis ? 'Crise em andamento' : 'Crise',
          tabBarIcon: ({ focused }) => (
            <View
              className={`mb-5 h-14 w-14 items-center justify-center rounded-full ${hasActiveCrisis ? 'bg-danger' : 'bg-primary'}`}
              style={focused ? { transform: [{ scale: 1.08 }] } : undefined}
            >
              <Wind size={24} color={color.canvas} />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />

      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarLabel: ({ focused }) => <Rotulo texto="Insights" focused={focused} />,
          tabBarIcon: (props) => <BarChart2 size={24} color={props.color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarLabel: ({ focused }) => <Rotulo texto="Perfil" focused={focused} />,
          tabBarIcon: (props) => <User size={24} color={props.color} />,
        }}
      />
    </Tabs>
  );
}
