import type { MigraineRecord } from './api';

// Espelha o padrão defensivo de hooks/useAudioRecorder.ts: em web (`npm run web`) ou
// Expo Go, esses módulos nativos não existem, então isolamos os requires para não
// derrubar o bundle inteiro — o toggle de "IA local" some quando algo aqui falha.
// A gravação em si (services/onDeviceRecorder.ts) é responsabilidade de
// hooks/useOnDeviceRecorder.ts, não deste orquestrador.
let _stt: typeof import('./onDeviceStt') | null = null;
let _llm: typeof import('./onDeviceLlm') | null = null;

try {
  _stt = require('./onDeviceStt');
  _llm = require('./onDeviceLlm');
  require('./onDeviceRecorder');
} catch {}

export const onDeviceAvailable = !!(_stt && _llm);

export type OnDeviceStage =
  | 'downloading-stt'
  | 'downloading-llm'
  | 'loading'
  | 'transcribing'
  | 'extracting';

// Tamanho combinado aproximado dos dois modelos (whisper ggml-base + gemma 3 1b Q4_K_M).
export const MODELS_TOTAL_SIZE_LABEL = '~920MB';

export function areModelsDownloaded(): boolean {
  if (!_stt || !_llm) return false;
  return _stt.isModelDownloaded() && _llm.isModelDownloaded();
}

export async function ensureModelsDownloaded(
  onStage?: (stage: OnDeviceStage, progress?: number) => void,
): Promise<void> {
  if (!_stt || !_llm) throw new Error('Módulos on-device indisponíveis neste build.');
  if (!_stt.isModelDownloaded()) {
    onStage?.('downloading-stt', 0);
    await _stt.downloadModel((fraction) => onStage?.('downloading-stt', fraction));
  }
  if (!_llm.isModelDownloaded()) {
    onStage?.('downloading-llm', 0);
    await _llm.downloadModel((fraction) => onStage?.('downloading-llm', fraction));
  }
}

export async function ensureModelsLoaded(onStage?: (stage: OnDeviceStage) => void): Promise<void> {
  if (!_stt || !_llm) throw new Error('Módulos on-device indisponíveis neste build.');
  onStage?.('loading');
  await _stt.loadModel();
  await _llm.loadModel();
}

export async function transcribeAndComplement(
  wavUri: string,
  onStage?: (stage: OnDeviceStage) => void,
): Promise<MigraineRecord> {
  if (!_stt || !_llm) throw new Error('Módulos on-device indisponíveis neste build.');

  onStage?.('transcribing');
  const transcript = await _stt.transcribe(wavUri);

  onStage?.('extracting');
  const structured = await _llm.extractStructuredFromText(transcript);

  return { timestamp: new Date().toISOString(), transcript, structured };
}

export async function complementFromTextOnDevice(text: string): Promise<MigraineRecord> {
  if (!_llm) throw new Error('Módulo on-device indisponível neste build.');

  const structured = await _llm.extractStructuredFromText(text);
  return { timestamp: new Date().toISOString(), transcript: text, structured };
}
