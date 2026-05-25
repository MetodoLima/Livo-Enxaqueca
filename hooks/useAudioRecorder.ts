import { useEffect, useRef, useState } from 'react';

// Loaded once at module init — never changes, so the conditional hook call below is safe
let _useExpoAudioRecorder: any;
let _RecordingPresets: any;
let _requestRecordingPermissionsAsync: any;
let _setAudioModeAsync: any;

try {
  const m = require('expo-audio');
  _useExpoAudioRecorder = m.useAudioRecorder;
  _RecordingPresets = m.RecordingPresets;
  _requestRecordingPermissionsAsync = m.requestRecordingPermissionsAsync;
  _setAudioModeAsync = m.setAudioModeAsync;
} catch {}

export const audioAvailable = !!_useExpoAudioRecorder;

export function useAudioRecorder() {
  const recorder = audioAvailable
    ? _useExpoAudioRecorder(_RecordingPresets.HIGH_QUALITY)
    : null;

  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startRecording = async (): Promise<boolean> => {
    if (!recorder) return false;
    setError(null);
    try {
      const { granted } = await _requestRecordingPermissionsAsync();
      if (!granted) {
        setError('Permissão de microfone negada.');
        return false;
      }
      try { await _setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true }); } catch {}
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecordSecs(0);
      setIsRecording(true);
      timerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
      return true;
    } catch {
      setError('Não foi possível iniciar a gravação.');
      return false;
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    if (!recorder) return null;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    try {
      await recorder.stop();
      return recorder.uri ?? null;
    } catch {
      setError('Erro ao parar gravação.');
      return null;
    }
  };

  return {
    isRecording,
    recordSecs,
    error,
    clearError: () => setError(null),
    startRecording,
    stopRecording,
  };
}
