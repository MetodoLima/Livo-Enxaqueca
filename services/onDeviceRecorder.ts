import { Directory, File, Paths } from 'expo-file-system';
// @ts-ignore -- o pacote publica os tipos sob o nome antigo do módulo (react-native-live-audio-stream)
import LiveAudioStream from '@fugood/react-native-audio-pcm-stream';

// whisper.rn só decodifica WAV PCM 16-bit mono 16kHz (ver services/onDeviceStt.ts).
// Em vez de gravar em m4a/AAC (formato usado pelo fluxo de backend em services/api.ts)
// e depender de um conversor tipo ffmpeg — que não roda no celular — capturamos o
// áudio já cru nesse formato via AudioRecord (Android) / Audio Queues (iOS) e montamos
// o WAV nós mesmos.
const SAMPLE_RATE = 16000;
const CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const ANDROID_AUDIO_SOURCE_VOICE_RECOGNITION = 6;

const NodeBuffer: any = (globalThis as any).Buffer || require('safe-buffer').Buffer;

const recordingsDir = new Directory(Paths.cache, 'recordings');

let chunks: Uint8Array[] = [];
let recording = false;

function onData(base64Chunk: string): void {
  chunks.push(NodeBuffer.from(base64Chunk, 'base64'));
}

export function startRecording(): void {
  if (recording) return;

  chunks = [];
  LiveAudioStream.init({
    sampleRate: SAMPLE_RATE,
    channels: CHANNELS,
    bitsPerSample: BITS_PER_SAMPLE,
    audioSource: ANDROID_AUDIO_SOURCE_VOICE_RECOGNITION,
    wavFile: '',
  });
  LiveAudioStream.on('data', onData);
  LiveAudioStream.start();
  recording = true;
}

function buildWavHeader(dataSize: number): Uint8Array {
  const header = NodeBuffer.alloc(44);
  const byteRate = SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8);
  const blockAlign = CHANNELS * (BITS_PER_SAMPLE / 8);

  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(CHANNELS, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(BITS_PER_SAMPLE, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(dataSize, 40);

  return header;
}

export async function stopRecording(): Promise<string> {
  if (!recording) {
    throw new Error('Nenhuma gravação em andamento.');
  }

  await LiveAudioStream.stop();
  recording = false;

  const pcm = NodeBuffer.concat(chunks);
  chunks = [];
  const wav = NodeBuffer.concat([buildWavHeader(pcm.length), pcm]);

  if (!recordingsDir.exists) {
    recordingsDir.create({ intermediates: true });
  }
  const file = new File(recordingsDir, `crisis-${Date.now()}.wav`);
  file.write(new Uint8Array(wav));

  return file.uri;
}

export function isRecording(): boolean {
  return recording;
}
