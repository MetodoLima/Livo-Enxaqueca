import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X, ChevronLeft } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { TOTAL_STEPS } from '@/types/crisis';

const STEP_NAMES: Record<number, string> = {
  1: 'Horário',
  2: 'Intensidade',
  3: 'Localização',
  4: 'Sintomas',
  5: 'Medicamentos',
};

interface StepHeaderProps {
  currentStep: number;
  onBack: () => void;
  onClose: () => void;
}

export default function StepHeader({ currentStep, onBack, onClose }: StepHeaderProps) {
  const stepName = STEP_NAMES[currentStep] ?? '';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={currentStep === 1 ? onClose : onBack}
        style={styles.iconBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel={
          currentStep === 1
            ? 'Fechar registro de crise'
            : `Voltar para ${STEP_NAMES[currentStep - 1] ?? 'passo anterior'}`
        }
      >
        {currentStep === 1 ? (
          <X size={22} color={Colors.muted} />
        ) : (
          <ChevronLeft size={24} color={Colors.muted} />
        )}
      </TouchableOpacity>

      <Text
        style={styles.stepText}
        accessibilityRole="header"
        accessibilityLabel={`Passo ${currentStep} de ${TOTAL_STEPS}: ${stepName}`}
      >
        {currentStep}/{TOTAL_STEPS} · {stepName}
      </Text>

      {currentStep > 1 ? (
        <TouchableOpacity
          onPress={onClose}
          style={styles.iconBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Fechar registro de crise"
        >
          <X size={22} color={Colors.muted} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 44 }} />
      )}
    </View>
  );
}

export function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <View
      style={styles.progressRow}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={`Progresso: passo ${currentStep} de ${TOTAL_STEPS}`}
      accessibilityValue={{ min: 1, max: TOTAL_STEPS, now: currentStep }}
    >
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressSegment,
            { backgroundColor: i < currentStep ? Colors.accent : '#1E3A52' },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'Epilogue_600SemiBold',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 28,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
});
