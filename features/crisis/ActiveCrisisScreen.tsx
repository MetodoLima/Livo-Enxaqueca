import Card from '@/components/ui/Card';
import { IntensityEditor, LocationEditor, MedicationsEditor, SymptomsEditor } from '@/features/crisis/components/EditModals';
import { Colors } from '@/constants/Colors';
import { useCrisis } from '@/contexts/CrisisContext';
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
import { useCrisisAiComplement } from '@/hooks/useCrisisAiComplement';
import { useRouter } from 'expo-router';
import { Check, ChevronRight, Clock, Mic, Plus, Send, X, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenBackground from '@/components/ui/ScreenBackground';
import Animated, { FadeInUp, ZoomIn, useReducedMotion } from 'react-native-reanimated';
import PastPhaseCard from '@/features/crisis/components/PastPhaseCard';
import CrisisEmptyState from '@/features/crisis/components/CrisisEmptyState';

export default function ActiveCrisisScreen() {
  const { activeCrisis, phases, updateActiveCrisis, addPhase, removePhase, clearCrisis, hasActiveCrisis, hydrated } = useCrisis();
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [editingField, setEditingField] = useState<
    'intensity' | 'location' | 'symptoms' | 'medications' | null
  >(null);
  const [salvando, setSalvando] = useState(false);
  const [registrada, setRegistrada] = useState(false);
  const [erroAoFinalizar, setErroAoFinalizar] = useState<string | null>(null);

  const [showVoice, setShowVoice] = useState(false);
  const [text, setText] = useState('');

  const {
    useLocalAi,
    toggleLocalAi,
    onDeviceAvailable,
    audioAvailable,
    isRecording,
    recordSecs,
    micError,
    startRecording,
    stopAndProcess: stopAndProcessAi,
    cancelRecording,
    submitText: submitTextAi,
    isProcessing,
    stageLabel,
    error,
  } = useCrisisAiComplement();

  const [savedIntensity, setSavedIntensity] = useState<number | null>(null);
  const [ficouNaFila, setFicouNaFila] = useState(false);

  // COGA P0 (achado #14): Confirmação antes de finalizar
  const handleFinish = () => {
    if (salvando || !activeCrisis) return;
    Alert.alert(
      'Finalizar esta crise?',
      'Os dados serão salvos permanentemente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar',
          onPress: async () => {
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
              AccessibilityInfo.announceForAccessibility('Crise registrada com sucesso!');
            } catch (e) {
              setErroAoFinalizar(
                ehBancoLocalIndisponivel(e)
                  ? 'Não foi possível salvar agora. Sua crise continua guardada neste aparelho e você pode finalizá-la quando tiver internet.'
                  : 'Não foi possível salvar a crise. Ela continua guardada neste aparelho. Tente de novo.',
              );
              AccessibilityInfo.announceForAccessibility('Erro ao salvar a crise.');
            } finally {
              setSalvando(false);
            }
          },
        },
      ],
    );
  };

  // COGA (achado #25): Auto-dismiss aumentado de 1.5s para 3s
  useEffect(() => {
    if (!registrada) return;
    const timer = setTimeout(() => {
      setRegistrada(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [registrada]);

  if (registrada) {
    return (
      <View
        style={styles.successContainer}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel={
          ficouNaFila
            ? 'Crise registrada. Salva no aparelho, será enviada com internet.'
            : savedIntensity != null
            ? `Crise registrada! Intensidade ${savedIntensity} de 10.`
            : 'Crise registrada com sucesso.'
        }
      >
        <Animated.View entering={reduceMotion ? undefined : ZoomIn} style={styles.successIcon}>
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
    AccessibilityInfo.announceForAccessibility('Analisando seu áudio...');
    const preFilled = crisisToMigraineStructured(crisis);
    const result = await stopAndProcessAi(preFilled);
    if (!result) {
      AccessibilityInfo.announceForAccessibility('Erro ao processar áudio.');
      return;
    }
    updateActiveCrisis({
      ...mergeAiResultIntoCrisis(crisis, result.structured),
      aiComplement: { audioUri: null, textNote: null, aiResult: result },
    });
    setShowVoice(false);
    AccessibilityInfo.announceForAccessibility('Detalhes adicionados com sucesso!');
  };

  const submitText = async () => {
    if (!text.trim()) return;
    AccessibilityInfo.announceForAccessibility('Analisando seu texto...');
    const preFilled = crisisToMigraineStructured(crisis);
    const result = await submitTextAi(preFilled, text.trim());
    if (!result) {
      AccessibilityInfo.announceForAccessibility('Erro ao processar texto.');
      return;
    }
    updateActiveCrisis({
      ...mergeAiResultIntoCrisis(crisis, result.structured),
      aiComplement: { audioUri: null, textNote: text.trim(), aiResult: result },
    });
    setText('');
    setShowVoice(false);
    AccessibilityInfo.announceForAccessibility('Detalhes adicionados com sucesso!');
  };

  const getDuration = () => {
    if (!crisis.endTime) return 'Em andamento';
    const diff = crisis.endTime.getTime() - crisis.startTime.getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  // COGA P1 (achado #17): Confirmação antes de registrar nova fase
  const handleAddPhase = () => {
    Alert.alert(
      'Registrar nova fase?',
      'A fase atual será salva e os campos serão reiniciados para a nova fase.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salvar e continuar',
          onPress: () => {
            addPhase();
            AccessibilityInfo.announceForAccessibility(
              `Fase ${phases.length + 1} salva. Preencha os dados da nova fase.`
            );
          },
        },
      ],
    );
  };

  const currentPhaseNumber = phases.length + 1;

  const anim = (delay: number) => reduceMotion ? undefined : FadeInUp.delay(delay);

  return (
    <ScreenBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 120, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle} accessibilityRole="header">Resumo da crise</Text>
          <TouchableOpacity
            onPress={handleFinish}
            disabled={salvando}
            style={[styles.finishBtn, salvando && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel="Finalizar e salvar esta crise"
            accessibilityState={{ disabled: salvando }}
            accessibilityHint="Será solicitada confirmação"
          >
            {salvando
              ? <ActivityIndicator size="small" color={Colors.accent} />
              : <Text style={styles.finishBtnText}>Finalizar</Text>}
          </TouchableOpacity>
        </View>

        {erroAoFinalizar && (
          <Text style={[styles.errorText, { marginBottom: 16 }]} accessibilityRole="alert">{erroAoFinalizar}</Text>
        )}

        {phases.length > 0 && (
          <Animated.View entering={anim(50)}>
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

        <Animated.View entering={anim(100)}>
          <Card
            className="mb-4"
            accessibilityLabel={`Hora de início: ${fmtTime(crisis.startTime)}. Duração: ${getDuration()}`}
          >
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
                accessibilityRole="button"
                accessibilityLabel="Definir hora de fim como agora"
              >
                <Clock size={16} color={Colors.orange} />
                <Text style={styles.endCrisisBtnText}>Definir hora de fim</Text>
              </TouchableOpacity>
            )}
            {/* COGA P1 (achado #15): Opção de desfazer hora de fim */}
            {crisis.endTime && (
              <TouchableOpacity
                onPress={() => updateActiveCrisis({ endTime: null })}
                style={styles.undoEndBtn}
                accessibilityRole="button"
                accessibilityLabel="Remover hora de fim e voltar para em andamento"
              >
                <X size={14} color={Colors.muted} />
                <Text style={styles.undoEndBtnText}>Remover hora de fim</Text>
              </TouchableOpacity>
            )}
          </Card>
        </Animated.View>

        <Animated.View entering={anim(200)}>
          <Card
            className="mb-4"
            onPress={() => setEditingField('intensity')}
            accessibilityLabel={`Intensidade: ${crisis.intensity !== null ? `${crisis.intensity} de 10, ${intensityConfig?.label ?? ''}` : 'não definida'}. Toque para editar`}
          >
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
              <ChevronRight size={18} color={Colors.muted} importantForAccessibility="no" />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={anim(300)}>
          <TouchableOpacity
            onPress={() => setEditingField('location')}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}
            accessibilityRole="button"
            accessibilityLabel={`Localização: ${locationData?.label ?? 'não definida'}. Lado: ${sideData?.label ?? 'não definido'}. Toque para editar`}
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

        <Animated.View entering={anim(400)}>
          <Card
            className="mb-4"
            onPress={() => setEditingField('symptoms')}
            accessibilityLabel={`Sintomas: ${symptomNames.length > 0 ? symptomNames.map(s => s?.label).filter(Boolean).join(', ') : 'nenhum selecionado'}. Toque para editar`}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.cardLabel, { marginBottom: 10 }]}>Sintomas</Text>
              <ChevronRight size={16} color={Colors.muted} style={{ marginBottom: 6 }} importantForAccessibility="no" />
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

        <Animated.View entering={anim(450)}>
          <Card
            className="mb-4"
            onPress={() => setEditingField('medications')}
            accessibilityLabel={`Medicamentos: ${(medicationNames.length > 0 || crisis.customMedications.length > 0) ? [...medicationNames.map(m => m?.label), ...crisis.customMedications].filter(Boolean).join(', ') : 'nenhum selecionado'}. Toque para editar`}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.cardLabel, { marginBottom: 10 }]}>Medicamentos</Text>
              <ChevronRight size={16} color={Colors.muted} style={{ marginBottom: 6 }} importantForAccessibility="no" />
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

        <Animated.View entering={anim(500)}>
          <TouchableOpacity
            onPress={handleAddPhase}
            style={styles.addPhaseBtn}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Registrar nova fase da crise"
            accessibilityHint="Salva a fase atual e permite registrar uma nova"
          >
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
            <ChevronRight size={18} color={`${Colors.purple}60`} importantForAccessibility="no" />
          </TouchableOpacity>
        </Animated.View>

        {(() => {
          const structured = crisis.aiComplement?.aiResult?.structured;
          const gatilhos = crisis.triggers;
          if (!structured?.resumo && gatilhos.length === 0) return null;
          return (
            <Animated.View entering={anim(560)}>
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
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          accessibilityRole="button"
                          accessibilityLabel={`Remover gatilho: ${g}`}
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

        <Animated.View entering={anim(620)}>
          {!showVoice ? (
            <TouchableOpacity
              onPress={() => setShowVoice(true)}
              style={styles.voiceEntryBtn}
              accessibilityRole="button"
              accessibilityLabel="Adicionar mais detalhes por voz ou texto"
            >
              <Mic size={22} color={Colors.accent} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.voiceEntryTitle}>Adicionar mais detalhes</Text>
                <Text style={styles.voiceEntrySub}>Por voz ou texto</Text>
              </View>
              <ChevronRight size={20} color={Colors.muted} importantForAccessibility="no" />
            </TouchableOpacity>
          ) : (
            <Card className="mb-4">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={[styles.cardLabel, { marginBottom: 0 }]}>Complementar registro</Text>
                <TouchableOpacity
                  onPress={() => { setShowVoice(false); if (isRecording) cancelRecording(); }}
                  accessibilityRole="button"
                  accessibilityLabel="Fechar painel de complemento"
                >
                  <X size={20} color={Colors.muted} />
                </TouchableOpacity>
              </View>

              {isProcessing ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }} accessible={true} accessibilityLabel="Analisando seus dados. Aguarde.">
                  <ActivityIndicator size="large" color={Colors.accent} />
                  <Text style={[styles.cardLabel, { marginTop: 12, textAlign: 'center' }]}>
                    {stageLabel ?? 'Analisando...'}
                  </Text>
                </View>
              ) : (
                <>
                  {onDeviceAvailable && (
                    <View style={styles.localAiRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.localAiLabel}>IA local (beta)</Text>
                        <Text style={styles.localAiHint}>
                          {useLocalAi ? 'Processa no aparelho, sem enviar dados' : 'Processa no servidor'}
                        </Text>
                      </View>
                      <Switch
                        value={useLocalAi}
                        onValueChange={toggleLocalAi}
                        trackColor={{ false: 'rgba(139,163,167,0.3)', true: Colors.accent }}
                      />
                    </View>
                  )}

                  {audioAvailable && (
                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                      {isRecording ? (
                        <>
                          <PulsingMic onStop={stopAndProcess} size={72} iconSize={28} />
                          <Text style={styles.recTime} accessibilityLiveRegion="polite">{fmtSecs(recordSecs)}</Text>
                        </>
                      ) : (
                        <TouchableOpacity
                          onPress={startRecording}
                          style={styles.micBtn}
                          accessibilityRole="button"
                          accessibilityLabel="Gravar áudio"
                          accessibilityHint="Toque para iniciar a gravação"
                        >
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
                    accessibilityLabel="Detalhes adicionais em texto"
                  />

                  {(error || micError) && (
                    <Text style={styles.errorText} accessibilityRole="alert">{error || micError}</Text>
                  )}

                  {text.trim().length > 0 && !isRecording && (
                    <TouchableOpacity
                      onPress={submitText}
                      style={styles.sendBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Analisar texto escrito"
                    >
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: `${Colors.accent}25`,
    borderWidth: 2,
    borderColor: Colors.accent,
    minHeight: 44,
    justifyContent: 'center',
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
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  phaseDividerLabel: {
    fontSize: 12,
    fontFamily: 'Epilogue_700Bold',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },

  cardLabel: {
    fontSize: 12,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: `${Colors.orange}15`,
    alignSelf: 'flex-start',
    minHeight: 44,
  },
  endCrisisBtnText: {
    fontSize: 13,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.orange,
  },
  // COGA: Botão para desfazer hora de fim
  undoEndBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
    minHeight: 44,
  },
  undoEndBtnText: {
    fontSize: 12,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.muted,
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
    minHeight: 56,
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
    minHeight: 56,
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

  localAiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(139,163,167,0.18)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  localAiLabel: {
    fontSize: 14,
    fontFamily: 'Epilogue_600SemiBold',
    color: 'white',
  },
  localAiHint: {
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
    minHeight: 48,
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
