import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Calendar, Wind, BarChart2, User } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useCrisis } from '@/contexts/CrisisContext';

export default function TabLayout() {
  const { hasActiveCrisis } = useCrisis();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.muted,
        tabBarStyle: {
          backgroundColor: Colors.bgDark,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 6,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
        }}
      />

      {/* ── Center circle button ── */}
      <Tabs.Screen
        name="crisis"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View style={[
              styles.centerBtn,
              hasActiveCrisis && styles.centerBtnActive,
              focused && styles.centerBtnFocused,
            ]}>
              <Wind size={24} color="white" />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />

      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => <BarChart2 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  centerBtnActive: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  centerBtnFocused: {
    transform: [{ scale: 1.08 }],
  },
});
