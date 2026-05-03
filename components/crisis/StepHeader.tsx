import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X, ChevronLeft } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { TOTAL_STEPS } from '@/types/crisis';

interface StepHeaderProps {
  currentStep: number;
  onBack: () => void;
  onClose: () => void;
}

export default function StepHeader({ currentStep, onBack, onClose }: StepHeaderProps) {
  return (
    <View style={styles.container}>
      {/* Back / Close */}
      <TouchableOpacity
        onPress={currentStep === 1 ? onClose : onBack}
        style={styles.iconBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        {currentStep === 1 ? (
          <X size={22} color={Colors.muted} />
        ) : (
          <ChevronLeft size={24} color={Colors.muted} />
        )}
      </TouchableOpacity>

      {/* Step indicator */}
      <Text style={styles.stepText}>{currentStep}/{TOTAL_STEPS}</Text>

      {/* Close (always available) */}
      {currentStep > 1 ? (
        <TouchableOpacity
          onPress={onClose}
          style={styles.iconBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <X size={22} color={Colors.muted} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 40 }} />
      )}
    </View>
  );
}

// ── Progress bar (separate for layout flexibility) ────────────────────
export function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <View style={styles.progressRow}>
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
    width: 40,
    height: 40,
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
