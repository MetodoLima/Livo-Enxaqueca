import { Directory, File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';
import { initWhisper, type WhisperContext } from 'whisper.rn/index';

// Modelo "base" do whisper.cpp (~148MB), publicado por ggerganov. Bom equilíbrio
// precisão/velocidade para um celular; troque por ggml-small.bin (~466MB) se
// a transcrição em pt-BR ficar fraca demais e o aparelho aguentar.
const MODEL_URL = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin';
const MODEL_FILENAME = 'ggml-base.bin';

const modelsDir = new Directory(Paths.document, 'models');
const modelFile = new File(modelsDir, MODEL_FILENAME);

let context: WhisperContext | null = null;

export function isModelDownloaded(): boolean {
  return modelFile.exists;
}

export async function downloadModel(onProgress?: (fraction: number) => void): Promise<void> {
  if (!modelsDir.exists) {
    modelsDir.create({ intermediates: true });
  }

  const resumable = createDownloadResumable(MODEL_URL, modelFile.uri, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
    if (totalBytesExpectedToWrite > 0) {
      onProgress?.(totalBytesWritten / totalBytesExpectedToWrite);
    }
  });
  await resumable.downloadAsync();
}

export async function loadModel(): Promise<void> {
  if (context) return;
  if (!isModelDownloaded()) {
    throw new Error('Modelo não baixado. Chame downloadModel() primeiro.');
  }

  context = await initWhisper({ filePath: modelFile.uri });
}

export async function unloadModel(): Promise<void> {
  await context?.release();
  context = null;
}

// whisper.rn (whisper.cpp) só decodifica WAV PCM 16-bit mono 16kHz — não lê m4a/AAC
// diretamente. Por isso o fluxo on-device grava com services/onDeviceRecorder.ts
// (captura PCM cru e monta o WAV), em vez de reaproveitar o gravador m4a usado pelo
// fluxo de backend em services/api.ts.
export async function transcribe(wavUri: string, language = 'pt'): Promise<string> {
  if (!context) {
    throw new Error('Modelo on-device não carregado. Chame loadModel() primeiro.');
  }

  const { promise } = context.transcribe(wavUri, { language });
  const { result } = await promise;
  return result.trim();
}
