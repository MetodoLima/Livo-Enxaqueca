import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { X, Check } from 'lucide-react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';

const INTENSITIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const INTENSITY_COLORS = [
  '#FEE2E2', '#FEE2E2', '#FECACA', '#FECACA',
  '#FCA5A5', '#FCA5A5', '#F87171', '#F87171',
  '#EF4444', '#B91C1C',
];

export default function EmergencyScreen() {
  const [intensity, setIntensity] = useState<number | null>(null);
  const [step, setStep] = useState<'intensity' | 'done'>('intensity');
  const router = useRouter();

  const handleConfirm = () => {
    setStep('done');
    setTimeout(() => router.back(), 1500);
  };

  if (step === 'done') {
    return (
      <View className="flex-1 items-center justify-center bg-bg-dark px-6">
        <Animated.View entering={ZoomIn} className="w-20 h-20 rounded-full bg-emerald-900/30 items-center justify-center mb-5">
          <Check size={36} color="#10B981" />
        </Animated.View>
        <Text className="text-xl text-white mb-2 font-epilogue-bold">Crise registrada</Text>
        <Text className="text-sm text-muted text-center font-epilogue">
          {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · Intensidade {intensity}/10
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mt-3 mb-8">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-xl">
            <X size={24} color={Colors.muted} />
          </TouchableOpacity>
          <Text className="text-base text-white font-epilogue-bold">Registrar crise</Text>
          <View className="w-10" />
        </View>

        {/* Intensity */}
        <View className="flex-1 items-center justify-center -mt-20">
          <Text className="text-muted text-sm mb-3 font-epilogue">Intensidade da dor</Text>
          <Text className="text-7xl text-accent mb-8 font-epilogue-bold">
            {intensity || '–'}
            <Text className="text-xl text-muted font-epilogue">/10</Text>
          </Text>

          <View className="flex-row flex-wrap justify-center gap-3 mb-10">
            {INTENSITIES.map((n) => {
              const isActive = intensity === n;
              return (
                <TouchableOpacity
                  key={n}
                  onPress={() => setIntensity(n)}
                  className={`w-12 h-12 rounded-xl items-center justify-center ${
                    isActive ? 'shadow-lg' : 'bg-slate-800'
                  }`}
                  style={isActive ? {
                    backgroundColor: INTENSITY_COLORS[n - 1],
                    transform: [{ scale: 1.1 }],
                  } : undefined}
                >
                  <Text className={`font-epilogue-bold ${isActive ? 'text-white' : 'text-muted'}`}>
                    {n}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={handleConfirm}
            disabled={!intensity}
            className={`w-full py-5 rounded-3xl items-center ${
              intensity ? 'bg-accent shadow-lg' : 'bg-slate-800'
            }`}
          >
            <Text className={`text-lg font-epilogue-bold ${intensity ? 'text-white' : 'text-muted'}`}>
              {intensity ? 'Registrar agora' : 'Selecione a intensidade'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-center text-[11px] text-muted pb-10 font-epilogue">
          📍 {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · Registro automático
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
