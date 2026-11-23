import React, { useState } from 'react';
import { View, TouchableOpacity, SafeAreaView, ScrollView, AccessibilityInfo } from 'react-native';
import { X, Check } from 'lucide-react-native';
import Animated, { ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import Text from '@/components/ui/Text';
import {
  emergencyIntensityColor,
  emergencyIntensityLabelUsesInnerSurface,
} from '@/constants/emergencyColors';
import { useColorPalette, useColorPaletteMode } from '@/contexts/ColorThemeContext';

const INTENSITIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function EmergencyScreen() {
  const palette = useColorPalette();
  const mode = useColorPaletteMode();
  const { roles, legacy } = palette;
  const original = mode === 'original';
  const intensityLabelUsesInnerSurface = emergencyIntensityLabelUsesInnerSurface(original);
  const [intensity, setIntensity] = useState<number | null>(null);
  const [step, setStep] = useState<'intensity' | 'done'>('intensity');
  const reduceMotion = useReducedMotion();
  const router = useRouter();

  const handleConfirm = () => {
    setStep('done');
    AccessibilityInfo.announceForAccessibility(
      `Crise registrada com intensidade ${intensity} de 10`
    );
    setTimeout(() => router.back(), 1500);
  };

  if (step === 'done') {
    return (
      <View
        className="flex-1 items-center justify-center bg-bg-dark px-6"
        accessible={true}
        accessibilityLabel={`Crise registrada. Intensidade ${intensity} de 10.`}
        accessibilityRole="alert"
      >
        <Animated.View
          entering={reduceMotion ? undefined : ZoomIn}
          className={`mb-5 h-20 w-20 items-center justify-center rounded-full ${original ? 'bg-emerald-900/30' : 'bg-success-subtle'}`}
        >
          <Check size={36} color={roles.success} />
        </Animated.View>
        <Text variant="title" weight="bold" className="mb-2 text-center">Crise registrada</Text>
        <Text variant="caption" tone="muted" className="text-center">
          {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · Intensidade {intensity}/10
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: legacy.bgDark }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between mt-3 mb-8">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 -ml-2 rounded-xl"
            style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
            accessibilityRole="button"
            accessibilityLabel="Fechar registro rápido"
          >
            <X size={24} color={legacy.muted} />
          </TouchableOpacity>
          <Text weight="bold" accessibilityRole="header">Registrar crise</Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 items-center justify-center -mt-20">
          <Text variant="caption" tone="muted" className="mb-3">Intensidade da dor</Text>
          <Text variant="hero" tone="primary" weight="bold" className="mb-8" accessibilityLabel={`Intensidade: ${intensity ?? 'não selecionada'} de 10`}>
            {intensity || '–'}
            <Text variant="heading" tone="muted">/10</Text>
          </Text>

          <View
            className="flex-row flex-wrap justify-center gap-3 mb-10"
            accessibilityRole="radiogroup"
            accessibilityLabel="Selecione a intensidade da dor de 1 a 10"
          >
            {INTENSITIES.map((n) => {
              const isActive = intensity === n;
              return (
                <TouchableOpacity
                  key={n}
                  onPress={() => setIntensity(n)}
                  className={`min-h-12 min-w-12 rounded-xl items-center justify-center px-2 py-2 ${
                    isActive ? 'shadow-lg' : 'bg-card-dark'
                  }`}
                  style={[
                    { minWidth: 48, minHeight: 48 },
                    isActive ? {
                      backgroundColor: emergencyIntensityColor(palette, n, original),
                      transform: [{ scale: 1.1 }],
                    } : undefined,
                  ]}
                  accessibilityRole="radio"
                  accessibilityLabel={`Intensidade ${n}`}
                  accessibilityState={{ checked: isActive }}
                >
                  <View
                    className={
                      isActive && intensityLabelUsesInnerSurface
                        ? 'min-h-8 min-w-8 items-center justify-center rounded-full bg-canvas px-1'
                        : ''
                    }
                  >
                    <Text weight="bold" tone={isActive ? (original ? 'content' : 'canvas') : 'muted'}>
                      {n}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={handleConfirm}
            disabled={!intensity}
            className={`w-full py-5 rounded-3xl items-center ${
              intensity ? 'bg-accent shadow-lg' : 'bg-card-dark'
            }`}
            style={{ minHeight: 56 }}
            accessibilityRole="button"
            accessibilityLabel={intensity ? 'Registrar crise agora' : 'Selecione a intensidade primeiro'}
            accessibilityState={{ disabled: !intensity }}
          >
            <Text variant="heading" weight="bold" tone={intensity ? 'canvas' : 'muted'} className="text-center">
              {intensity ? 'Registrar agora' : 'Selecione a intensidade'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text variant="caption" tone="muted" className="pb-10 text-center">
          📍 {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · Registro automático
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
