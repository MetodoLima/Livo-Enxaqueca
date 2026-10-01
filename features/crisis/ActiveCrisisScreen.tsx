import Card from '@/components/ui/Card';
import { IntensityEditor, LocationEditor, MedicationsEditor, SymptomsEditor } from '@/features/crisis/components/EditModals';
import { Colors } from '@/constants/Colors';
import { useCrisis } from '@/contexts/CrisisContext';
import { complementCrisis } from '@/services/api';
import { crisisRepository, ehBancoLocalIndisponivel } from '@/repositories';
import { tagStyles } from '@/features/crisis/components/tagStyles';
import {
  INTENSITY_CONFIG,
  LOCATIONS,
  MEDICATIONS,
  SIDES,
  SYMPTOMS,
  crisisToMigraineStructured,
  mergeAiResultIntoCrisis,
} from '@/types/crisis';
import PulsingMic from '@/components/ui/PulsingMic';
import { audioAvailable, useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useRouter } from 'expo-router';
import { Check, ChevronRight, Clock, Mic, Plus, Send, X, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenBackground from '@/components/ui/ScreenBackground';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import PastPhaseCard from '@/features/crisis/components/PastPhaseCard';
import CrisisEmptyState from '@/features/crisis/components/CrisisEmptyState';

export default function ActiveCrisisScreen() {
  const { activeCrisis, phases, updateActiveCrisis, addPhase, removePhase, clearCrisis, hasActiveCrisis, hydrated } = useCrisis();
  const router = useRouter();

  const [editingField, setEditingField] = useState<
    'intensity' | 'location' | 'symptoms' | 'medications' | null
  >(null);
  const [salvando, setSalvando] = useState(false);
  const [registrada, setRegistrada] = useState(false);
  const [erroAoFinalizar, setErroAoFinalizar] = useState<string | null>(null);

  const [showVoice, setShowVoice] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { isRecording, recordSecs, error: micError, startRecording, stopRecording } = useAudioRecorder();

  const [savedIntensity, setSavedIntensity] = useState<number | null>(null);
  const [ficouNaFila, setFicouNaFila] = useState(false);

  const handleFinish = async () => {
    if (salvando || !activeCrisis) return;
    setSalvando(true);
    setErroAoFinalizar(null);
    try {
      const crisisToSave = activeCrisis.endTime
        ? activeCrisis
        : { ...activeCrisis, endTime: new Date() };
      const { enviado } = await crisisRepository.save(crisisToSave, phases);
      setSavedIntensity(activeCrisis.intensity ?? null);
      setFicouNaFila(!enviado);
      setRegistrada(true);
      clearCrisis();
    } catch (e) {
      setErroAoFinalizar(
        ehBancoLocalIndisponivel(e)
          ? 'Não foi possível salvar agora. Sua crise continua guardada neste aparelho e você pode finalizá-la quando tiver internet.'
          : 'Não foi possível salvar a crise. Ela continua guardada neste aparelho. Tente de novo.',
      );
    } finally {
      setSalvando(false);
    }
  };

  useEffect(() => {
    if (!registrada) return;
    const timer = setTimeout(() => {
      setRegistrada(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [registrada]);

  if (registrada) {
    return (
      <View style={styles.successContainer}>
        <Animated.View entering={ZoomIn} style={styles.successIcon}>
          <Check size={36} color="#10B981" />
        </Animated.View>
        <Text style={styles.successTitle}>Crise registrada!</Text>
        <Text style={styles.successSub}>
          {ficouNaFila
            ? 'Salva no aparelho. Será enviada quando houver internet.'
            : savedIntensity != null
            ? `Intensidade ${savedIntensity}/10`
            : 'Registro salvo com sucesso.'}
        </Text>
      </View>
    );
  }

  if (!hydrated) return null;

  if (!hasActiveCrisis || !activeCrisis) return <CrisisEmptyState />;

  const crisis = activeCrisis;
  const intensityConfig = crisis.intensity !== null ? INTENSITY_CONFIG[crisis.intensity] : null;
  const locationData = LOCATIONS.find((l) => l.id === crisis.location);
  const sideData = SIDES.find((s) => s.id === crisis.side);
  const symptomNames = crisis.symptoms
    .map((id) => SYMPTOMS.find((s) => s.id === id))
    .filter(Boolean);
  const medicationNames = crisis.medications
    .map((id) => MEDICATIONS.find((m) => m.id === id))
    .filter(Boolean);

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const fmtSecs = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const stopAndProcess = async () => {
    setError(null);
    try {
      const uri = await stopRecording();
      if (!uri) throw new Error('URI inválido.');
      setIsProcessing(true);
      const preFilled = crisisToMigraineStructured(crisis);
      const result = await complementCrisis(preFilled, uri, null);
      updateActiveCrisis({
        ...mergeAiResultIntoCrisis(crisis, result.structured),
        aiComplement: { audioUri: uri, textNote: null, aiResult: result },
      });
      setIsProcessing(false);
      setShowVoice(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao processar áudio.');
      setIsProcessing(false);
    }
  };

  const submitText = async () => {
    if (!text.trim()) return;
    setError(null);
    setIsProcessing(true);
    try {
      const preFilled = crisisToMigraineStructured(crisis);
      const result = await complementCrisis(preFilled, null, text.trim());
      updateActiveCrisis({
        ...mergeAiResultIntoCrisis(crisis, result.structured),
        aiComplement: { audioUri: null, textNote: text.trim(), aiResult: result },
      });
      setText('');
      setIsProcessing(false);
      setShowVoice(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao processar texto.');
      setIsProcessing(false);
    }
  };

  const getDuration = () => {
    if (!crisis.endTime) return 'Em andamento';
    const diff = crisis.endTime.getTime() - crisis.startTime.getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const currentPhaseNumber = phases.length + 1;

  return (
    <ScreenBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Resumo da crise</Text>
          <TouchableOpacity
            onPress={handleFinish}
            disabled={salvando}
            style={[styles.finishBtn, salvando && { opacity: 0.6 }]}
          >
            {salvando
              ? <ActivityIndicator size="small" color={Colors.accent} />
              : <Text style={styles.finishBtnText}>Finalizar</Text>}
          </TouchableOpacity>
        </View>

        {erroAoFinalizar && (
          <Text style={[styles.errorText, { marginBottom: 16 }]}>{erroAoFinalizar}</Text>
        )}

        {phases.length > 0 && (
          <Animated.View entering={FadeInUp.delay(50)}>
            {phases.map((phase, i) => (
              <PastPhaseCard key={i} phase={phase} index={i} onDelete={() => removePhase(i)} />
            ))}
            <View style={styles.phaseDivider}>
              <View style={styles.phaseDividerLine} />
              <Text style={styles.phaseDividerLabel}>Fase {currentPhaseNumber}</Text>
              <View style={styles.phaseDividerLine} />
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.delay(100)}>
          <Card className="mb-4">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={styles.cardLabel}>Hora de início</Text>
                <Text style={styles.cardValue}>{fmtTime(crisis.startTime)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.cardLabel}>Duração</Text>
                <Text style={[styles.cardValue, { color: crisis.endTime ? Colors.accent : Colors.orange }]}>
                  {getDuration()}
                </Text>
              </View>
            </View>
            {!crisis.endTime && (
              <TouchableOpacity
                onPress={() => updateActiveCrisis({ endTime: new Date() })}
                style={styles.endCrisisBtn}
              >
                <Clock size={16} color={Colors.orange} />
                <Text style={styles.endCrisisBtnText}>Definir hora de fim</Text>
              </TouchableOpacity>
            )}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)}>
          <Card className="mb-4" onPress={() => setEditingField('intensity')}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconBox, { backgroundColor: `${intensityConfig?.color ?? Colors.muted}20` }]}>
                <Zap size={20} color={intensityConfig?.color ?? Colors.muted} fill={intensityConfig?.color ?? Colors.muted} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.cardLabel}>Intensidade</Text>
                <Text style={[styles.cardValue, { color: intensityConfig?.color ?? 'white' }]}>
                  {crisis.intensity !== null ? `${crisis.intensity}/10` : '–'}
                  {intensityConfig?.label ? (
                    <Text style={{ fontSize: 14 }}> · {intensityConfig.label}</Text>
                  ) : null}
                </Text>
              </View>
              <ChevronRight size={18} color={Colors.muted} />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300)}>
          <TouchableOpacity
            onPress={() => setEditingField('location')}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}
          >
            <Card style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Localização</Text>
              {locationData ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <Text style={{ fontSize: 22 }}>{locationData.emoji}</Text>
                  <Text style={styles.smallValue}>{locationData.label}</Text>
                </View>
              ) : (
                <View style={styles.editHint}>
                  <Text style={styles.editHintText}>Editar</Text>
                </View>
              )}
            </Card>
            <Card style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Lado</Text>
              {sideData ? (
                <Text style={[styles.smallValue, { marginTop: 6 }]}>{sideData.label}</Text>
              ) : (
                <View style={styles.editHint}>
                  <Text style={styles.editHintText}>Editar</Text>
                </View>
              )}
            </Card>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)}>
          <Card className="mb-4" onPress={() => setEditingField('symptoms')}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.cardLabel, { marginBottom: 10 }]}>Sintomas</Text>
              <ChevronRight size={16} color={Colors.muted} style={{ marginBottom: 6 }} />
            </View>
            {symptomNames.length > 0 ? (
              <View style={tagStyles.tagRow}>
                {symptomNames.map((s) => s && (
                  <View key={s.id} style={tagStyles.tag}>
                    <Text style={tagStyles.tagEmoji}>{s.emoji}</Text>
                    <Text style={tagStyles.tagText}>{s.label}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.editHint}>
                <Text style={styles.editHintText}>Editar</Text>
              </View>
            )}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(450)}>
          <Card className="mb-4" onPress={() => setEditingField('medications')}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.cardLabel, { marginBottom: 10 }]}>Medicamentos</Text>
              <ChevronRight size={16} color={Colors.muted} style={{ marginBottom: 6 }} />
            </View>
            {(medicationNames.length > 0 || crisis.customMedications.length > 0) ? (
              <View style={tagStyles.tagRow}>
                {medicationNames.map((m) => m && (
                  <View key={m.id} style={[tagStyles.tag, { backgroundColor: `${Colors.accent}15` }]}>
                    <Text style={tagStyles.tagEmoji}>{m.emoji}</Text>
                    <Text style={[tagStyles.tagText, { color: Colors.accent }]}>{m.label}</Text>
                  </View>
                ))}
                {crisis.customMedications.map((name) => (
                  <View key={name} style={[tagStyles.tag, { backgroundColor: `${Colors.accent}15` }]}>
                    <Text style={tagStyles.tagEmoji}>💊</Text>
                    <Text style={[tagStyles.tagText, { color: Colors.accent }]}>{name}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.editHint}>
                <Text style={styles.editHintText}>Editar</Text>
              </View>
            )}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500)}>
          <TouchableOpacity onPress={addPhase} style={styles.addPhaseBtn} activeOpacity={0.75}>
            <View style={styles.addPhaseIconCircle}>
              <Plus size={18} color={Colors.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.addPhaseTitle}>Registrar nova fase</Text>
              <Text style={styles.addPhaseSub}>
                {phases.length === 0
                  ? 'A dor mudou? Salve este momento e atualize'
                  : `Fase ${currentPhaseNumber} em andamento · toque para registrar outra`}
              </Text>
            </View>
            <ChevronRight size={18} color={`${Colors.purple}60`} />
          </TouchableOpacity>
        </Animated.View>

        {(() => {
          const structured = crisis.aiComplement?.aiResult?.structured;
          const gatilhos = crisis.triggers;
          if (!structured?.resumo && gatilhos.length === 0) return null;
          return (
            <Animated.View entering={FadeInUp.delay(560)}>
              <Card className="mb-4" variant="accent-border">
                <Text style={styles.cardLabel}>Análise da IA</Text>
                {structured?.resumo && (
                  <Text style={styles.aiSummary}>{structured.resumo}</Text>
                )}
                {gatilhos.length > 0 && (
                  <View style={{ marginTop: structured?.resumo ? 14 : 4 }}>
                    <Text style={[styles.cardLabel, { marginBottom: 8 }]}>Possíveis gatilhos</Text>
                    {gatilhos.map((g, i) => (
                      <View key={i} style={styles.gatilhoRow}>
                        <Zap size={13} color={Colors.orange} style={{ marginRight: 6 }} />
                        <Text style={styles.gatilhoText}>{g}</Text>
                        <TouchableOpacity
                          onPress={() =>
                            updateActiveCrisis({
                              triggers: crisis.triggers.filter((_, idx) => idx !== i),
                            })
                          }
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <X size={14} color={Colors.muted} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            </Animated.View>
          );
        })()}

        <Animated.View entering={FadeInUp.delay(620)}>
          {!showVoice ? (
            <TouchableOpacity onPress={() => setShowVoice(true)} style={styles.voiceEntryBtn}>
              <Mic size={22} color={Colors.accent} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.voiceEntryTitle}>Adicionar mais detalhes</Text>
                <Text style={styles.voiceEntrySub}>Por voz ou texto</Text>
              </View>
              <ChevronRight size={20} color={Colors.muted} />
            </TouchableOpacity>
          ) : (
            <Card className="mb-4">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={[styles.cardLabel, { marginBottom: 0 }]}>Complementar registro</Text>
                <TouchableOpacity onPress={() => { setShowVoice(false); if (isRecording) stopRecording(); }}>
                  <X size={20} color={Colors.muted} />
                </TouchableOpacity>
              </View>

              {isProcessing ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <ActivityIndicator size="large" color={Colors.accent} />
                  <Text style={[styles.cardLabel, { marginTop: 12 }]}>Analisando...</Text>
                </View>
              ) : (
                <>
                  {audioAvailable && (
                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                      {isRecording ? (
                        <>
                          <PulsingMic onStop={stopAndProcess} size={72} iconSize={28} />
                          <Text style={styles.recTime}>{fmtSecs(recordSecs)}</Text>
                        </>
                      ) : (
                        <TouchableOpacity onPress={startRecording} style={styles.micBtn}>
                          <Mic size={28} color="white" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  <TextInput
                    value={text}
                    onChangeText={setText}
                    placeholder="Escreva detalhes adicionais..."
                    placeholderTextColor={Colors.muted}
                    multiline
                    style={styles.textArea}
                    editable={!isRecording}
                  />

                  {(error || micError) && (
                    <Text style={styles.errorText}>{error || micError}</Text>
                  )}

                  {text.trim().length > 0 && !isRecording && (
                    <TouchableOpacity onPress={submitText} style={styles.sendBtn}>
                      <Send size={16} color="white" style={{ marginRight: 8 }} />
                      <Text style={styles.sendBtnText}>Analisar</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </Card>
          )}
        </Animated.View>
      </ScrollView>

      <IntensityEditor
        visible={editingField === 'intensity'}
        onClose={() => setEditingField(null)}
        value={crisis.intensity}
        onChange={(v) => updateActiveCrisis({ intensity: v })}
      />
      <LocationEditor
        visible={editingField === 'location'}
        onClose={() => setEditingField(null)}
        location={crisis.location}
        side={crisis.side}
        onChange={updateActiveCrisis}
      />
      <SymptomsEditor
        visible={editingField === 'symptoms'}
        onClose={() => setEditingField(null)}
        symptoms={crisis.symptoms}
        onChange={(symptoms) => updateActiveCrisis({ symptoms })}
      />
      <MedicationsEditor
        visible={editingField === 'medications'}
        onClose={() => setEditingField(null)}
        medications={crisis.medications}
        customMedications={crisis.customMedications}
        onChange={updateActiveCrisis}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Epilogue_700Bold',
    color: 'white',
  },
  finishBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: `${Colors.accent}18`,
  },
  finishBtnText: {
    fontSize: 14,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.accent,
  },

  phaseDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
    gap: 10,
  },
  phaseDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  phaseDividerLabel: {
    fontSize: 10,
    fontFamily: 'Epilogue_700Bold',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  cardLabel: {
    fontSize: 11,
    fontFamily: 'Epilogue_700Bold',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 22,
    fontFamily: 'Epilogue_700Bold',
    color: 'white',
  },
  smallValue: {
    fontSize: 16,
    fontFamily: 'Epilogue_600SemiBold',
    color: 'white',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  editHint: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignSelf: 'flex-start',
  },
  editHintText: {
    fontSize: 13,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.accent,
  },

  endCrisisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: `${Colors.orange}15`,
    alignSelf: 'flex-start',
  },
  endCrisisBtnText: {
    fontSize: 13,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.orange,
  },

  addPhaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 18,
    backgroundColor: `${Colors.purple}12`,
    borderWidth: 1.5,
    borderColor: `${Colors.purple}35`,
    marginBottom: 16,
  },
  addPhaseIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: `${Colors.purple}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhaseTitle: {
    fontSize: 15,
    fontFamily: 'Epilogue_700Bold',
    color: 'white',
  },
  addPhaseSub: {
    fontSize: 12,
    fontFamily: 'Epilogue_400Regular',
    color: Colors.muted,
    marginTop: 2,
  },

  aiSummary: {
    fontSize: 15,
    fontFamily: 'Epilogue_400Regular',
    color: Colors.soft,
    lineHeight: 22,
    marginTop: 6,
  },
  gatilhoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  gatilhoText: {
    fontSize: 14,
    fontFamily: 'Epilogue_400Regular',
    color: Colors.soft,
    flex: 1,
  },

  voiceEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(139,163,167,0.12)',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  voiceEntryTitle: {
    fontSize: 15,
    fontFamily: 'Epilogue_600SemiBold',
    color: 'white',
  },
  voiceEntrySub: {
    fontSize: 12,
    fontFamily: 'Epilogue_400Regular',
    color: Colors.muted,
    marginTop: 2,
  },

  micBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  recTime: {
    fontSize: 14,
    fontFamily: 'Epilogue_600SemiBold',
    color: '#EF4444',
    marginTop: 8,
  },
  textArea: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(139,163,167,0.18)',
    borderRadius: 14,
    padding: 14,
    color: 'white',
    fontFamily: 'Epilogue_400Regular',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontFamily: 'Epilogue_400Regular',
    textAlign: 'center',
    marginBottom: 10,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 14,
  },
  sendBtnText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Epilogue_700Bold',
  },

  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgDark,
    paddingHorizontal: 24,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(16,185,129,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    color: 'white',
    fontSize: 22,
    fontFamily: 'Epilogue_700Bold',
    marginBottom: 8,
  },
  successSub: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'Epilogue_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
});
