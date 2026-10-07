import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Plus, X, HelpCircle } from 'lucide-react-native';
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import StepFooter from './StepFooter';
import HelpModal from '../components/HelpModal';
import { MEDICATIONS, type CrisisRecord, type MedicationId } from '@/types/crisis';

interface StepMedicationProps {
  data: CrisisRecord;
  onChange: (patch: Partial<CrisisRecord>) => void;
  onNext: () => void;
}

export default function StepMedication({ data, onChange, onNext }: StepMedicationProps) {
  const reduceMotion = useReducedMotion();
  const [customText, setCustomText] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const toggleMedication = (id: MedicationId) => {
    const current = data.medications;

    if (id === 'nenhum') {
      if (current.includes('nenhum')) {
        onChange({ medications: [] });
      } else {
        onChange({ medications: ['nenhum'], customMedications: [] });
      }
      return;
    }

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

  const regularMeds = MEDICATIONS.filter((m) => m.id !== 'nenhum');
  const nenhumMed = MEDICATIONS.find((m) => m.id === 'nenhum')!;

  const totalSelected =
    data.medications.filter((m) => m !== 'nenhum').length +
    data.customMedications.length;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={reduceMotion ? undefined : FadeInUp.duration(400)}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { marginBottom: 0 }]} accessibilityRole="header">Tomou algum remédio?</Text>
            <TouchableOpacity 
              onPress={() => setShowHelp(true)}
              accessibilityRole="button"
              accessibilityLabel="Ajuda sobre medicamentos"
            >
              <HelpCircle size={24} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          {/* COGA: "Não tomei nenhum" movido para o topo — opção mais provável durante crise severa */}
          <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(50).duration(300)}>
            <TouchableOpacity
              onPress={() => toggleMedication('nenhum')}
              activeOpacity={0.7}
              style={[
                styles.nenhumBtn,
                data.medications.includes('nenhum') && styles.nenhumBtnActive,
              ]}
              accessibilityRole="checkbox"
              accessibilityLabel="Não tomei nenhum remédio"
              accessibilityState={{ checked: data.medications.includes('nenhum') }}
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

          <View style={styles.grid}>
            {regularMeds.map((med, index) => {
              const isActive = data.medications.includes(med.id);
              return (
                <Animated.View
                  key={med.id}
                  entering={reduceMotion ? undefined : FadeInUp.delay(index * 50).duration(300)}
                >
                  <TouchableOpacity
                    onPress={() => toggleMedication(med.id)}
                    activeOpacity={0.7}
                    style={[
                      styles.medCard,
                      isActive && styles.medCardActive,
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityLabel={med.label}
                    accessibilityState={{ checked: isActive }}
                    accessibilityHint="Toque para selecionar ou desmarcar"
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

          <Animated.View
            entering={reduceMotion ? undefined : FadeInUp.delay(350).duration(300)}
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
                accessibilityLabel="Nome do medicamento personalizado"
                accessibilityHint="Digite o nome e toque no botão de adicionar"
              />
              <TouchableOpacity
                onPress={addCustomMedication}
                style={[
                  styles.addBtn,
                  !customText.trim() && styles.addBtnDisabled,
                ]}
                disabled={!customText.trim()}
                accessibilityRole="button"
                accessibilityLabel="Adicionar medicamento"
                accessibilityState={{ disabled: !customText.trim() }}
              >
                <Plus size={20} color={customText.trim() ? 'white' : '#3A5A72'} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {data.customMedications.length > 0 && (
            <Animated.View entering={reduceMotion ? undefined : FadeInUp.duration(200)} style={styles.customTags}>
              {data.customMedications.map((name) => (
                <View
                  key={name}
                  style={styles.customTag}
                  accessible={true}
                  accessibilityLabel={`Medicamento: ${name}`}
                >
                  <Text style={styles.customTagEmoji}>💊</Text>
                  <Text style={styles.customTagText}>{name}</Text>
                  <TouchableOpacity
                    onPress={() => removeCustomMedication(name)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover ${name}`}
                  >
                    <X size={14} color={Colors.accent} />
                  </TouchableOpacity>
                </View>
              ))}
            </Animated.View>
          )}

          {totalSelected > 0 && (
            <Animated.View entering={reduceMotion ? undefined : FadeInUp.duration(200)} style={styles.countBadge}>
              <Text style={styles.countText} accessibilityLiveRegion="polite">
                {totalSelected} selecionado{totalSelected > 1 ? 's' : ''}
              </Text>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>

      <StepFooter onNext={onNext} />

      <HelpModal 
        visible={showHelp} 
        onClose={() => setShowHelp(false)} 
        title="Medicamentos" 
        message='Se não tomou, toque em "Não tomei nenhum". Você pode adicionar medicamentos personalizados abaixo.' 
      />
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
    marginBottom: 24,
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
    width: 56,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    backgroundColor: '#1E3A52',
  },

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
    marginBottom: 20,
    minHeight: 56,
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
