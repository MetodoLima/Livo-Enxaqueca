import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import StepFooter from './StepFooter';
import { INTENSITY_CONFIG, type CrisisRecord } from '@/types/crisis';

interface StepIntensityProps {
  data: CrisisRecord;
  onChange: (patch: Partial<CrisisRecord>) => void;
  onNext: () => void;
}

export default function StepIntensity({ data, onChange, onNext }: StepIntensityProps) {
  const selected = data.intensity;

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
        <Text style={styles.title}>Qual o nível da dor?</Text>

        {/* Scale list — 10 to 0, top to bottom */}
        <View style={styles.scaleContainer}>
          {[...INTENSITY_CONFIG].reverse().map((item) => {
            const isActive = selected === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                onPress={() => onChange({ intensity: item.value })}
                activeOpacity={0.7}
                style={[
                  styles.scaleRow,
                  isActive && styles.scaleRowActive,
                ]}
              >
                {/* Colored side bar */}
                <View
                  style={[
                    styles.colorBar,
                    {
                      backgroundColor: item.color,
                      opacity: isActive ? 1 : 0.6,
                    },
                  ]}
                />

                {/* Number */}
                <View style={[
                  styles.numberBox,
                  isActive && { backgroundColor: `${item.color}30` },
                ]}>
                  <Text
                    style={[
                      styles.numberText,
                      isActive && { color: item.color },
                    ]}
                  >
                    {item.value}
                  </Text>
                </View>

                {/* Emoji */}
                <Text style={styles.emoji}>{item.emoji}</Text>

                {/* Label */}
                <View style={styles.labelContainer}>
                  {item.label ? (
                    <Text
                      style={[
                        styles.labelText,
                        isActive && { color: 'white' },
                      ]}
                    >
                      {item.label.toUpperCase()}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      <StepFooter onNext={onNext} disabled={selected === null} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Epilogue_700Bold',
    color: 'white',
    marginBottom: 20,
    lineHeight: 30,
  },

  // Scale
  scaleContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  scaleRowActive: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  // Color bar on the left
  colorBar: {
    width: 8,
    height: '100%',
  },

  // Number
  numberBox: {
    width: 40,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  numberText: {
    fontSize: 16,
    fontFamily: 'Epilogue_700Bold',
    color: Colors.muted,
  },

  // Emoji
  emoji: {
    fontSize: 26,
    marginLeft: 14,
    marginRight: 14,
    width: 32,
    textAlign: 'center',
  },

  // Label
  labelContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 11,
    fontFamily: 'Epilogue_700Bold',
    color: Colors.muted,
    letterSpacing: 1.5,
  },
});
