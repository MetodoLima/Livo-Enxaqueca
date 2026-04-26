import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  X,
  Mic,
  Send,
  Check,
  RotateCcw,
  StopCircle,
  Zap,
  MapPin,
  Pill,
  Thermometer,
  AlertTriangle,
} from 'lucide-react-native';
import Animated, {
  ZoomIn,
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { Colors } from '@/constants/Colors';
import Card from '@/components/Card';
import { processAudio, processText, MigraineRecord } from '@/services/api';

type Step = 'input' | 'recording' | 'processing' | 'result' | 'confirmed';

// ── Pulsing mic shown while recording ─────────────────────────────────
function PulsingMic({ onStop }: { onStop: () => void }) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.5, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: interpolate(pulse.value, [1, 1.5], [0.35, 0]),
  }));

  return (
    <View style={styles.micWrapper}>
      <Animated.View style={[styles.pulseRing, ringStyle]} />
      <TouchableOpacity onPress={onStop} style={styles.micButtonRecording}>
        <StopCircle size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}

// ── Structured result display ─────────────────────────────────────────
function ResultCard({ result }: { result: MigraineRecord }) {
  const { structured: s, transcript } = result;

  const intensityColor = () => {
    if (s.intensidade_dor === null) return Colors.muted;
    if (s.intensidade_dor <= 3) return '#10B981';
    if (s.intensidade_dor <= 6) return Colors.orange;
    return '#EF4444';
  };

  const incapacidadeColors: Record<string, string> = {
    leve: '#10B981',
    moderado: Colors.orange,
    severo: '#EF4444',
  };

  const activeSymptoms = s.sintomas_associados
    ? (Object.entries(s.sintomas_associados) as [string, boolean | string[]][])
        .filter(([k, v]) => k !== 'outros' && v === true)
        .map(([k]) => k)
    : [];

  return (
    <Animated.View entering={FadeInUp.delay(100)}>
      {/* Summary banner */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryLabel}>Resumo da análise</Text>
        <Text style={styles.summaryText}>
          {s.resumo ?? transcript.slice(0, 100)}
        </Text>
      </View>

      {/* Pain intensity */}
      {s.intensidade_dor !== null && (
        <Card className="mb-4">
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.iconBox, { backgroundColor: `${intensityColor()}20` }]}>
              <Zap size={20} color={intensityColor()} fill={intensityColor()} />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.cardLabel}>Intensidade da dor</Text>
              <Text style={[styles.cardValue, { color: intensityColor() }]}>
                {s.intensidade_dor}/10
                {s.nivel_incapacidade && (
                  <Text
                    style={{
                      fontSize: 14,
                      color: incapacidadeColors[s.nivel_incapacidade],
                      fontFamily: 'Epilogue_600SemiBold',
                    }}
                  >
                    {'  ·  '}{s.nivel_incapacidade}
                  </Text>
                )}
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Location */}
      {(s.localizacao || s.lado) && (
        <Card className="mb-4">
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.iconBox, { backgroundColor: `${Colors.accent}20` }]}>
              <MapPin size={20} color={Colors.accent} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.cardLabel}>Localização</Text>
              <Text style={[styles.cardValue, { fontSize: 17, textTransform: 'capitalize' }]}>
                {[s.localizacao, s.lado].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>
        </Card>
      )}

      {/* Symptoms & quality */}
      {(activeSymptoms.length > 0 || (s.qualidade_dor?.length ?? 0) > 0) && (
        <Card className="mb-4">
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={[styles.iconBox, { backgroundColor: `${Colors.purple}20` }]}>
              <Thermometer size={20} color={Colors.purple} />
            </View>
            <Text style={[styles.cardLabel, { marginLeft: 12 }]}>Sintomas</Text>
          </View>
          <View style={styles.tagRow}>
            {s.qualidade_dor?.map((q) => (
              <View key={q} style={[styles.tag, { backgroundColor: `${Colors.purple}20` }]}>
                <Text style={[styles.tagText, { color: Colors.purple }]}>{q}</Text>
              </View>
            ))}
            {activeSymptoms.map((sym) => (
              <View key={sym} style={[styles.tag, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                <Text style={[styles.tagText, { color: '#EF4444' }]}>{sym}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Medications */}
      {(s.medicamentos_tomados?.length ?? 0) > 0 && (
        <Card className="mb-4">
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={[styles.iconBox, { backgroundColor: `${Colors.orange}20` }]}>
              <Pill size={20} color={Colors.orange} />
            </View>
            <Text style={[styles.cardLabel, { marginLeft: 12 }]}>Medicamentos</Text>
          </View>
          {s.medicamentos_tomados.map((m) => (
            <Text key={m} style={styles.listItem}>• {m}</Text>
          ))}
        </Card>
      )}

      {/* Triggers */}
      {(s.fatores_desencadeantes?.length ?? 0) > 0 && (
        <Card className="mb-4">
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
              <AlertTriangle size={20} color="#EF4444" />
            </View>
            <Text style={[styles.cardLabel, { marginLeft: 12 }]}>Fatores desencadeantes</Text>
          </View>
          {s.fatores_desencadeantes.map((f) => (
            <Text key={f} style={styles.listItem}>• {f}</Text>
          ))}
        </Card>
      )}

      {/* Raw transcript */}
      <Card className="mb-6">
        <Text style={[styles.cardLabel, { marginBottom: 6 }]}>Transcrição</Text>
        <Text style={styles.transcriptText}>{transcript}</Text>
      </Card>
    </Animated.View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────
export default function RecordCrisisScreen() {
  const [step, setStep] = useState<Step>('input');
  const [text, setText] = useState('');
  const [recordSecs, setRecordSecs] = useState(0);
  const [result, setResult] = useState<MigraineRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startRecording = async () => {
    setError(null);
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) { setError('Permissão de microfone negada.'); return; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordSecs(0);
      setStep('recording');
      timerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
    } catch {
      setError('Não foi possível iniciar a gravação.');
    }
  };

  const stopAndProcess = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('URI de áudio inválido.');
      setStep('processing');
      const data = await processAudio(uri);
      setResult(data);
      setStep('result');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao processar o áudio.');
      setStep('input');
    }
  };

  const submitText = async () => {
    if (!text.trim()) return;
    setError(null);
    setStep('processing');
    try {
      const data = await processText(text.trim());
      setResult(data);
      setStep('result');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao processar o texto.');
      setStep('input');
    }
  };

  const handleRetry = () => {
    setResult(null);
    setError(null);
    setText('');
    setStep('input');
  };

  const handleConfirm = () => {
    setStep('confirmed');
    setTimeout(() => router.back(), 1800);
  };

  const fmtSecs = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Success screen ──────────────────────────────────────────────────
  if (step === 'confirmed') {
    return (
      <View style={styles.centeredFull}>
        <Animated.View entering={ZoomIn} style={styles.successIcon}>
          <Check size={36} color="#10B981" />
        </Animated.View>
        <Text style={styles.successTitle}>Crise registrada!</Text>
        <Text style={styles.successSub}>
          {result?.structured.resumo ?? 'Registro salvo com sucesso.'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 48, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <X size={24} color={Colors.muted} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Registrar crise</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Processing ── */}
        {step === 'processing' && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.processingText}>Analisando sua crise...</Text>
            <Text style={styles.processingSubText}>
              A IA está extraindo os dados do seu relato
            </Text>
          </View>
        )}

        {/* ── Input / Recording ── */}
        {(step === 'input' || step === 'recording') && (
          <Animated.View entering={FadeIn}>
            <Text style={styles.inputTitle}>Descreva sua crise</Text>
            <Text style={styles.inputSub}>
              {step === 'recording'
                ? `Gravando  ${fmtSecs(recordSecs)}`
                : 'Use o microfone ou escreva como está se sentindo'}
            </Text>

            {/* Mic area */}
            <View style={styles.micArea}>
              {step === 'recording' ? (
                <PulsingMic onStop={stopAndProcess} />
              ) : (
                <TouchableOpacity onPress={startRecording} style={styles.micButton}>
                  <Mic size={32} color="white" />
                </TouchableOpacity>
              )}
              <Text style={styles.micHint}>
                {step === 'recording' ? 'Toque para parar' : 'Toque para gravar'}
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou escreva</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Text area */}
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Ex: Dor latejante no lado esquerdo, intensidade 7, com náusea..."
              placeholderTextColor={Colors.muted}
              multiline
              style={styles.textArea}
              editable={step !== 'recording'}
            />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              onPress={submitText}
              disabled={!text.trim() || step === 'recording'}
              style={[
                styles.submitBtn,
                (!text.trim() || step === 'recording') && styles.submitBtnDisabled,
              ]}
            >
              <Send size={18} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Analisar texto</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── Result ── */}
        {step === 'result' && result && (
          <View>
            <ResultCard result={result} />

            <TouchableOpacity onPress={handleConfirm} style={styles.confirmBtn}>
              <Check size={20} color="white" />
              <Text style={styles.confirmBtnText}>Confirmar registro</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRetry} style={styles.retryBtn}>
              <RotateCcw size={18} color={Colors.muted} />
              <Text style={styles.retryBtnText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centeredFull: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgDark,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 32,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Epilogue_700Bold',
  },

  // Input step
  inputTitle: {
    color: 'white',
    fontSize: 24,
    fontFamily: 'Epilogue_700Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  inputSub: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'Epilogue_400Regular',
    textAlign: 'center',
    marginBottom: 40,
  },
  micArea: {
    alignItems: 'center',
    marginBottom: 36,
  },
  micWrapper: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EF4444',
  },
  micButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  micButtonRecording: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  micHint: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'Epilogue_400Regular',
    marginTop: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(139,163,167,0.18)',
  },
  dividerText: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'Epilogue_400Regular',
    marginHorizontal: 12,
  },
  textArea: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(139,163,167,0.18)',
    borderRadius: 16,
    padding: 16,
    color: 'white',
    fontFamily: 'Epilogue_400Regular',
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontFamily: 'Epilogue_400Regular',
    textAlign: 'center',
    marginBottom: 12,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 17,
    borderRadius: 26,
  },
  submitBtnDisabled: {
    backgroundColor: '#1E293B',
  },
  submitBtnText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Epilogue_700Bold',
  },

  // Processing
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  processingText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Epilogue_700Bold',
    marginTop: 24,
  },
  processingSubText: {
    color: Colors.muted,
    fontSize: 13,
    fontFamily: 'Epilogue_400Regular',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // Success
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
    paddingHorizontal: 32,
    lineHeight: 22,
  },

  // Result card
  summaryBox: {
    backgroundColor: `${Colors.accent}18`,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${Colors.accent}35`,
  },
  summaryLabel: {
    color: Colors.accent,
    fontSize: 11,
    fontFamily: 'Epilogue_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  summaryText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Epilogue_600SemiBold',
    lineHeight: 24,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    color: Colors.muted,
    fontSize: 11,
    fontFamily: 'Epilogue_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  cardValue: {
    color: 'white',
    fontSize: 22,
    fontFamily: 'Epilogue_700Bold',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Epilogue_600SemiBold',
    textTransform: 'capitalize',
  },
  listItem: {
    color: Colors.soft,
    fontSize: 14,
    fontFamily: 'Epilogue_400Regular',
    marginTop: 5,
    textTransform: 'capitalize',
  },
  transcriptText: {
    color: Colors.muted,
    fontFamily: 'Epilogue_400Regular',
    fontSize: 13,
    lineHeight: 21,
  },

  // Action buttons
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 18,
    borderRadius: 28,
    marginBottom: 12,
    gap: 8,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmBtnText: {
    color: 'white',
    fontSize: 17,
    fontFamily: 'Epilogue_700Bold',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 16,
    borderRadius: 28,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(139,163,167,0.15)',
  },
  retryBtnText: {
    color: Colors.muted,
    fontSize: 15,
    fontFamily: 'Epilogue_600SemiBold',
  },
});
