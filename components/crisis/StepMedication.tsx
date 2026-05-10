import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Plus, X } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import StepFooter from './StepFooter';
import { MEDICATIONS, type CrisisRecord, type MedicationId } from '@/types/crisis';

interface StepMedicationProps {
  data: CrisisRecord;
  onChange: (patch: Partial<CrisisRecord>) => void;
  onNext: () => void;
}

export default function StepMedication({ data, onChange, onNext }: StepMedicationProps) {
  const [customText, setCustomText] = useState('');

  const toggleMedication = (id: MedicationId) => {
    const current = data.medications;

    // If "nenhum" is tapped, clear everything
    if (id === 'nenhum') {
      if (current.includes('nenhum')) {
        onChange({ medications: [] });
      } else {
        onChange({ medications: ['nenhum'], customMedications: [] });
      }
      return;
    }

    // If toggling a real medication, remove "nenhum" if present
    const withoutNenhum = current.filter((m) => m !== 'nenhum');
    const next = withoutNenhum.includes(id)
      ? withoutNenhum.filter((m) => m !== id)
      : [...withoutNenhum, id];
    onChange({ medications: next });
  };

  const addCustomMedication = () => {
    const trimmed = customText.trim();
    if (!trimmed) return;
    if (data.customMedications.includes(trimmed)) return;

    // Remove "nenhum" if present
    const medsWithoutNenhum = data.medications.filter((m) => m !== 'nenhum');
    onChange({
      medications: medsWithoutNenhum,
      customMedications: [...data.customMedications, trimmed],
    });
    setCustomText('');
  };

  const removeCustomMedication = (name: string) => {
    onChange({
      customMedications: data.customMedications.filter((m) => m !== name),
    });
  };

  // Separate "nenhum" from the rest
  const regularMeds = MEDICATIONS.filter((m) => m.id !== 'nenhum');
  const nenhumMed = MEDICATIONS.find((m) => m.id === 'nenhum')!;

  const totalSelected =
    data.medications.filter((m) => m !== 'nenhum').length +
    data.customMedications.length;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(400)}>
          <Text style={styles.title}>Tomou algum remédio?</Text>

          {/* ── Medication grid ── */}
          <View style={styles.grid}>
            {regularMeds.map((med, index) => {
              const isActive = data.medications.includes(med.id);
              return (
                <Animated.View
                  key={med.id}
                  entering={FadeInUp.delay(index * 50).duration(300)}
                >
                  <TouchableOpacity
                    onPress={() => toggleMedication(med.id)}
                    activeOpacity={0.7}
                    style={[
                      styles.medCard,
                      isActive && styles.medCardActive,
                    ]}
                  >
                    <Text style={styles.medEmoji}>{med.emoji}</Text>
                    <Text
                      style={[
                        styles.medLabel,
                        isActive && styles.medLabelActive,
                      ]}
                    >
                      {med.label}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* ── Custom medication input ── */}
          <Animated.View
            entering={FadeInUp.delay(350).duration(300)}
            style={styles.customSection}
          >
            <Text style={styles.customLabel}>Outro remédio</Text>
            <View style={styles.customInputRow}>
              <TextInput
                value={customText}
                onChangeText={setCustomText}
                placeholder="Ex: Cefaliv, Dorflex..."
                placeholderTextColor="#4A6A82"
                style={styles.customInput}
                onSubmitEditing={addCustomMedication}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={addCustomMedication}
                style={[
                  styles.addBtn,
                  !customText.trim() && styles.addBtnDisabled,
                ]}
                disabled={!customText.trim()}
              >
                <Plus size={20} color={customText.trim() ? 'white' : '#3A5A72'} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* ── Custom medications tags ── */}
          {data.customMedications.length > 0 && (
            <Animated.View entering={FadeInUp.duration(200)} style={styles.customTags}>
              {data.customMedications.map((name) => (
                <View key={name} style={styles.customTag}>
                  <Text style={styles.customTagEmoji}>💊</Text>
                  <Text style={styles.customTagText}>{name}</Text>
                  <TouchableOpacity
                    onPress={() => removeCustomMedication(name)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={14} color={Colors.accent} />
                  </TouchableOpacity>
                </View>
              ))}
            </Animated.View>
          )}

          {/* ── "Nenhum" option ── */}
          <Animated.View entering={FadeInUp.delay(400).duration(300)}>
            <TouchableOpacity
              onPress={() => toggleMedication('nenhum')}
              activeOpacity={0.7}
              style={[
                styles.nenhumBtn,
                data.medications.includes('nenhum') && styles.nenhumBtnActive,
              ]}
            >
              <Text style={styles.nenhumEmoji}>{nenhumMed.emoji}</Text>
              <Text
                style={[
                  styles.nenhumLabel,
                  data.medications.includes('nenhum') && styles.nenhumLabelActive,
                ]}
              >
                Não tomei nenhum remédio
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ── Count badge ── */}
          {totalSelected > 0 && (
            <Animated.View entering={FadeInUp.duration(200)} style={styles.countBadge}>
              <Text style={styles.countText}>
                {totalSelected} selecionado{totalSelected > 1 ? 's' : ''}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>

      <StepFooter onNext={onNext} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scroll: {
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
    marginBottom: 24,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 24,
  },
  medCard: {
    width: 105,
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1.5,
    borderColor: '#1E3A52',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  medCardActive: {
    backgroundColor: `${Colors.accent}15`,
    borderColor: Colors.accent,
  },
  medEmoji: {
    fontSize: 32,
  },
  medLabel: {
    fontSize: 12,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.muted,
    textAlign: 'center',
  },
  medLabelActive: {
    color: Colors.accent,
  },

  // Custom input
  customSection: {
    marginBottom: 20,
  },
  customLabel: {
    fontSize: 12,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  customInput: {
    flex: 1,
    backgroundColor: '#112236',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#1E3A52',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Epilogue_400Regular',
    color: 'white',
  },
  addBtn: {
    width: 50,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    backgroundColor: '#1E3A52',
  },

  // Custom tags
  customTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  customTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: `${Colors.accent}15`,
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  customTagEmoji: {
    fontSize: 16,
  },
  customTagText: {
    fontSize: 14,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.accent,
  },

  // Nenhum
  nenhumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1.5,
    borderColor: '#1E3A52',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  nenhumBtnActive: {
    backgroundColor: `${Colors.muted}15`,
    borderColor: Colors.muted,
    borderStyle: 'solid',
  },
  nenhumEmoji: {
    fontSize: 24,
  },
  nenhumLabel: {
    fontSize: 15,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.muted,
  },
  nenhumLabelActive: {
    color: 'white',
  },

  // Count badge
  countBadge: {
    alignSelf: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: `${Colors.accent}18`,
  },
  countText: {
    fontSize: 13,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.accent,
  },
});
