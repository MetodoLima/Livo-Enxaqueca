import type { MigraineStructured } from '@/services/api';

// Port de benchmarks/ondevice-llm/scoring.py — mesma política de "não invente" do
// prompt (migraineExtraction.ts): campos nulos/vazios no gabarito representam
// informação que não estava no relato, então o modelo deveria deixá-los
// nulos/vazios também. Omissão e alucinação pesam igual na nota.

const STRICT_FIELDS = ['intensidade_dor', 'localizacao', 'lado', 'inicio_estimado', 'nivel_incapacidade'] as const;
const BOOL_FIELDS = ['nausea', 'vomito', 'fotofobia', 'fonofobia', 'aura', 'tontura'] as const;
const LIST_FIELDS = ['qualidade_dor', 'medicamentos_tomados', 'fatores_desencadeantes'] as const;

export type CaseScores = Record<string, number> & { overall: number };

function normalizeText(s: string): string {
  return s.trim().toLowerCase();
}

function scoreStrict(expected: unknown, actual: unknown): number {
  return expected === actual ? 1 : 0;
}

// F1 por palavra-chave: cada item esperado "bate" se aparece como substring em
// algum item obtido (e vice-versa, para penalizar itens inventados).
function scoreList(expected: string[], actual: unknown): number {
  const actualArr = Array.isArray(actual) ? actual : [];
  const expectedNorm = expected.map((e) => normalizeText(String(e)));
  const actualNorm = actualArr.map((a) => normalizeText(String(a)));

  if (expectedNorm.length === 0 && actualNorm.length === 0) return 1;
  if (expectedNorm.length === 0) return 0; // inventou itens que não deveriam existir
  if (actualNorm.length === 0) return 0; // deixou de citar itens que estavam no relato

  const hitsRecall = expectedNorm.filter((e) => actualNorm.some((a) => a.includes(e) || e.includes(a))).length;
  const hitsPrecision = actualNorm.filter((a) => expectedNorm.some((e) => a.includes(e) || e.includes(a))).length;

  const recall = hitsRecall / expectedNorm.length;
  const precision = hitsPrecision / actualNorm.length;
  if (precision + recall === 0) return 0;
  return (2 * precision * recall) / (precision + recall);
}

export function scoreCase(expected: MigraineStructured, actual: MigraineStructured): CaseScores {
  const scores: Record<string, number> = {};

  for (const field of STRICT_FIELDS) {
    scores[field] = scoreStrict(expected[field], actual[field]);
  }

  const expSint = expected.sintomas_associados;
  const actSint = actual.sintomas_associados;
  for (const field of BOOL_FIELDS) {
    scores[`sintomas.${field}`] = scoreStrict(!!expSint?.[field], !!actSint?.[field]);
  }
  scores['sintomas.outros'] = scoreList(expSint?.outros ?? [], actSint?.outros);

  for (const field of LIST_FIELDS) {
    scores[field] = scoreList(expected[field] ?? [], actual[field]);
  }

  // resumo é texto livre: não entra na nota, só fica disponível para leitura humana.
  const values = Object.values(scores);
  const overall = values.reduce((a, b) => a + b, 0) / values.length;
  return { ...scores, overall };
}
