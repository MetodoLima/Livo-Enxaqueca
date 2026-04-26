import Constants from 'expo-constants';

// In Expo Go, hostUri points to the dev server host — use it to reach the backend on the same machine.
// Falls back to 10.0.2.2 (Android emulator → host) or change to your machine's LAN IP for physical devices.
const devHost =
  typeof Constants.expoConfig?.hostUri === 'string'
    ? Constants.expoConfig.hostUri.split(':')[0]
    : '10.0.2.2';

export const API_BASE_URL = `http://${devHost}:8000`;

export interface SintomasAssociados {
  nausea: boolean;
  vomito: boolean;
  fotofobia: boolean;
  fonofobia: boolean;
  aura: boolean;
  tontura: boolean;
  outros: string[];
}

export interface MigraineStructured {
  intensidade_dor: number | null;
  localizacao: 'frontal' | 'temporal' | 'occipital' | 'difusa' | null;
  lado: 'esquerdo' | 'direito' | 'bilateral' | null;
  qualidade_dor: string[];
  sintomas_associados: SintomasAssociados;
  inicio_estimado: '<1h' | '1-4h' | '>4h' | null;
  medicamentos_tomados: string[];
  fatores_desencadeantes: string[];
  nivel_incapacidade: 'leve' | 'moderado' | 'severo' | null;
  resumo: string | null;
}

export interface MigraineRecord {
  timestamp: string;
  transcript: string;
  structured: MigraineStructured;
}

export async function processAudio(audioUri: string): Promise<MigraineRecord> {
  const formData = new FormData();
  formData.append('file', {
    uri: audioUri,
    name: 'audio.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);

  const response = await fetch(`${API_BASE_URL}/api/process-audio`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const msg = await response.text().catch(() => String(response.status));
    throw new Error(`Erro ao processar áudio: ${msg}`);
  }

  return response.json();
}

export async function processText(text: string): Promise<MigraineRecord> {
  const response = await fetch(`${API_BASE_URL}/api/process-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const msg = await response.text().catch(() => String(response.status));
    throw new Error(`Erro ao processar texto: ${msg}`);
  }

  return response.json();
}
