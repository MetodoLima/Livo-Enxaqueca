import { useEffect, useRef, useState } from 'react';
import { onDeviceAvailable } from '@/services/onDeviceComplement';

// Loaded once at module init — mesmo padrão de hooks/useAudioRecorder.ts
let _requestRecordingPermissionsAsync: any;
let _startRecording: (() => void) | undefined;
let _stopRecording: (() => Promise<string>) | undefined;

try {
  const audio = require('expo-audio');
  _requestRecordingPermissionsAsync = audio.requestRecordingPermissionsAsync;
  const recorder = require('@/services/onDeviceRecorder');
  _startRecording = recorder.startRecording;
  _stopRecording = recorder.stopRecording;
} catch {}

// Grava PCM cru (16kHz mono) via services/onDeviceRecorder.ts, para consumo pelo
// whisper.rn — não usa o gravador m4a de hooks/useAudioRecorder.ts (fluxo de backend).
// Mesma interface de retorno de useAudioRecorder, para os dois serem intercambiáveis.
export function useOnDeviceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startRecording = async (): Promise<boolean> => {
    if (!onDeviceAvailable || !_startRecording) return false;
    setError(null);
    try {
      const { granted } = await _requestRecordingPermissionsAsync();
      if (!granted) {
        setError('Permissão de microfone negada.');
        return false;
      }
      _startRecording();
      setRecordSecs(0);
      setIsRecording(true);
      timerRef.current = setInterval(() => setRecordSecs((s) => s + 1), 1000);
      return true;
    } catch {
      setError('Não foi possível iniciar a gravação local.');
      return false;
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    if (!_stopRecording) return null;
    try {
      return await _stopRecording();
    } catch {
      setError('Erro ao parar a gravação local.');
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
