import { Directory, File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';
import { initLlama, type LlamaContext } from 'llama.rn';
import type { MigraineStructured } from './api';

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

const STOP_WORDS = ['<end_of_turn>', '<eos>'];

// Modelos pequenos (1B) seguem instrução implícita muito pior que modelos maiores —
// por isso o prompt é explícito sobre a política de extração (não deduzir o que não
// foi dito) e inclui um exemplo curto, em vez de só descrever o formato do JSON.
const SYSTEM_PROMPT = `Você é um assistente médico que extrai dados estruturados de relatos de crise de enxaqueca.

Regras:
- Preencha cada campo APENAS com o que estiver explicitamente dito no relato. Não invente nem deduza informações que não foram mencionadas.
- Sintomas booleanos (nausea, vomito, fotofobia, fonofobia, aura, tontura): use true somente se o sintoma for citado; caso contrário, false.
- Campos de lista (qualidade_dor, medicamentos_tomados, fatores_desencadeantes, outros) sem informação devem ser uma lista vazia [] — nunca a palavra "null" como texto.
- Campos sem informação (localizacao, lado, inicio_estimado, nivel_incapacidade, resumo, intensidade_dor) devem usar o valor JSON null — nunca a palavra "null" como texto.

Responda APENAS com um JSON válido, sem nenhum texto antes ou depois, no formato:
{"intensidade_dor": number|null, "localizacao": "frontal"|"temporal"|"occipital"|"difusa"|null, "lado": "esquerdo"|"direito"|"bilateral"|null, "qualidade_dor": string[], "sintomas_associados": {"nausea": boolean, "vomito": boolean, "fotofobia": boolean, "fonofobia": boolean, "aura": boolean, "tontura": boolean, "outros": string[]}, "inicio_estimado": "<1h"|"1-4h"|">4h"|null, "medicamentos_tomados": string[], "fatores_desencadeantes": string[], "nivel_incapacidade": "leve"|"moderado"|"severo"|null, "resumo": string|null}

Exemplo — relato: "Tive uma crise com bastante náusea."
Resposta: {"intensidade_dor": null, "localizacao": null, "lado": null, "qualidade_dor": [], "sintomas_associados": {"nausea": true, "vomito": false, "fotofobia": false, "fonofobia": false, "aura": false, "tontura": false, "outros": []}, "inicio_estimado": null, "medicamentos_tomados": [], "fatores_desencadeantes": [], "nivel_incapacidade": null, "resumo": "Crise com náusea."}`;

const ENUM_LOCALIZACAO = ['frontal', 'temporal', 'occipital', 'difusa'] as const;
const ENUM_LADO = ['esquerdo', 'direito', 'bilateral'] as const;
const ENUM_INICIO = ['<1h', '1-4h', '>4h'] as const;
const ENUM_NIVEL = ['leve', 'moderado', 'severo'] as const;

// Modelos pequenos às vezes escrevem a string "null" (às vezes dentro de um array,
// ex. ["null"]) em vez do valor JSON null ou de uma lista vazia. Sem essa checagem,
// código que assume o tipo declarado (string[], boolean, etc.) se comporta mal —
// ex.: [...'null'] vira ['n','u','l','l'] porque strings são iteráveis em JS.
function isNullish(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.trim().toLowerCase() === 'null');
}

function toNullableEnum<T extends string>(v: unknown, allowed: readonly T[]): T | null {
  if (typeof v !== 'string') return null;
  const normalized = v.trim().toLowerCase();
  return (allowed as readonly string[]).includes(normalized) ? (normalized as T) : null;
}

function toNullableNumber(v: unknown): number | null {
  if (isNullish(v)) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function toNullableText(v: unknown): string | null {
  if (isNullish(v)) return null;
  return typeof v === 'string' ? v.trim() : null;
}

function toBool(v: unknown): boolean {
  return v === true || v === 'true';
}

function toStringArray(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.filter((x): x is string => typeof x === 'string' && !isNullish(x)).map((x) => x.trim());
  }
  if (typeof v === 'string' && !isNullish(v) && v.trim() !== '') {
    return [v.trim()];
  }
  return [];
}

// Reconstrói o objeto campo a campo em vez de confiar no shape que veio do JSON.parse —
// o `MigraineStructured` do JSON.parse é `any` por baixo dos panos, então nada garante
// em runtime que o modelo respeitou os tipos declarados no prompt.
function sanitizeStructured(raw: any): MigraineStructured {
  const s = raw?.sintomas_associados ?? {};
  return {
    intensidade_dor: toNullableNumber(raw?.intensidade_dor),
    localizacao: toNullableEnum(raw?.localizacao, ENUM_LOCALIZACAO),
    lado: toNullableEnum(raw?.lado, ENUM_LADO),
    qualidade_dor: toStringArray(raw?.qualidade_dor),
    sintomas_associados: {
      nausea: toBool(s.nausea),
      vomito: toBool(s.vomito),
      fotofobia: toBool(s.fotofobia),
      fonofobia: toBool(s.fonofobia),
      aura: toBool(s.aura),
      tontura: toBool(s.tontura),
      outros: toStringArray(s.outros),
    },
    inicio_estimado: toNullableEnum(raw?.inicio_estimado, ENUM_INICIO),
    medicamentos_tomados: toStringArray(raw?.medicamentos_tomados),
    fatores_desencadeantes: toStringArray(raw?.fatores_desencadeantes),
    nivel_incapacidade: toNullableEnum(raw?.nivel_incapacidade, ENUM_NIVEL),
    resumo: toNullableText(raw?.resumo),
  };
}

function fallbackStructured(): MigraineStructured {
  return {
    intensidade_dor: null,
    localizacao: null,
    lado: null,
    qualidade_dor: [],
    sintomas_associados: {
      nausea: false,
      vomito: false,
      fotofobia: false,
      fonofobia: false,
      aura: false,
      tontura: false,
      outros: [],
    },
    inicio_estimado: null,
    medicamentos_tomados: [],
    fatores_desencadeantes: [],
    nivel_incapacidade: null,
    resumo: null,
  };
}

// Mesma estratégia de 3 tentativas do backend (livo-ai/backend/main.py):
// o modelo às vezes cerca o JSON com texto solto ou blocos de markdown.
function parseStructuredJson(raw: string): MigraineStructured {
  const attempts = [
    () => JSON.parse(raw),
    () => JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)),
    () => JSON.parse(raw.replace(/```json|```/g, '').trim()),
  ];

  for (const attempt of attempts) {
    try {
      return sanitizeStructured(attempt());
    } catch {
      // tenta a próxima estratégia
    }
  }

  return fallbackStructured();
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

  return parseStructuredJson(result.text);
}
