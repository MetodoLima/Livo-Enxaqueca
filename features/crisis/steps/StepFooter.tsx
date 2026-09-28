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
        <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
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
      >
        <Text style={[styles.nextText, disabled && styles.nextTextDisabled]}>
          {nextLabel}
        </Text>
        <ChevronRight size={20} color={disabled ? '#3A5A72' : 'white'} />
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
    paddingBottom: 8,
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
    color: '#3A5A72',
  },
  skipBtn: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E3A52',
  },
  skipText: {
    color: Colors.muted,
    fontSize: 15,
    fontFamily: 'Epilogue_600SemiBold',
  },
});
