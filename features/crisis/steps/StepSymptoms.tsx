import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { HelpCircle } from 'lucide-react-native';
import StepFooter from './StepFooter';
import HelpModal from '../components/HelpModal';
import { SYMPTOMS, type CrisisRecord, type SymptomId } from '@/types/crisis';

interface StepSymptomsProps {
  data: CrisisRecord;
  onChange: (patch: Partial<CrisisRecord>) => void;
  onNext: () => void;
}

export default function StepSymptoms({ data, onChange, onNext }: StepSymptomsProps) {
  const reduceMotion = useReducedMotion();
  const [showHelp, setShowHelp] = useState(false);

  const toggleSymptom = (id: SymptomId) => {
    const current = data.symptoms;
    const next = current.includes(id)
      ? current.filter((s) => s !== id)
      : [...current, id];
    onChange({ symptoms: next });
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={reduceMotion ? undefined : FadeInUp.duration(400)} style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { marginBottom: 0 }]} accessibilityRole="header">Sintomas associados</Text>
          <TouchableOpacity 
            onPress={() => setShowHelp(true)}
            accessibilityRole="button"
            accessibilityLabel="Ajuda sobre os sintomas"
          >
            <HelpCircle size={24} color={Colors.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {SYMPTOMS.map((symptom, index) => {
            const isActive = data.symptoms.includes(symptom.id);
            return (
              <Animated.View
                key={symptom.id}
                entering={reduceMotion ? undefined : FadeInUp.delay(index * 60).duration(300)}
              >
                <TouchableOpacity
                  onPress={() => toggleSymptom(symptom.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.symptomBtn,
                    isActive && styles.symptomBtnActive,
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityLabel={symptom.label}
                  accessibilityState={{ checked: isActive }}
                  accessibilityHint="Toque para selecionar ou desmarcar"
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
          <Animated.View entering={reduceMotion ? undefined : FadeInUp.duration(200)} style={styles.countBadge}>
            <Text style={styles.countText} accessibilityLiveRegion="polite">
              {data.symptoms.length} selecionado{data.symptoms.length > 1 ? 's' : ''}
            </Text>
          </Animated.View>
        )}
      </Animated.View>

      <StepFooter onNext={onNext} />

      <HelpModal 
        visible={showHelp} 
        onClose={() => setShowHelp(false)} 
        title="Sintomas" 
        message="Selecione todos os sintomas que você está sentindo. Toque novamente para desmarcar." 
      />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  helpText: {
    fontSize: 13,
    fontFamily: 'Epilogue_400Regular',
    color: Colors.muted,
    marginBottom: 20,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
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
