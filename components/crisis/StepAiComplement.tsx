import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Mic, Send, StopCircle } from 'lucide-react-native';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import StepFooter from './StepFooter';
import { complementCrisis } from '@/services/api';
import type { CrisisRecord, AiComplement } from '@/types/crisis';
import { crisisToMigraineStructured } from '@/types/crisis';

// Only import audio functions — they'll fail gracefully if unavailable
let useAudioRecorder: any;
let RecordingPresets: any;
let requestRecordingPermissionsAsync: any;
let setAudioModeAsync: any;

try {
  const audioModule = require('expo-audio');
  useAudioRecorder = audioModule.useAudioRecorder;
  RecordingPresets = audioModule.RecordingPresets;
  requestRecordingPermissionsAsync = audioModule.requestRecordingPermissionsAsync;
  setAudioModeAsync = audioModule.setAudioModeAsync;
} catch {
  // expo-audio not available — will show text-only mode
}

interface StepAiComplementProps {
  data: CrisisRecord;
  onChange: (patch: Partial<CrisisRecord>) => void;
  onNext: () => void; // called after confirm or skip
}

// ── Pulsing mic animation ─────────────────────────────────────────────
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
      <TouchableOpacity onPress={onStop} style={styles.micBtnRecording}>
        <StopCircle size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────
type SubStep = 'idle' | 'recording' | 'processing' | 'done';

export default function StepAiComplement({ data, onChange, onNext }: StepAiComplementProps) {
  const [subStep, setSubStep] = useState<SubStep>('idle');
  const [text, setText] = useState('');
  const [recordSecs, setRecordSecs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const audioAvailable = !!useAudioRecorder;
  const recorder = audioAvailable ? useAudioRecorder(RecordingPresets.HIGH_QUALITY) : null;

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const fmtSecs = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Audio ───────────────────────────────────────────────────────────
  const startRecording = async () => {
    if (!recorder) return;
    setError(null);
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) { setError('Permissão de microfone negada.'); return; }
      try { await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true }); } catch {}
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordSecs(0);
      setSubStep('recording');
      timerRef.current = setInterval(() => setRecordSecs((s: number) => s + 1), 1000);
    } catch {
      setError('Não foi possível iniciar a gravação.');
    }
  };

  const stopAndProcess = async () => {
    if (!recorder) return;
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('URI de áudio inválido.');
      setSubStep('processing');
      const preFilled = crisisToMigraineStructured(data);
      const result = await complementCrisis(preFilled, uri, null);
      const complement: AiComplement = { audioUri: uri, textNote: null, aiResult: result };
      onChange({ aiComplement: complement });
      setSubStep('done');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao processar o áudio.');
      setSubStep('idle');
    }
  };

  // ── Text ────────────────────────────────────────────────────────────
  const submitText = async () => {
    if (!text.trim()) return;
    setError(null);
    setSubStep('processing');
    try {
      const preFilled = crisisToMigraineStructured(data);
      const result = await complementCrisis(preFilled, null, text.trim());
      const complement: AiComplement = { audioUri: null, textNote: text.trim(), aiResult: result };
      onChange({ aiComplement: complement });
      setSubStep('done');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao processar o texto.');
      setSubStep('idle');
    }
  };

  // ── Processing state ────────────────────────────────────────────────
  if (subStep === 'processing') {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.processingText}>Analisando...</Text>
          <Text style={styles.processingSubText}>
            A IA está extraindo os dados do seu relato
          </Text>
        </View>
      </View>
    );
  }

  // ── Done state ──────────────────────────────────────────────────────
  if (subStep === 'done') {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeInUp.duration(400)} style={styles.centerContent}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>✅</Text>
          <Text style={styles.doneTitle}>Detalhes adicionados!</Text>
          {data.aiComplement?.aiResult?.structured.resumo && (
            <Text style={styles.doneSummary}>
              {data.aiComplement.aiResult.structured.resumo}
            </Text>
          )}
        </Animated.View>
        <StepFooter
          onNext={onNext}
          nextLabel="Finalizar registro"
        />
      </View>
    );
  }

  // ── Idle / Recording state ──────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
        <Text style={styles.title}>Mais detalhes?</Text>
        {subStep === 'recording' && (
          <Text style={styles.subtitle}>
            {`Gravando  ${fmtSecs(recordSecs)}`}
          </Text>
        )}

        {/* Mic area */}
        {audioAvailable && (
          <View style={styles.micArea}>
            {subStep === 'recording' ? (
              <PulsingMic onStop={stopAndProcess} />
            ) : (
              <TouchableOpacity onPress={startRecording} style={styles.micBtn}>
                <Mic size={32} color="white" />
              </TouchableOpacity>
            )}
            <Text style={styles.micHint}>
              {subStep === 'recording' ? 'Toque para parar' : 'Toque para gravar'}
            </Text>
          </View>
        )}

        {/* Divider */}
        {audioAvailable && (
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou escreva</Text>
            <View style={styles.dividerLine} />
          </View>
        )}

        {/* Text input */}
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Ex: Acordei com dor, tomei ibuprofeno, estresse no trabalho..."
          placeholderTextColor={Colors.muted}
          multiline
          style={styles.textArea}
          editable={subStep !== 'recording'}
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Send text button */}
        {text.trim().length > 0 && subStep !== 'recording' && (
          <TouchableOpacity onPress={submitText} style={styles.sendBtn}>
            <Send size={18} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.sendBtnText}>Analisar texto</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      <StepFooter
        onNext={onNext}
        nextLabel="Finalizar registro"
        showSkip={subStep === 'idle'}
        onSkip={onNext}
        skipLabel="Pular"
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
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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

  // Mic
  micArea: {
    alignItems: 'center',
    marginBottom: 28,
  },
  micWrapper: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF4444',
  },
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  micBtnRecording: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micHint: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'Epilogue_400Regular',
    marginTop: 12,
  },

  // Divider
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

  // Text
  textArea: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(139,163,167,0.18)',
    borderRadius: 16,
    padding: 16,
    color: 'white',
    fontFamily: 'Epilogue_400Regular',
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontFamily: 'Epilogue_400Regular',
    textAlign: 'center',
    marginBottom: 12,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 15,
    borderRadius: 14,
  },
  sendBtnText: {
    color: 'white',
    fontSize: 15,
    fontFamily: 'Epilogue_700Bold',
  },

  // Processing
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

  // Done
  doneTitle: {
    color: 'white',
    fontSize: 22,
    fontFamily: 'Epilogue_700Bold',
    marginBottom: 8,
  },
  doneSummary: {
    color: Colors.muted,
    fontSize: 14,
    fontFamily: 'Epilogue_400Regular',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 22,
  },
});
