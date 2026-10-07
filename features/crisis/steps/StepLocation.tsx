import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import StepFooter from './StepFooter';
import { LOCATIONS, SIDES, type CrisisRecord, type LocationId, type SideId } from '@/types/crisis';

interface StepLocationProps {
  data: CrisisRecord;
  onChange: (patch: Partial<CrisisRecord>) => void;
  onNext: () => void;
}

export default function StepLocation({ data, onChange, onNext }: StepLocationProps) {
  const reduceMotion = useReducedMotion();

  const toggleLocation = (id: LocationId) => {
    onChange({ location: data.location === id ? null : id });
  };

  const toggleSide = (id: SideId) => {
    onChange({ side: data.side === id ? null : id });
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={reduceMotion ? undefined : FadeInUp.duration(400)} style={styles.content}>
        <Text style={styles.title} accessibilityRole="header">Onde dói?</Text>

        <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="Localização da dor">
          {LOCATIONS.map((loc) => {
            const isActive = data.location === loc.id;
            return (
              <TouchableOpacity
                key={loc.id}
                onPress={() => toggleLocation(loc.id)}
                activeOpacity={0.7}
                style={[
                  styles.locationBtn,
                  isActive && styles.locationBtnActive,
                ]}
                accessibilityRole="radio"
                accessibilityLabel={loc.label}
                accessibilityState={{ checked: isActive }}
              >
                <Text style={styles.locationEmoji}>{loc.emoji}</Text>
                <Text
                  style={[
                    styles.locationLabel,
                    isActive && styles.locationLabelActive,
                  ]}
                >
                  {loc.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {data.location && (
          <Animated.View entering={reduceMotion ? undefined : FadeInUp.duration(300)} style={styles.sideSection}>
            <Text style={styles.sideTitle}>Qual lado?</Text>
            <View style={styles.sideRow} accessibilityRole="radiogroup" accessibilityLabel="Lado da dor">
              {SIDES.map((side) => {
                const isActive = data.side === side.id;
                const isAmbos = side.id === 'bilateral';
                return (
                  <TouchableOpacity
                    key={side.id}
                    onPress={() => toggleSide(side.id)}
                    activeOpacity={0.7}
                    style={[
                      styles.sideBtn,
                      isAmbos && styles.sideBtnAmbos,
                      isActive && styles.sideBtnActive,
                    ]}
                    accessibilityRole="radio"
                    accessibilityLabel={side.label}
                    accessibilityState={{ checked: isActive }}
                  >
                    <Text
                      style={[
                        styles.sideLabel,
                        isActive && styles.sideLabelActive,
                      ]}
                    >
                      {side.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}
      </Animated.View>

      <StepFooter onNext={onNext} />
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
    fontSize: 26,
    fontFamily: 'Epilogue_700Bold',
    color: 'white',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Epilogue_400Regular',
    color: Colors.muted,
    marginBottom: 28,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  locationBtn: {
    width: '45%',
    aspectRatio: 1.4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1.5,
    borderColor: '#1E3A52',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  locationBtnActive: {
    backgroundColor: `${Colors.accent}15`,
    borderColor: Colors.accent,
  },
  locationEmoji: {
    fontSize: 28,
  },
  locationLabel: {
    fontSize: 13,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.muted,
  },
  locationLabelActive: {
    color: Colors.accent,
  },

  sideSection: {
    marginTop: 24,
  },
  sideTitle: {
    fontSize: 16,
    fontFamily: 'Epilogue_600SemiBold',
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  sideRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  sideBtn: {
    width: '47%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#112236',
    borderWidth: 1.5,
    borderColor: '#1E3A52',
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  sideBtnAmbos: {
    minWidth: '60%',
    width: 'auto',
    paddingHorizontal: 24,
  },
  sideBtnActive: {
    backgroundColor: `${Colors.purple}18`,
    borderColor: Colors.purple,
  },
  sideLabel: {
    fontSize: 14,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.muted,
  },
  sideLabelActive: {
    color: Colors.purple,
  },
});
