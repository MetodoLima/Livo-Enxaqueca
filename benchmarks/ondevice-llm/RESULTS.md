# Benchmark de LLMs embarcados — Resultados

**Data:** 2026-10-06
**Tarefa avaliada:** complementação de crise por voz/texto (extração de JSON estruturado a partir de um relato em linguagem natural) — a mesma tarefa de `services/onDeviceLlm.ts` em produção.
**Ambiente de execução:** notebook x86 (Intel i5-13450HX, 16 núcleos), 4 threads por inferência para aproximar um celular de média gama. **CPU, memória e latência absolutas não equivalem a um Android/iOS real** — ver seção "Próximo passo" no `README.md` para a validação em aparelho via a tela `/dev-benchmark`.

## Resumo executivo

O modelo em produção hoje (**Gemma 3 1B**) teve a **pior acurácia de extração entre os 6 modelos testados** (0.56), por um motivo concreto e corrigível: ele quase nunca respeita a instrução de deixar campos vazios quando a informação não foi dita (ver "Achado transversal" abaixo). **Qwen2.5 1.5B Instruct** foi o melhor da rodada (0.89 de acurácia, 100% de JSON válido), com uma margem grande sobre os demais. Nenhum modelo teve problema de velocidade que o desqualificasse de cara — a diferença real está na qualidade da extração, não na performance bruta.

## Metodologia

- **Prompt e schema:** idênticos aos de produção (`services/migraineExtraction.ts` / `services/onDeviceLlm.ts`), incluindo o exemplo único (*one-shot*) de formatação.
- **Casos de teste:** 13 relatos sintéticos (`cases.jsonl` / `benchmark/cases.ts`), nenhum dado real de paciente. Cobrem relato completo, relato mínimo, cada enum do schema, a política de "não invente" (campos ausentes devem ficar `null`/`false`/`[]`) e uma armadilha de alucinação.
- **Modelos:** 6 famílias, todas quantização Q4_K_M, `n_ctx=2048`, `temperature=0.1`.
- **Nota por campo:** exata para enums/booleanos; F1 por palavra-chave para campos de lista livre (sintomas "outros", qualidade da dor, medicamentos, gatilhos). Omissão e alucinação pesam igual. O campo `resumo` (texto livre) não entra na nota. Ver `scoring.py` / `benchmark/scoring.ts`.
- **Execução:** `run_benchmark.py --threads 4`, resultado bruto em `results/raw_20261006-180723.jsonl`, resumo em `results/summary_20261006-180723.csv`.

## Resultado quantitativo

| Modelo | Família | Tamanho | Latência p50 | Latência p95 | Tokens/s | CPU% médio | Pico RSS | JSON válido | Acurácia |
|---|---|---|---|---|---|---|---|---|---|
| **Qwen2.5 1.5B Instruct** | Qwen | 986 MB | 3.98s | 4.79s | 34.6 | 425% | 1897 MB | 100% | **0.892** |
| SmolLM2 1.7B Instruct | SmolLM2 | 1056 MB | 5.08s | 6.09s | 27.7 | 433% | 2476 MB | 100% | 0.815 |
| Llama 3.2 1B Instruct | Llama | 808 MB | 4.38s | 6.37s | 34.8 | 413% | 1564 MB | 69% | 0.805 |
| Falcon3 1B Instruct | Falcon3 | 1057 MB | 4.07s | 5.68s | 39.7 | 416% | 1988 MB | 100% | 0.779 |
| Granite 3.1 2B Instruct | Granite | 1545 MB | 7.75s | 9.85s | 21.2 | 425% | 3118 MB | 100% | 0.672 |
| Gemma 3 1B Instruct (produção) | Gemma | 806 MB | 3.48s | 3.84s | 42.1 | 408% | 1134 MB | 100% | 0.564 |

*CPU% é do processo e pode passar de 100% com múltiplas threads (psutil); não é comparável a uma CPU de celular de 4-8 núcleos ARM.*

## Achado transversal: viés de valor-padrão em modelos pequenos

O fator que mais separa os modelos não foi velocidade — foi o quão bem cada um respeita a regra "preencha APENAS o que foi dito, não invente". Em vez de errar de forma aleatória, cada modelo com nota baixa errou de forma **sistemática**, sempre na mesma direção:

| Modelo | `sintomas.nausea = true` (gabarito: 1 de 13 casos) | Comportamento |
|---|---|---|
| Gemma 3 1B | **12 de 13** | Praticamente sempre marca náusea, independente do relato |
| Falcon3 1B | 10 de 13 | Forte viés para `true` |
| Llama 3.2 1B | 9 de 13 | Forte viés para `true` |
| SmolLM2 1.7B | 5 de 13 | Viés moderado |
| Granite 3.1 2B | 3 de 13 | Próximo do gabarito |
| **Qwen2.5 1.5B** | **2 de 13** | O mais próximo do gabarito |

O mesmo padrão aparece em campos de enum: o **Gemma nunca retornou `null` em `localizacao`** nos 13 casos — alternou entre `"occipital"` (7x) e `"temporal"` (6x) mesmo nos 11 casos em que a localização não foi mencionada. O **Granite** fez o equivalente com `inicio_estimado`, retornando `">4h"` em 9 dos 13 casos, incluindo relatos sem qualquer menção de tempo.

Esse viés de valor-padrão é específico de cada modelo (cada um "trava" num campo diferente), mas há um segundo padrão que é **transversal a quase todos**: o caso `aura-occipital-bilateral` — que exige combinar três pistas indiretas na mesma frase ("flashes de luz antes da dor" → aura; "nuca inteira, dos dois lados" → occipital + bilateral; "a luz incomodava" → fotofobia) — está entre os 3 piores casos de 5 dos 6 modelos (só o Gemma não, porque já erra quase tudo por padrão). Já os casos de fato único e explícito (`medication-explicit-none`, `leve-com-nota`) estão entre os melhores de praticamente todos. Ou seja: modelos pequenos lidam bem com "extraia este fato que foi dito claramente", mas pioram quando precisam preencher vários campos distintos a partir de pistas indiretas na mesma frase — um padrão de dificuldade do schema/tarefa, não de uma família específica.

**Hipótese sobre o viés de valor-padrão:** o prompt de produção inclui um único exemplo (*one-shot*) cuja resposta de referência tem `"nausea": true`. Modelos menores parecem ancorar nesse valor específico do exemplo em vez de tratá-lo como só um exemplo de formatação — o que explicaria por que justamente o campo `nausea` (presente no exemplo) é o mais enviesado, mais do que os outros campos booleanos (que não aparecem com valor `true` no exemplo). Isso é uma hipótese de prompt, não de capacidade do modelo: **um experimento de baixo custo** (trocar o exemplo por um 100% nulo, ou usar dois exemplos contrastantes) pode melhorar a acurácia do próprio Gemma sem trocar de peso nenhum — vale testar antes de decidir trocar de modelo.

## Análise qualitativa por modelo

### Qwen2.5 1.5B Instruct — melhor da rodada
De longe o mais disciplinado com a política de "não invente" (tabela acima). 100% de JSON válido nos 13 casos. Os pontos fracos que restam são genuínos, não vício de resposta-padrão: `qualidade_dor` (0.69) e `localizacao` (0.77) — erra em inferências mais indiretas, como não extrair "explodindo" como descritor de qualidade da dor no caso `trigger-wine`. Custo: ~1.9GB de pico de memória, quase o dobro do Gemma atual, e carrega um pouco mais devagar.

### SmolLM2 1.7B Instruct — segundo lugar, mas o mais lento
Acurácia sólida (0.815) e também 100% de JSON válido, mas é o mais lento do grupo (p50 de 5.08s, quase 50% mais que o Gemma) e o que mais usa memória de pico (2476 MB) depois do Granite. Erra nos mesmos campos "difíceis" que todo mundo (`qualidade_dor` 0.54, `localizacao`/`lado` 0.62) — sem o viés sistemático de valor-padrão que prejudica Gemma/Falcon/Llama.

### Llama 3.2 1B Instruct — rápido, mas 31% de respostas quebradas
O problema não é falta de capacidade: inspecionando as respostas com falha de parse, o modelo **copia literalmente a notação de tipos do prompt** para dentro da resposta — por exemplo, `"localizacao": "frontal"|"temporal"|"occipital"|"difusa"|null` em vez de escolher um valor único. Isso acontece em vários dos casos mais "carregados" de informação (ex: `full-detail`); no caso `inicio-menos-1h` o mesmo problema veio acompanhado de um `intensidade_dor: 15` fora da escala 0-10. É um problema de como o prompt apresenta os enums para esse modelo especificamente, plausivelmente corrigível reescrevendo essa parte do prompt (ex: trocar a notação `a|b|c` por uma lista enumerada). Também tem viés de `nausea=true` (9/13). Em latência fica no meio da tabela (4.38s de mediana) mesmo nos casos em que o JSON sai bem-formado — a instabilidade de formatação é o problema real, não velocidade.

### Falcon3 1B Instruct — bom throughput, mas instável em casos complexos
100% de JSON válido e o segundo maior throughput (39.7 tok/s, atrás só do Gemma), mas com o viés de `nausea=true` mais forte depois do Gemma (10/13). No caso mais denso de sintomas (`vomito-fonofobia-jejum`), a resposta marcou **todos os 6 sintomas booleanos como `true`** (quando só 2 eram verdadeiros no relato), confundiu o gatilho "jejum prolongado" como se fosse um sintoma, não extraiu o medicamento citado (naproxeno) e produziu um `resumo` com português quebrado e palavras em inglês misturadas ("Jémeu que a barulho... discomfort...") — sinal de que a qualidade de geração degrada em relatos com várias informações simultâneas.

### Granite 3.1 2B Instruct — o maior e o mais lento, sem ganho proporcional
1.5GB e 7.75s de latência mediana (quase o dobro do Gemma) não se traduziram em acurácia proporcional (0.672, só o segundo pior). O viés de `inicio_estimado=">4h"` (9/13) é o principal motivo. O padrão por caso é claro: vai bem em fatos explícitos e isolados (`medication-explicit-none` e `leve-com-nota`, 0.87 cada) e vai mal quando precisa combinar várias pistas indiretas ao mesmo tempo (`aura-occipital-bilateral` e `vomito-fonofobia-jejum`, 0.53 cada) — o tamanho maior não ajudou nesse tipo de caso.

### Gemma 3 1B Instruct (modelo em produção hoje) — pior acurácia do grupo
É o mais leve (806 MB) e o mais rápido do grupo em latência e throughput (p50 3.48s, 42.1 tok/s) — mas isso vem à custa de praticamente ignorar a política "não invente": nunca retornou `null` em `localizacao` (0.08 de nota, o pior campo do benchmark inteiro) e marcou náusea em 12 dos 13 casos. Na prática, o modelo "preenche o formulário inteiro" em vez de extrair só o que foi dito — o oposto do que o prompt pede.

## Recomendação

1. **Qwen2.5 1.5B Instruct** é o candidato para validar em aparelho real, usando a tela `/dev-benchmark` já preparada no app (ver `README.md`). A diferença de acurácia (0.89 vs 0.56) é grande o suficiente para justificar o custo extra de ~1.9GB de memória e ~0.5s de latência, mas isso precisa ser confirmado em hardware ARM antes de qualquer decisão.
2. **Teste de prompt de baixo custo, independente da troca de modelo:** substituir o exemplo único do prompt (que tem `"nausea": true`) por um exemplo totalmente nulo, ou por dois exemplos contrastantes, e rodar o benchmark de novo no Gemma atual — se a hipótese de ancoragem no exemplo estiver certa, isso pode recuperar parte da acurácia perdida sem trocar nenhum peso de modelo.
3. **Falcon3 1B** é competitivo em velocidade pura mas perde em confiabilidade em relatos densos; **Granite 3.1 2B** não compensa o tamanho/latência extra — nenhum dos dois parece um bom próximo passo.

## Arquivos

- Resumo: `results/summary_20261006-180723.csv`
- Dados brutos (resposta de cada modelo em cada caso + nota por campo): `results/raw_20261006-180723.jsonl`
