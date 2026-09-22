import { useState } from 'react';
import { Alert } from 'react-native';
import { audioAvailable, useAudioRecorder } from './useAudioRecorder';
import { useOnDeviceRecorder } from './useOnDeviceRecorder';
import { complementCrisis, type MigraineRecord, type MigraineStructured } from '@/services/api';
import {
  areModelsDownloaded,
  complementFromTextOnDevice,
  ensureModelsDownloaded,
  ensureModelsLoaded,
  MODELS_TOTAL_SIZE_LABEL,
  onDeviceAvailable,
  transcribeAndComplement,
  type OnDeviceStage,
} from '@/services/onDeviceComplement';

const STAGE_LABELS: Record<OnDeviceStage, string> = {
  'downloading-stt': 'Baixando modelo de voz (Whisper, ~150MB)',
  'downloading-llm': 'Baixando modelo de linguagem (Gemma, ~770MB)',
  loading: 'Carregando modelos na memória...',
  transcribing: 'Transcrevendo áudio...',
  extracting: 'Extraindo dados estruturados...',
};

// Une o fluxo de nuvem (services/api.ts) e o fluxo on-device (services/onDeviceComplement.ts)
// atrás de uma única interface, para os componentes de complemento por IA (voz/texto)
// não duplicarem a lógica de branching. Ver components/crisis/StepAiComplement.tsx e
// app/(tabs)/crisis.tsx.
export function useCrisisAiComplement() {
  const [useLocalAi, setUseLocalAi] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stageLabel, setStageLabel] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cloudRecorder = useAudioRecorder();
  const localRecorder = useOnDeviceRecorder();
  const active = useLocalAi ? localRecorder : cloudRecorder;

  const toggleLocalAi = () => {
    if (useLocalAi) {
      setUseLocalAi(false);
      return;
    }
    if (!onDeviceAvailable) return;
    if (areModelsDownloaded()) {
      setUseLocalAi(true);
      return;
    }
    Alert.alert(
      'Baixar modelos locais?',
      `A IA local baixa dois modelos (${MODELS_TOTAL_SIZE_LABEL}) na primeira vez que for usada. Isso pode demorar e consumir dados móveis.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ativar', onPress: () => setUseLocalAi(true) },
      ],
    );
  };

  const onStage = (s: OnDeviceStage, progress?: number) => {
    const isDownload = s === 'downloading-stt' || s === 'downloading-llm';
    setDownloadProgress(isDownload ? progress ?? 0 : null);
    setStageLabel(isDownload ? `${STAGE_LABELS[s]}... ${Math.round((progress ?? 0) * 100)}%` : STAGE_LABELS[s]);
  };

  const ensureLocalModelsReady = async (): Promise<void> => {
    if (!areModelsDownloaded()) {
      await ensureModelsDownloaded(onStage);
    }
    await ensureModelsLoaded(onStage);
  };

  const stopAndProcess = async (preFilled: MigraineStructured): Promise<MigraineRecord | null> => {
    setError(null);
    try {
      if (useLocalAi) {
        const wavUri = await localRecorder.stopRecording();
        if (!wavUri) throw new Error('URI de áudio inválido.');
        setIsProcessing(true);
        await ensureLocalModelsReady();
        return await transcribeAndComplement(wavUri, onStage);
      }
      const uri = await cloudRecorder.stopRecording();
      if (!uri) throw new Error('URI de áudio inválido.');
      setIsProcessing(true);
      return await complementCrisis(preFilled, uri, null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao processar áudio.');
      return null;
    } finally {
      setIsProcessing(false);
      setStageLabel(null);
      setDownloadProgress(null);
    }
  };

  // Interrompe a gravação em andamento sem processar — usado ao fechar o painel de voz.
  const cancelRecording = async (): Promise<void> => {
    await active.stopRecording();
  };

  const submitText = async (preFilled: MigraineStructured, text: string): Promise<MigraineRecord | null> => {
    setError(null);
    setIsProcessing(true);
    try {
      if (useLocalAi) {
        await ensureLocalModelsReady();
        setStageLabel(STAGE_LABELS.extracting);
        return await complementFromTextOnDevice(text);
      }
      return await complementCrisis(preFilled, null, text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao processar texto.');
      return null;
    } finally {
      setIsProcessing(false);
      setStageLabel(null);
      setDownloadProgress(null);
    }
  };

  return {
    useLocalAi,
    toggleLocalAi,
    onDeviceAvailable,
    audioAvailable: useLocalAi ? onDeviceAvailable : audioAvailable,
    isRecording: active.isRecording,
    recordSecs: active.recordSecs,
    micError: active.error,
    startRecording: active.startRecording,
    stopAndProcess,
    cancelRecording,
    submitText,
    isProcessing,
    stageLabel,
    downloadProgress,
    error,
  };
}
