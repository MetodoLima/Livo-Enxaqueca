import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import StepFooter from './StepFooter';
import { SYMPTOMS, type CrisisRecord, type SymptomId } from '@/types/crisis';

interface StepSymptomsProps {
  data: CrisisRecord;
  onChange: (patch: Partial<CrisisRecord>) => void;
  onNext: () => void;
}

export default function StepSymptoms({ data, onChange, onNext }: StepSymptomsProps) {
  const toggleSymptom = (id: SymptomId) => {
    const current = data.symptoms;
    const next = current.includes(id)
      ? current.filter((s) => s !== id)
      : [...current, id];
    onChange({ symptoms: next });
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
        <Text style={styles.title}>Sintomas associados</Text>
        <Text style={styles.subtitle}>
          Selecione o que está sentindo junto com a dor
        </Text>

        <View style={styles.grid}>
          {SYMPTOMS.map((symptom, index) => {
            const isActive = data.symptoms.includes(symptom.id);
            return (
              <Animated.View
                key={symptom.id}
                entering={FadeInUp.delay(index * 60).duration(300)}
              >
                <TouchableOpacity
                  onPress={() => toggleSymptom(symptom.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.symptomBtn,
                    isActive && styles.symptomBtnActive,
                  ]}
                >
                  <Text style={styles.symptomEmoji}>{symptom.emoji}</Text>
                  <Text
                    style={[
                      styles.symptomLabel,
                      isActive && styles.symptomLabelActive,
                    ]}
                  >
                    {symptom.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {data.symptoms.length > 0 && (
          <Animated.View entering={FadeInUp.duration(200)} style={styles.countBadge}>
            <Text style={styles.countText}>
              {data.symptoms.length} selecionado{data.symptoms.length > 1 ? 's' : ''}
            </Text>
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
    marginBottom: 8,
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
  symptomBtn: {
    width: 105,
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1.5,
    borderColor: '#1E3A52',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  symptomBtnActive: {
    backgroundColor: `${Colors.purple}15`,
    borderColor: Colors.purple,
  },
  symptomEmoji: {
    fontSize: 28,
  },
  symptomLabel: {
    fontSize: 12,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.muted,
    textAlign: 'center',
  },
  symptomLabelActive: {
    color: Colors.purple,
  },
  countBadge: {
    alignSelf: 'center',
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: `${Colors.purple}18`,
  },
  countText: {
    fontSize: 13,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.purple,
  },
});
