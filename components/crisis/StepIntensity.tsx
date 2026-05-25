import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import StepFooter from './StepFooter';
import { INTENSITY_CONFIG, type CrisisRecord } from '@/types/crisis';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SLIDER_HEIGHT = SCREEN_HEIGHT * 0.52;
const SLIDER_WIDTH = 48;
const THUMB_SIZE = 48;

const EVEN_VALUES = [0, 2, 4, 6, 8, 10];

interface StepIntensityProps {
  data: CrisisRecord;
  onChange: (patch: Partial<CrisisRecord>) => void;
  onNext: () => void;
}

function valueToPosition(value: number): number {
  return ((10 - value) / 10) * (SLIDER_HEIGHT - THUMB_SIZE);
}

function positionToValue(y: number): number {
  const clamped = Math.max(0, Math.min(y, SLIDER_HEIGHT - THUMB_SIZE));
  const raw = 10 - (clamped / (SLIDER_HEIGHT - THUMB_SIZE)) * 10;
  return Math.round(raw);
}

export default function StepIntensity({ data, onChange, onNext }: StepIntensityProps) {
  const [value, setValue] = useState<number | null>(data.intensity);
  const thumbYRef = useRef(valueToPosition(data.intensity ?? 5));
  const [thumbY, setThumbY] = useState(valueToPosition(data.intensity ?? 5));
  const startYRef = useRef(0);
  const startThumbRef = useRef(0);

  const currentConfig = value !== null
    ? INTENSITY_CONFIG.find((c) => c.value === value)
    : null;
  const currentColor = currentConfig?.color ?? '#1E3A52';

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        startYRef.current = e.nativeEvent.pageY;
        startThumbRef.current = thumbYRef.current;
      },
      onPanResponderMove: (e) => {
        const dy = e.nativeEvent.pageY - startYRef.current;
        const newY = Math.max(0, Math.min(startThumbRef.current + dy, SLIDER_HEIGHT - THUMB_SIZE));
        thumbYRef.current = newY;
        setThumbY(newY);
        setValue(positionToValue(newY));
      },
      onPanResponderRelease: () => {
        const finalValue = positionToValue(thumbYRef.current);
        setValue(finalValue);
        onChange({ intensity: finalValue });
      },
    })
  ).current;

  const fillHeight = Math.max(0, SLIDER_HEIGHT - thumbY - THUMB_SIZE / 2);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
        <Text style={styles.title}>Qual o nível da dor?</Text>

        <View style={styles.sliderWrapper}>

          {/* Track + thumb */}
          <View
            style={[styles.track, { height: SLIDER_HEIGHT }]}
            {...panResponder.panHandlers}
          >
            <View style={[styles.trackBg, { height: SLIDER_HEIGHT }]} />

            {value !== null && (
              <View
                style={[
                  styles.trackFill,
                  { height: fillHeight, backgroundColor: currentColor },
                ]}
              />
            )}

            <View
              style={[
                styles.thumb,
                {
                  top: thumbY,
                  backgroundColor: value !== null ? currentColor : '#1E3A52',
                  shadowColor: value !== null ? currentColor : 'transparent',
                  borderWidth: value === null ? 2 : 0,
                  borderColor: '#2A4A62',
                },
              ]}
            >
              <Text style={styles.thumbText}>
                {value !== null ? value : '?'}
              </Text>
            </View>
          </View>

          {/* Labels — apenas valores pares */}
          <View style={[styles.labelsColumn, { height: SLIDER_HEIGHT }]}>
            {[...INTENSITY_CONFIG]
              .reverse()
              .filter((item) => EVEN_VALUES.includes(item.value))
              .map((item) => {
                const isActive = value !== null &&
                  EVEN_VALUES.reduce((prev, curr) =>
                    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
                  ) === item.value;

                return (
                  <View key={item.value} style={styles.labelRow}>
                    <Text style={[styles.labelEmoji, !isActive && { opacity: 0.4 }]}>
                      {item.emoji}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.labelNumber, isActive && { color: currentColor }]}>
                        {item.value}
                      </Text>
                      <Text style={[styles.labelText, isActive && { color: 'white' }]}>
                        {item.sublabel.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                );
              })}
          </View>
        </View>
      </Animated.View>

      <StepFooter onNext={onNext} disabled={value === null} />
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
    marginBottom: 28,
    lineHeight: 30,
  },
  sliderWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  track: {
    width: SLIDER_WIDTH,
    position: 'relative',
    alignItems: 'center',
  },
  trackBg: {
    position: 'absolute',
    width: SLIDER_WIDTH,
    top: 0,
    backgroundColor: '#1E3A52',
    borderRadius: SLIDER_WIDTH / 2,
  },
  trackFill: {
    position: 'absolute',
    width: SLIDER_WIDTH,
    bottom: 0,
    borderRadius: SLIDER_WIDTH / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  thumbText: {
    fontSize: 16,
    fontFamily: 'Epilogue_700Bold',
    color: '#FFFFFF',
  },
  labelsColumn: {
    flex: 1,
    justifyContent: 'space-between',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: SLIDER_HEIGHT / 6,
  },
  labelEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  labelNumber: {
    fontSize: 14,
    fontFamily: 'Epilogue_700Bold',
    color: Colors.muted,
    lineHeight: 16,
  },
  labelText: {
    fontSize: 9,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.muted,
    letterSpacing: 1,
  },
});