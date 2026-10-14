import { useState } from 'react';
import { useOnDeviceRecorder } from './useOnDeviceRecorder';
import { ensureSttModelReady, sttAvailable, transcribeOnly } from '@/services/onDeviceComplement';

// Ditado por voz on-device simples: grava com useOnDeviceRecorder e transcreve com
// o whisper local (services/onDeviceStt.ts via onDeviceComplement.ts), sem extração
// estruturada por LLM. Para o fluxo completo (transcrição + extração), ver
// useCrisisAiComplement.ts.
export function useVoiceToText() {
  const { isRecording, recordSecs, error: micError, clearError, startRecording, stopRecording } =
    useOnDeviceRecorder();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const start = async (): Promise<boolean> => {
    setTranscribeError(null);
    clearError();
    return startRecording();
  };

  const stopAndTranscribe = async (): Promise<string | null> => {
    setTranscribeError(null);
    try {
      const wavUri = await stopRecording();
      if (!wavUri) throw new Error('Não foi possível capturar o áudio.');

      setIsTranscribing(true);
      await ensureSttModelReady((fraction) => setDownloadProgress(fraction));
      setDownloadProgress(null);

      const transcript = await transcribeOnly(wavUri);
      if (!transcript) throw new Error('Não entendi o áudio. Tente novamente.');
      return transcript;
    } catch (e) {
      setTranscribeError(e instanceof Error ? e.message : 'Erro ao transcrever o áudio.');
      return null;
    } finally {
      setIsTranscribing(false);
      setDownloadProgress(null);
    }
  };

  return {
    available: sttAvailable,
    isRecording,
    recordSecs,
    isTranscribing,
    downloadProgress,
    error: transcribeError ?? micError,
    startRecording: start,
    stopAndTranscribe,
  };
}
