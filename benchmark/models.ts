// Mesmas 6 famílias do benchmark de desktop (benchmarks/ondevice-llm/models.yaml),
// mesma quantização Q4_K_M. Mantido como registro TS separado (em vez de ler o YAML
// em runtime) porque o app não tem acesso ao sistema de arquivos do repositório —
// só a assets empacotados no bundle. Ao adicionar um modelo no YAML, replique aqui.
export interface BenchmarkModel {
  id: string;
  family: string;
  label: string;
  url: string;
  filename: string;
  paramsB: number;
  approxSizeMb: number;
  extraStop: string[];
}

export const BENCHMARK_MODELS: BenchmarkModel[] = [
  {
    id: 'gemma3-1b',
    family: 'Gemma',
    label: 'Gemma 3 1B Instruct (atual em produção)',
    url: 'https://huggingface.co/bartowski/google_gemma-3-1b-it-GGUF/resolve/main/google_gemma-3-1b-it-Q4_K_M.gguf',
    filename: 'google_gemma-3-1b-it-Q4_K_M.gguf',
    paramsB: 1.0,
    approxSizeMb: 806,
    extraStop: ['<end_of_turn>'],
  },
  {
    id: 'qwen2.5-1.5b',
    family: 'Qwen',
    label: 'Qwen2.5 1.5B Instruct',
    url: 'https://huggingface.co/bartowski/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/Qwen2.5-1.5B-Instruct-Q4_K_M.gguf',
    filename: 'Qwen2.5-1.5B-Instruct-Q4_K_M.gguf',
    paramsB: 1.5,
    approxSizeMb: 986,
    extraStop: [],
  },
  {
    id: 'llama3.2-1b',
    family: 'Llama',
    label: 'Llama 3.2 1B Instruct',
    url: 'https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    filename: 'Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    paramsB: 1.0,
    approxSizeMb: 808,
    extraStop: [],
  },
  {
    id: 'smollm2-1.7b',
    family: 'SmolLM2',
    label: 'SmolLM2 1.7B Instruct',
    url: 'https://huggingface.co/bartowski/SmolLM2-1.7B-Instruct-GGUF/resolve/main/SmolLM2-1.7B-Instruct-Q4_K_M.gguf',
    filename: 'SmolLM2-1.7B-Instruct-Q4_K_M.gguf',
    paramsB: 1.7,
    approxSizeMb: 1056,
    extraStop: [],
  },
  {
    id: 'falcon3-1b',
    family: 'Falcon3',
    label: 'Falcon3 1B Instruct',
    url: 'https://huggingface.co/bartowski/Falcon3-1B-Instruct-GGUF/resolve/main/Falcon3-1B-Instruct-Q4_K_M.gguf',
    filename: 'Falcon3-1B-Instruct-Q4_K_M.gguf',
    paramsB: 1.0,
    approxSizeMb: 1060,
    extraStop: [],
  },
  {
    id: 'granite3.1-2b',
    family: 'Granite',
    label: 'Granite 3.1 2B Instruct',
    url: 'https://huggingface.co/bartowski/granite-3.1-2b-instruct-GGUF/resolve/main/granite-3.1-2b-instruct-Q4_K_M.gguf',
    filename: 'granite-3.1-2b-instruct-Q4_K_M.gguf',
    paramsB: 2.0,
    approxSizeMb: 1550,
    extraStop: [],
  },
];
