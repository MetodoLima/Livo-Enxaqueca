import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Zap, Clock, Pill, Activity, Sparkles } from 'lucide-react-native';
import Card from '@/components/Card';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { HABITS } from '@/constants/data';

const triggers = [
  { label: 'Estresse', pct: 78, color: '#E85A5A' },
  { label: 'Sono irregular', pct: 62, color: '#D4A030' },
  { label: 'Desidratação', pct: 45, color: Colors.accent },
  { label: 'Clima', pct: 33, color: Colors.muted },
];

export default function InsightsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 160, paddingHorizontal: 24, paddingTop: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp} className="flex-row items-center justify-between mb-8">
          <Text className="text-[28px] text-white font-epilogue-light">
            Seus <Text className="font-epilogue-bold">Insights</Text>
          </Text>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInUp.delay(100)} className="flex-row gap-2 mb-8">
          {[
            { icon: Zap, val: '2', label: 'Crises/mês', color: Colors.accent },
            { icon: Clock, val: '4.2h', label: 'Duração', color: Colors.muted },
            { icon: Pill, val: '85%', label: 'Eficácia', color: Colors.accent },
          ].map((s, i) => (
            <View key={i} className="flex-1 bg-slate-800 rounded-3xl p-4 items-center">
              <View className="mb-2">
                <s.icon size={20} color={s.color} />
              </View>
              <Text className="text-xl font-epilogue-bold" style={{ color: s.color }}>{s.val}</Text>
              <Text className="text-[9px] text-muted font-epilogue-bold uppercase mt-1 text-center">
                {s.label}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* Daily Habits */}
        <Animated.View entering={FadeInUp.delay(200)} className="mb-8">
          <Text className="text-xs text-muted font-epilogue-bold uppercase tracking-widest mb-4">
            Rotina diária
          </Text>
          <Card>
            <View className="flex-row flex-wrap justify-between">
              {HABITS.map((habit) => (
                <TouchableOpacity
                  key={habit.label}
                  className="w-[48%] bg-slate-700/40 p-4 rounded-[20px] items-center mb-3"
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: `${habit.color}20` }}
                  >
                    <habit.icon size={20} color={habit.color} />
                  </View>
                  <Text className="text-sm text-white font-epilogue-semi">{habit.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </Animated.View>

        {/* Triggers */}
        <Animated.View entering={FadeInUp.delay(300)} className="mb-8">
          <Text className="text-xs text-muted font-epilogue-bold uppercase tracking-widest mb-4">
            Principais gatilhos
          </Text>
          <Card>
            <View className="gap-5">
              {triggers.map((t) => (
                <View key={t.label}>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-white font-epilogue-medium">{t.label}</Text>
                    <Text className="text-muted text-xs font-epilogue">{t.pct}%</Text>
                  </View>
                  <View className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{ width: `${t.pct}%`, backgroundColor: t.color }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>

        {/* Tendency */}
        <Animated.View entering={FadeInUp.delay(400)}>
          <Card variant="accent-border">
            <View className="flex-row gap-4 items-center">
              <Text className="text-2xl">📊</Text>
              <View className="flex-1">
                <Text className="text-[10px] text-muted uppercase tracking-widest font-epilogue-bold mb-1">
                  Tendência
                </Text>
                <Text className="text-sm text-soft font-epilogue" style={{ lineHeight: 20 }}>
                  Frequência de crises em{' '}
                  <Text className="text-accent font-epilogue-bold">queda de 23%</Text>
                  {' '}nos últimos 3 meses.
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}
