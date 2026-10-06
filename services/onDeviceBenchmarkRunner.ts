import { Directory, File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';
import { initLlama, type LlamaContext } from 'llama.rn';
import { Platform } from 'react-native';
import { BENCHMARK_CASES, type BenchmarkCase } from '@/benchmark/cases';
import type { BenchmarkModel } from '@/benchmark/models';
import { scoreCase, type CaseScores } from '@/benchmark/scoring';
import { SYSTEM_PROMPT, STOP_WORDS, parseStructuredJson } from './migraineExtraction';

// Roda o mesmo benchmark de benchmarks/ondevice-llm/ direto no aparelho, usando o
// mesmo prompt/schema (migraineExtraction.ts) e os mesmos casos sintéticos
// (benchmark/cases.ts). Serve para revalidar em hardware real o(s) finalista(s) do
// benchmark de desktop — CPU/memória/latência de notebook x86 não equivalem a
// celular ARM. Modelos ficam em diretório próprio, separado do modelo de produção
// (services/onDeviceLlm.ts), para não interferir no app em uso normal.

const modelsDir = new Directory(Paths.document, 'benchmark-models');

export function benchmarkModelFile(model: BenchmarkModel): File {
  return new File(modelsDir, model.filename);
}

export function isBenchmarkModelDownloaded(model: BenchmarkModel): boolean {
  return benchmarkModelFile(model).exists;
}

export async function downloadBenchmarkModel(
  model: BenchmarkModel,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  if (!modelsDir.exists) {
    modelsDir.create({ intermediates: true });
  }
  const dest = benchmarkModelFile(model);
  if (dest.exists) return;

  const resumable = createDownloadResumable(model.url, dest.uri, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
    if (totalBytesExpectedToWrite > 0) {
      onProgress?.(totalBytesWritten / totalBytesExpectedToWrite);
    }
  });
  await resumable.downloadAsync();
}

export async function deleteBenchmarkModel(model: BenchmarkModel): Promise<void> {
  const dest = benchmarkModelFile(model);
  if (dest.exists) dest.delete();
}

export interface CaseRunResult {
  caseId: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  tokensPerSecond: number;
  jsonOk: boolean;
  scores: CaseScores;
}

export interface ModelRunSummary {
  modelId: string;
  family: string;
  label: string;
  loadTimeMs: number;
  modelSizeMb: number;
  latencyP50Ms: number;
  latencyP95Ms: number;
  tokensPerSecondAvg: number;
  jsonValidRate: number;
  accuracyOverall: number;
  cases: CaseRunResult[];
}

export type BenchmarkProgress =
  | { stage: 'downloading'; modelId: string; fraction: number }
  | { stage: 'loading'; modelId: string }
  | { stage: 'running'; modelId: string; caseId: string; index: number; total: number }
  | { stage: 'model-done'; modelId: string; summary: ModelRunSummary };

async function runCase(context: LlamaContext, caseDef: BenchmarkCase, model: BenchmarkModel): Promise<CaseRunResult> {
  const t0 = Date.now();
  const result = await context.completion({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: caseDef.transcript },
    ],
    n_predict: 512,
    temperature: 0.1,
    stop: [...STOP_WORDS, ...model.extraStop],
  });
  const latencyMs = Date.now() - t0;

  const { data, ok } = parseStructuredJson(result.text);
  const scores = scoreCase(caseDef.expected, data);
  const timings = result.timings;

  return {
    caseId: caseDef.id,
    latencyMs,
    promptTokens: timings?.prompt_n ?? 0,
    completionTokens: timings?.predicted_n ?? 0,
    tokensPerSecond: timings?.predicted_per_second ?? 0,
    jsonOk: ok,
    scores,
  };
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.max(0, Math.ceil(sortedAsc.length * p) - 1);
  return sortedAsc[idx];
}

export async function runBenchmarkForModel(
  model: BenchmarkModel,
  onProgress?: (p: BenchmarkProgress) => void,
): Promise<ModelRunSummary> {
  if (!isBenchmarkModelDownloaded(model)) {
    throw new Error(`Modelo ${model.id} não baixado. Chame downloadBenchmarkModel() primeiro.`);
  }

  onProgress?.({ stage: 'loading', modelId: model.id });
  const t0 = Date.now();
  const context = await initLlama({
    model: benchmarkModelFile(model).uri,
    use_mlock: true,
    n_ctx: 2048,
    n_gpu_layers: 99, // ignorado sem GPU/OpenCL compatível; llama.rn cai para CPU
  });
  const loadTimeMs = Date.now() - t0;

  const cases: CaseRunResult[] = [];
  try {
    for (let i = 0; i < BENCHMARK_CASES.length; i++) {
      const caseDef = BENCHMARK_CASES[i];
      onProgress?.({ stage: 'running', modelId: model.id, caseId: caseDef.id, index: i, total: BENCHMARK_CASES.length });
      cases.push(await runCase(context, caseDef, model));
    }
  } finally {
    await context.release();
  }

  const latencies = cases.map((c) => c.latencyMs).sort((a, b) => a - b);
  const tps = cases.map((c) => c.tokensPerSecond).filter((v) => v > 0);
  const overallScores = cases.map((c) => c.scores.overall);

  const summary: ModelRunSummary = {
    modelId: model.id,
    family: model.family,
    label: model.label,
    loadTimeMs,
    modelSizeMb: Math.round(benchmarkModelFile(model).size / 1e6),
    latencyP50Ms: percentile(latencies, 0.5),
    latencyP95Ms: percentile(latencies, 0.95),
    tokensPerSecondAvg: tps.length ? tps.reduce((a, b) => a + b, 0) / tps.length : 0,
    jsonValidRate: cases.filter((c) => c.jsonOk).length / cases.length,
    accuracyOverall: overallScores.reduce((a, b) => a + b, 0) / overallScores.length,
    cases,
  };

  onProgress?.({ stage: 'model-done', modelId: model.id, summary });
  return summary;
}

export async function runBenchmark(
  models: BenchmarkModel[],
  onProgress?: (p: BenchmarkProgress) => void,
): Promise<ModelRunSummary[]> {
  const summaries: ModelRunSummary[] = [];
  for (const model of models) {
    summaries.push(await runBenchmarkForModel(model, onProgress));
  }
  return summaries;
}

export interface BenchmarkReport {
  generatedAt: string;
  device: { platform: string; osVersion: string | number };
  summaries: ModelRunSummary[];
}

export function buildReport(summaries: ModelRunSummary[]): BenchmarkReport {
  return {
    generatedAt: new Date().toISOString(),
    device: { platform: Platform.OS, osVersion: Platform.Version },
    summaries,
  };
}
