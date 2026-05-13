import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { MoodId } from '@/constants/data';
import MoodSelector from '@/components/MoodSelector';
import Card from '@/components/Card';
import { Colors } from '@/constants/Colors';

const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

const getDayStatus = (day: number) => {
  if (day === 5 || day === 15) return 'crisis';
  if (day === 8 || day === 22) return 'warning';
  return 'good';
};

const migraineCycleDays = [13, 14, 15, 16, 17];

const dailyRecords: Record<number, { time: string; title: string; description?: string; type: 'medication' | 'note' | 'crisis' }[]> = {
  15: [
    { time: '08:30', title: 'Acordei com pescoço rígido', description: 'Sensação de tensão extrema nos ombros.', type: 'note' },
    { time: '13:00', title: 'Início da Crise', description: 'Dor latejante pulsátil no lado esquerdo (Nota 7). Fotofobia.', type: 'crisis' },
    { time: '13:30', title: 'Medicação de Resgate', description: 'Sumatriptano 50mg.', type: 'medication' },
    { time: '17:00', title: 'Alívio Parcial', description: 'Dor regrediu para nota 2. Fiquei repousando no quarto escuro.', type: 'note' },
  ],
};

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(15);
  const [selectedMood, setSelectedMood] = useState<MoodId | null>('so-so');

  const currentRecords = dailyRecords[selectedDate] || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 24, paddingTop: 40 }}>

          <Text className="text-[28px] text-white font-epilogue-light mb-6">
            Seu <Text className="font-epilogue-bold">Histórico</Text>
          </Text>

          {/* Calendar */}
          <Card className="mb-8">
            <Animated.View entering={FadeInUp}>
              <View className="flex-row justify-between items-center mb-6">
                <TouchableOpacity className="w-10 h-10 rounded-full items-center justify-center">
                  <ChevronLeft size={24} color={Colors.muted} />
                </TouchableOpacity>
                <Text className="text-lg text-white font-epilogue-bold">Abril 2026</Text>
                <TouchableOpacity className="w-10 h-10 rounded-full items-center justify-center">
                  <ChevronRight size={24} color={Colors.muted} />
                </TouchableOpacity>
              </View>

              <View className="flex-row justify-between mb-4">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, idx) => (
                  <Text key={idx} className="w-8 text-center text-xs text-muted font-epilogue-bold">
                    {dia}
                  </Text>
                ))}
              </View>

              <View className="flex-row flex-wrap justify-between">
                {daysInMonth.map((day) => {
                  const status = getDayStatus(day);
                  const isSelected = selectedDate === day;
                  const isInCycle = migraineCycleDays.includes(day);

                  let bgClass = '';
                  let textClass = 'text-white font-epilogue';

                  if (status === 'crisis') bgClass = 'bg-red-900/30';
                  if (isInCycle && !isSelected) bgClass = 'bg-muted/15';
                  if (isSelected) {
                    bgClass = 'bg-accent';
                    textClass = 'text-white font-epilogue-bold';
                  }

                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => setSelectedDate(day)}
                      className={`w-10 h-10 items-center justify-center rounded-xl mb-2 ${bgClass}`}
                    >
                      <Text className={textClass}>{day}</Text>
                      {status === 'warning' && !isSelected && (
                        <View className="absolute bottom-1 w-1 h-1 bg-orange-400 rounded-full" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View className="mt-4 pt-4 border-t border-slate-700 flex-row flex-wrap gap-4">
                <View className="flex-row items-center gap-1">
                  <View className="w-3 h-3 bg-red-900/50 rounded-md" />
                  <Text className="text-[10px] text-muted font-epilogue">Crise</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <View className="w-3 h-3 bg-muted/20 rounded-md" />
                  <Text className="text-[10px] text-muted font-epilogue">Ciclo Previsto</Text>
                </View>
              </View>
            </Animated.View>
          </Card>

          {/* Daily Details */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl text-white font-epilogue-bold">Registros — {selectedDate} Abr</Text>
            <TouchableOpacity className="flex-row items-center bg-accent/10 px-4 py-2 rounded-full">
              <Plus size={16} color={Colors.accent} />
              <Text className="text-accent ml-1 text-sm font-epilogue-bold">Adicionar</Text>
            </TouchableOpacity>
          </View>

          {/* Mood (Day) */}
          <Card className="mb-8">
            <MoodSelector selected={selectedMood} onSelect={setSelectedMood} showLabels={false} />
          </Card>

          {/* Timeline */}
          {currentRecords.length > 0 ? (
            <View className="ml-4 pl-6 border-l-2 border-slate-700">
              {currentRecords.map((record, index) => (
                <Animated.View entering={FadeInUp.delay(index * 100)} key={index} className="mb-8 relative">
                  <View
                    className="absolute -left-[33px] top-1 w-4 h-4 rounded-full"
                    style={{
                      borderWidth: 2,
                      borderColor: Colors.bgDark,
                      backgroundColor:
                        record.type === 'crisis' ? '#EF4444' :
                        record.type === 'medication' ? '#FB923C' : Colors.muted,
                    }}
                  />
                  <Card>
                    <View className="flex-row justify-between items-start mb-2">
                      <Text className="text-white flex-1 mr-2 font-epilogue-bold">{record.title}</Text>
                      <View className="bg-slate-700 px-2 py-1 rounded-full flex-row items-center">
                        <Clock size={12} color={Colors.muted} />
                        <Text className="text-[10px] text-muted ml-1 font-epilogue">{record.time}</Text>
                      </View>
                    </View>
                    {record.description && (
                      <Text className="text-sm text-muted font-epilogue" style={{ lineHeight: 20 }}>
                        {record.description}
                      </Text>
                    )}
                  </Card>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View className="p-10 border-2 border-dashed border-slate-700 rounded-3xl items-center justify-center">
              <Clock size={32} color={Colors.muted} />
              <Text className="text-muted mt-4 text-center font-epilogue-medium">
                Nenhum evento registrado para este dia.
              </Text>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
