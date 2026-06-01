import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Web sempre usa localhost. No Expo Go, hostUri aponta para o IP do dev server.
// Fallback: 10.0.2.2 (emulador Android → host).
const devHost =
  Platform.OS === 'web'
    ? 'localhost'
    : typeof Constants.expoConfig?.hostUri === 'string'
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

export interface CriseInsightRecord {
  data: string;
  intensidade?: number | null;
  localizacao?: string | null;
  lado?: string | null;
  duracao_horas?: number | null;
  sintomas: string[];
  medicamentos: string[];
  gatilhos: string[];
  nivel_incapacidade?: string | null;
  resumo?: string | null;
}

export interface QualitativeAnalysis {
  padroes: string;
  gatilhos_principais: string;
  evolucao: string;
  recomendacoes: string;
}

export async function analyzeInsights(crises: CriseInsightRecord[]): Promise<QualitativeAnalysis> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300_000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze-insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crises }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const msg = await response.text().catch(() => String(response.status));
      throw new Error(`Erro ao analisar insights: ${msg}`);
    }

    return response.json();
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Tempo esgotado. Verifique se o backend está rodando em localhost:8000.');
    }
    throw e;
  }
}

export async function complementCrisis(
  preFilled: MigraineStructured,
  audioUri?: string | null,
  text?: string | null,
): Promise<MigraineRecord> {
  const formData = new FormData();
  formData.append('pre_filled', JSON.stringify(preFilled));

  if (audioUri) {
    if (audioUri.startsWith('blob:')) {
      // Web: blob URL precisa ser convertida para Blob real
      const blobRes = await fetch(audioUri);
      const blob = await blobRes.blob();
      formData.append('file', blob, 'audio.webm');
    } else {
      // Native: extensão do FormData do React Native
      formData.append('file', {
        uri: audioUri,
        name: 'audio.m4a',
        type: 'audio/m4a',
      } as unknown as Blob);
    }
  }
  if (text) {
    formData.append('text', text);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 300_000); // 5 min

  try {
    const response = await fetch(`${API_BASE_URL}/api/complement-crisis`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const msg = await response.text().catch(() => String(response.status));
      throw new Error(`Erro ao complementar crise: ${msg}`);
    }

    return response.json();
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Tempo esgotado. Verifique se o backend está rodando em localhost:8000.');
    }
    throw e;
  }
}
