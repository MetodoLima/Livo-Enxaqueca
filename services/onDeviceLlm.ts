import { Directory, File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';
import { initLlama, type LlamaContext } from 'llama.rn';
import type { MigraineStructured } from './api';
import { SYSTEM_PROMPT, STOP_WORDS, parseStructuredJson } from './migraineExtraction';

// Quantização Q4_K_M do Gemma 3 1B instruct (~770MB), publicada por bartowski.
// Trocado do Gemma 2 2B para testar se um modelo menor reduz a latência de extração
// no aparelho. Mesma família (Gemma) do modelo anterior — chat template e tokens
// especiais (<end_of_turn>, <eos>) continuam os mesmos, sem precisar mudar o prompt.
const MODEL_URL =
  'https://huggingface.co/bartowski/google_gemma-3-1b-it-GGUF/resolve/main/google_gemma-3-1b-it-Q4_K_M.gguf';
const MODEL_FILENAME = 'google_gemma-3-1b-it-Q4_K_M.gguf';

const modelsDir = new Directory(Paths.document, 'models');
const modelFile = new File(modelsDir, MODEL_FILENAME);

let context: LlamaContext | null = null;

export function isModelDownloaded(): boolean {
  return modelFile.exists;
}

// A API nova (File.downloadFileAsync) não expõe progresso; usamos a legacy
// (createDownloadResumable) só para o download, que reporta bytes escritos/esperados.
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

  context = await initLlama({
    model: modelFile.uri,
    use_mlock: true,
    n_ctx: 2048,
    n_gpu_layers: 99, // ignorado sem GPU/OpenCL compatível; llama.rn cai para CPU
  });
}

export async function unloadModel(): Promise<void> {
  await context?.release();
  context = null;
}

export async function extractStructuredFromText(transcript: string): Promise<MigraineStructured> {
  if (!context) {
    throw new Error('Modelo on-device não carregado. Chame loadModel() primeiro.');
  }

  const result = await context.completion({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: transcript },
    ],
    n_predict: 512,
    temperature: 0.1,
    stop: STOP_WORDS,
  });

  return parseStructuredJson(result.text).data;
}
