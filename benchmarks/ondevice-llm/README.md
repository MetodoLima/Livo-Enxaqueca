# Benchmark de LLMs embarcados — complementação de crise

Compara famílias de LLMs pequenos (GGUF, quantização Q4_K_M) na tarefa que
`services/onDeviceLlm.ts` já executa em produção: extrair o JSON estruturado de
um relato de crise de enxaqueca por voz/texto. Mede latência, tokens, uso de
CPU/memória e acurácia da extração contra um gabarito sintético.

Usa `llama-cpp-python` como motor — é a mesma base (ggml/llama.cpp) que o
`llama.rn` usa dentro do app, então os números aqui são um bom proxy relativo
entre modelos, mas **não são os números reais do celular**. CPU, memória e
latência de um notebook x86 não equivalem a um Android ARM com throttling
térmico. Trate este benchmark como uma triagem rápida para descartar 2-3
candidatos; o(s) finalista(s) precisam ser revalidados em aparelho real antes
de qualquer decisão de embarcar em produção.

## Setup

```bash
cd benchmarks/ondevice-llm
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt   # compila llama-cpp-python, pode levar alguns minutos
```

`llama-cpp-python` compila C++ na instalação — no Linux precisa de um
compilador (`build-essential` ou equivalente) já presente no sistema.

## Baixar os modelos

```bash
python run_benchmark.py --download-only
```

Baixa os 4 GGUFs listados em `models.yaml` para `models/` (~1-3GB cada, total
~6GB). Os arquivos **não** são versionados (veja `.gitignore`).

## Rodar o benchmark

```bash
python run_benchmark.py                                  # todos os modelos de models.yaml
python run_benchmark.py --models gemma3-1b,qwen2.5-1.5b   # só alguns
python run_benchmark.py --threads 4                       # default; aproxima um celular de 4 núcleos
```

Ao final imprime uma tabela comparativa e grava em `results/`:
- `summary_<timestamp>.csv` — uma linha por modelo com as métricas agregadas.
- `raw_<timestamp>.jsonl` — uma linha por (modelo, caso), com a saída crua do
  modelo, o JSON parseado e a nota por campo — útil para auditar *por que* um
  modelo tirou nota baixa num caso específico.

## O que cada métrica significa

| Métrica | O que mede |
|---|---|
| `load_time_s` | Tempo para carregar o modelo na memória (relevante para o primeiro uso no app) |
| `latency_p50_s` / `latency_p95_s` | Tempo de uma extração completa (prompt + geração) |
| `tokens_per_sec_avg` | Velocidade de geração — proxy de "custo" de inferência |
| `cpu_percent_avg` | % de CPU do processo durante a geração (pode passar de 100% com várias threads) |
| `peak_rss_mb_avg` | Pico de memória residente do processo durante a geração |
| `json_valid_rate` | Fração de respostas que viraram JSON válido (mesmo parser com fallback do app) |
| `accuracy_overall` | Nota 0–1 da extração: campos de enum/booleano com acerto exato; listas (sintomas, gatilhos, medicamentos) com F1 por palavra-chave. Pune tanto omissão quanto alucinação — ver `scoring.py` |

`resumo` (texto livre) não entra na nota — é só gravado no `raw_*.jsonl` para
leitura humana.

## Adicionar um modelo/família novo

Edite `models.yaml` — não precisa tocar em `run_benchmark.py`. Prefira sempre
a quantização Q4_K_M (mesmo trade-off qualidade/tamanho usado em produção) e
confirme o nome exato do arquivo `.gguf` na página do repositório no Hugging
Face antes de colar a URL (varia por repositório).

## Manter o prompt em sincronia com produção

`system_prompt.txt` é uma cópia literal da constante `SYSTEM_PROMPT` em
`services/onDeviceLlm.ts`. Se o prompt de produção mudar, copie a mudança para
cá também — não há verificação automática disso.

## Dados de teste

`cases.jsonl` contém 13 relatos sintéticos (nenhum dado real de paciente,
conforme a política de dados da Duranium) cobrindo: relato completo, relato
mínimo, cada símbolo do schema (localização/lado/início/gravidade), política de
"não invente" (campos ausentes devem ficar `null`/`false`/`[]`), e uma
armadilha de alucinação (`sintoma-outro-trap`, onde "ouvido esquerdo" não deve
virar `lado: "esquerdo"`).

## Próximo passo: validação em aparelho real

Existe uma tela de benchmark dentro do próprio app (`app/dev-benchmark.tsx`),
que roda os mesmos `benchmark/cases.ts` (gerado a partir de `cases.jsonl`) e o
mesmo prompt (`services/migraineExtraction.ts`) direto no celular, via
`llama.rn` — os mesmos 6 modelos de `models.yaml`, espelhados em
`benchmark/models.ts`.

1. Gere/instale uma build de desenvolvimento (`eas build --profile development`)
   — precisa ser dev-client, não Expo Go, porque usa módulos nativos.
2. Abra o app e vá em **Perfil** → "Benchmark on-device (interno)" (link
   discreto no final da tela, só para acesso rápido sem precisar de `adb`/deep
   link). Se preferir, também dá pra abrir direto pela rota `/dev-benchmark`
   via `npx uri-scheme open livonative://dev-benchmark --android` (exige `adb`
   instalado e o aparelho com depuração USB habilitada).
3. Selecione os modelos, toque em "Rodar" — baixa (se preciso) e roda cada um
   no aparelho, mostrando latência (medida nativamente pelo próprio
   `llama.cpp`, via `result.timings`), tokens/s, taxa de JSON válido e
   acurácia.
4. Toque em "Exportar resultados" para compartilhar um JSON com os números —
   dá pra enviar pra você mesmo (e-mail, Drive, AirDrop) e comparar com os
   resultados de desktop aqui.

Limitação conhecida: a tela não mede CPU%/pico de RSS do processo (não há
profiler embutido sem adicionar uma dependência nativa nova, como
`react-native-device-info`). Para esses números, rode a tela com o Android
Studio Profiler ou Xcode Instruments conectado durante a execução.
