import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

interface StepFooterProps {
  onNext: () => void;
  nextLabel?: string;
  disabled?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
  skipLabel?: string;
}

export default function StepFooter({
  onNext,
  nextLabel = 'Avançar',
  disabled = false,
  showSkip = false,
  onSkip,
  skipLabel = 'Pular',
}: StepFooterProps) {
  return (
    <View style={styles.container}>
      {showSkip && onSkip && (
        <TouchableOpacity
          onPress={onSkip}
          style={styles.skipBtn}
          accessibilityRole="button"
          accessibilityLabel={skipLabel}
          accessibilityHint="Pula esta etapa e avança para a próxima"
        >
          <Text style={styles.skipText}>{skipLabel}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={onNext}
        disabled={disabled}
        style={[
          styles.nextBtn,
          disabled && styles.nextBtnDisabled,
          showSkip && { flex: 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={nextLabel}
        accessibilityState={{ disabled }}
        accessibilityHint={disabled ? 'Preencha o campo acima para avançar' : 'Avança para a próxima etapa'}
      >
        <Text style={[styles.nextText, disabled && styles.nextTextDisabled]}>
          {nextLabel}
        </Text>
        <ChevronRight size={20} color={disabled ? '#6B8A9E' : 'white'} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
    paddingBottom: 24,
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 6,
    minHeight: 56,
  },
  nextBtnDisabled: {
    backgroundColor: '#1E3A52',
  },
  nextText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Epilogue_700Bold',
  },
  nextTextDisabled: {
    color: '#6B8A9E',
  },
  skipBtn: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E3A52',
    minHeight: 56,
    justifyContent: 'center',
  },
  skipText: {
    color: Colors.muted,
    fontSize: 15,
    fontFamily: 'Epilogue_600SemiBold',
  },
});
