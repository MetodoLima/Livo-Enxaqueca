import type { MigraineStructured } from './api';

// Extraído de onDeviceLlm.ts para ser compartilhado com o runner de benchmark
// (services/onDeviceBenchmarkRunner.ts) — ambos precisam do mesmo prompt e da
// mesma tolerância de parsing para que a comparação entre modelos reflita o que
// roda em produção, não uma versão simplificada.

// Modelos pequenos (1B) seguem instrução implícita muito pior que modelos maiores —
// por isso o prompt é explícito sobre a política de extração (não deduzir o que não
// foi dito) e inclui um exemplo curto, em vez de só descrever o formato do JSON.
export const SYSTEM_PROMPT = `Você é um assistente médico que extrai dados estruturados de relatos de crise de enxaqueca.

Regras:
- Preencha cada campo APENAS com o que estiver explicitamente dito no relato. Não invente nem deduza informações que não foram mencionadas.
- Sintomas booleanos (nausea, vomito, fotofobia, fonofobia, aura, tontura): use true somente se o sintoma for citado; caso contrário, false.
- Campos de lista (qualidade_dor, medicamentos_tomados, fatores_desencadeantes, outros) sem informação devem ser uma lista vazia [] — nunca a palavra "null" como texto.
- Campos sem informação (localizacao, lado, inicio_estimado, nivel_incapacidade, resumo, intensidade_dor) devem usar o valor JSON null — nunca a palavra "null" como texto.

Responda APENAS com um JSON válido, sem nenhum texto antes ou depois, no formato:
{"intensidade_dor": number|null, "localizacao": "frontal"|"temporal"|"occipital"|"difusa"|null, "lado": "esquerdo"|"direito"|"bilateral"|null, "qualidade_dor": string[], "sintomas_associados": {"nausea": boolean, "vomito": boolean, "fotofobia": boolean, "fonofobia": boolean, "aura": boolean, "tontura": boolean, "outros": string[]}, "inicio_estimado": "<1h"|"1-4h"|">4h"|null, "medicamentos_tomados": string[], "fatores_desencadeantes": string[], "nivel_incapacidade": "leve"|"moderado"|"severo"|null, "resumo": string|null}

Exemplo — relato: "Tive uma crise com bastante náusea."
Resposta: {"intensidade_dor": null, "localizacao": null, "lado": null, "qualidade_dor": [], "sintomas_associados": {"nausea": true, "vomito": false, "fotofobia": false, "fonofobia": false, "aura": false, "tontura": false, "outros": []}, "inicio_estimado": null, "medicamentos_tomados": [], "fatores_desencadeantes": [], "nivel_incapacidade": null, "resumo": "Crise com náusea."}`;

export const STOP_WORDS = ['<end_of_turn>', '<eos>'];

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
export function sanitizeStructured(raw: any): MigraineStructured {
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

export function fallbackStructured(): MigraineStructured {
  return sanitizeStructured({});
}

// Mesma estratégia de 3 tentativas do backend (livo-ai/backend/main.py):
// o modelo às vezes cerca o JSON com texto solto ou blocos de markdown.
export function parseStructuredJson(raw: string): { data: MigraineStructured; ok: boolean } {
  const attempts = [
    () => JSON.parse(raw),
    () => JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)),
    () => JSON.parse(raw.replace(/```json|```/g, '').trim()),
  ];

  for (const attempt of attempts) {
    try {
      return { data: sanitizeStructured(attempt()), ok: true };
    } catch {
      // tenta a próxima estratégia
    }
  }

  return { data: fallbackStructured(), ok: false };
}
