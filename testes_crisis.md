# Documentação dos Testes — `__tests__/crisis.test.ts`

## Visão Geral

| Item | Detalhe |
|---|---|
| **Arquivo testado** | `types/crisis.ts` |
| **Arquivo de teste** | `__tests__/crisis.test.ts` |
| **Test runner** | Jest (via preset `jest-expo`) |
| **Linguagem** | TypeScript |
| **Tipo de teste** | Unitário — funções puras, sem dependências externas |
| **Total de testes** | 37 |

> [!NOTE]
> Todos os testes são **unitários puros**: não fazem chamadas HTTP, não usam banco de dados, não precisam de emulador. Rodam 100% em Node.js, diretamente no terminal.

---

## Tecnologias Utilizadas

| Ferramenta | Papel nos testes |
|---|---|
| **Jest** | Executa os testes, avalia os `expect()`, reporta resultados |
| **`describe()`** | Agrupa testes relacionados em blocos nomeados |
| **`it()` / `test()`** | Define um caso de teste individual |
| **`it.each()`** | Roda o mesmo teste com múltiplos valores de entrada automaticamente |
| **`beforeEach()`** | Cria um estado limpo antes de cada teste (evita que um teste contamine o outro) |
| **`expect(...).toBe()`** | Verifica igualdade estrita (===) |
| **`expect(...).toEqual()`** | Verifica igualdade profunda (objetos e arrays) |
| **`expect(...).toBeNull()`** | Verifica que o valor é `null` |
| **`expect(...).toBeInstanceOf()`** | Verifica o tipo do objeto |
| **`expect(...).toContain()`** | Verifica se um array contém um item |
| **`expect(...).toHaveLength()`** | Verifica o tamanho de um array |
| **`expect(...).toHaveProperty()`** | Verifica se um objeto possui determinada chave |
| **`expect(...).not.toHaveProperty()`** | Verifica que o objeto **não** possui determinada chave |
| **`expect(...).toMatch(regex)`** | Verifica que uma string bate com uma expressão regular |
| **`expect(...).arrayContaining()`** | Verifica que um array contém todos os itens listados (pode ter outros) |
| **`expect(...).toBeTruthy()`** | Verifica que o valor é truthy (não é `null`, `undefined`, `""`, `0`, `false`) |
| **`expect(...).toBeDefined()`** | Verifica que o valor não é `undefined` |

---

## Grupo 1 — `createEmptyCrisis()`

**O que é:** Função que retorna um `CrisisRecord` com todos os campos em seus valores padrão.
**Código testado:** [crisis.ts L87–L100](file:///wsl$/Ubuntu/home/herik/Livo-Enxaqueca/types/crisis.ts#L87-L100)

### 🗺️ Contexto no App

Essa função é chamada no início do **wizard de registro de crise** (`app/record-crisis.tsx`), no momento em que o usuário toca no botão **"Registrar crise"** na tela inicial. Ela cria o objeto vazio que vai sendo preenchido passo a passo pelo wizard — intensidade, localização, sintomas, medicamentos. Se ela retornar valores errados (ex: `intensity: 0` em vez de `null`), o slider de intensidade começa no zero em vez de aparecer sem seleção, e o usuário vê dados incorretos na tela de resumo da crise.

| # | Nome do teste | Código/lógica testada | Dados de entrada | Resultado esperado |
|---|---|---|---|---|
| 1 | `retorna um objeto com todos os campos esperados` | Estrutura do objeto retornado | Nenhum | Objeto contém as chaves: `startTime`, `endTime`, `intensity`, `location`, `side`, `symptoms`, `medications`, `customMedications`, `triggers`, `aiComplement` |
| 2 | `startTime é uma instância válida de Date` | `startTime: new Date()` | Nenhum | `crisis.startTime` é instância de `Date` e `isNaN(crisis.startTime.getTime())` é `false` |
| 3 | `campos opcionais começam como null` | Valores padrão de `endTime`, `intensity`, `location`, `side`, `aiComplement` | Nenhum | Todos os 5 campos são `null` |
| 4 | `arrays começam vazios` | Valores padrão de `symptoms`, `medications`, `customMedications`, `triggers` | Nenhum | Todos os 4 arrays são `[]` |
| 5 | `cada chamada retorna um novo objeto independente` | Isolamento de referência — `createEmptyCrisis()` não reutiliza o mesmo array | Chama a função 2×, adiciona item no array de uma | A segunda crise não é afetada (`symptoms === []`) |

---

## Grupo 2 — `mergeAiResultIntoCrisis()` — Intensidade

**O que é:** Parte da função de merge que decide se aplica ou não o campo `intensity` vindo da IA.
**Código testado:** [crisis.ts L110–L112](file:///wsl$/Ubuntu/home/herik/Livo-Enxaqueca/types/crisis.ts#L110-L112)

### 🗺️ Contexto no App

`mergeAiResultIntoCrisis` é chamada em **dois momentos** na tela de detalhe da crise (`app/(tabs)/crisis.tsx`):
1. Quando o usuário **grava um áudio** descrevendo a crise e toca em parar — o áudio é enviado ao backend, e o resultado da IA é mesclado com o que já estava preenchido (linha 206 do arquivo).
2. Quando o usuário **escreve um texto** com detalhes adicionais e toca em "Analisar" (linha 225).

No caso da intensidade: se o usuário já marcou intensidade `8` no wizard e depois fala no áudio *"está uma dor fortíssima, uns 9"*, a IA retorna `intensidade_dor: 9` e a função deve **substituir** o valor. Se a IA não conseguiu extrair a intensidade do áudio, ela retorna `null` e o `8` do usuário deve ser **preservado**.

| # | Nome do teste | Código/lógica testada | Dados de entrada | Resultado esperado |
|---|---|---|---|---|
| 6 | `aplica intensidade quando a IA retorna um valor` | `if (structured.intensidade_dor !== null) patch.intensity = ...` | `intensidade_dor: 7` | `patch.intensity === 7` |
| 7 | `não define intensity quando a IA retorna null` | Condição `!== null` — campo não é adicionado ao patch | `intensidade_dor: null` | `patch` **não tem** a chave `intensity` |
| 8 | `aceita intensidade zero` | Testa o edge case: `0` é falsy em JS mas não é `null` | `intensidade_dor: 0` | `patch.intensity === 0` (não tratado como "sem valor") |

---

## Grupo 3 — `mergeAiResultIntoCrisis()` — Localização e Lado

**O que é:** Parte do merge que trata localização e lado da dor — a IA não substitui o que o usuário escolheu se ela não tiver certeza.
**Código testado:** [crisis.ts L114–L121](file:///wsl$/Ubuntu/home/herik/Livo-Enxaqueca/types/crisis.ts#L114-L121)

### 🗺️ Contexto no App

Na tela de resumo da crise, os cards de **Localização** e **Lado** exibem os valores do `activeCrisis`. Quando a IA processa o áudio e a função de merge é chamada, esses valores podem ou não ser atualizados. O comportamento correto é: se o usuário selecionou *"Temporal"* no wizard e a IA não detectou onde está a dor, o card continua mostrando *"Temporal"* — não apaga a escolha do usuário. Só atualiza se a IA tiver uma informação explícita.

| # | Nome do teste | Código/lógica testada | Dados de entrada | Resultado esperado |
|---|---|---|---|---|
| 9 | `aplica localização quando a IA retorna um valor` | `if (structured.localizacao !== null) patch.location = ...` | `localizacao: 'frontal'` | `patch.location === 'frontal'` |
| 10 | `não define location quando a IA retorna null` | Comportamento de preservar seleção do usuário | Crise com `location: 'temporal'`, IA com `localizacao: null` | `patch` **não tem** a chave `location` (o `'temporal'` do usuário é preservado) |
| 11 | `aplica lado quando a IA retorna um valor` | `if (structured.lado !== null) patch.side = ...` | `lado: 'bilateral'` | `patch.side === 'bilateral'` |
| 12 | `não define side quando a IA retorna null` | Mesma lógica de preservação para o lado | `lado: null` | `patch` **não tem** a chave `side` |

---

## Grupo 4 — `mergeAiResultIntoCrisis()` — Sintomas

**O que é:** A IA faz a **união** dos sintomas detectados no áudio com os que o usuário marcou no questionário.
**Código testado:** [crisis.ts L123–L132](file:///wsl$/Ubuntu/home/herik/Livo-Enxaqueca/types/crisis.ts#L123-L132)

### 🗺️ Contexto no App

No wizard, o usuário seleciona manualmente sintomas como náusea e tontura. Depois, na tela de detalhe, pode gravar um áudio dizendo *"também estou com muita fotofobia e não consigo ouvir sons"* — a IA detecta `fotofobia: true` e `fonofobia: true`. A função de merge deve **somar** os sintomas do áudio aos que já estavam marcados. O resultado aparece na seção **"Sintomas"** da tela de resumo como tags coloridas. Se a função duplicasse sintomas, a tag de náusea apareceria duas vezes na UI.

| # | Nome do teste | Código/lógica testada | Dados de entrada | Resultado esperado |
|---|---|---|---|---|
| 13 | `adiciona sintomas da IA quando o usuário não tinha nenhum` | `Array.from(new Set([...current.symptoms, ...aiSymptoms]))` | Crise sem sintomas, IA detecta `nausea` e `fotofobia` | `patch.symptoms` contém `'nausea'` e `'fotofobia'` |
| 14 | `faz a união entre sintomas do usuário e da IA, sem duplicatas` | Uso de `Set` para evitar duplicatas | Crise com `['nausea', 'tontura']`, IA detecta `nausea` (já existe) e `fotofobia` (novo) | `patch.symptoms` tem os 3 sintomas e `'nausea'` aparece **uma única vez** |
| 15 | `todos os sintomas da IA são capturados corretamente` | Mapeamento de todos os campos booleanos de `SintomasAssociados` | Todos os 6 campos `true` | `patch.symptoms` contém `['nausea', 'vomito', 'fotofobia', 'fonofobia', 'aura', 'tontura']` |
| 16 | `quando a IA não detecta nenhum sintoma, patch.symptoms é array vazio` | Caso base — nenhum booleano `true` | Todos os sintomas `false` | `patch.symptoms === []` |

---

## Grupo 5 — `mergeAiResultIntoCrisis()` — Medicamentos

**O que é:** A lógica de medicamentos é a mais complexa: separa os "conhecidos" (do enum `MEDICATIONS`) dos "customizados", faz união com os do usuário, e remove `'nenhum'` quando a IA encontra medicamentos reais.
**Código testado:** [crisis.ts L134–L156](file:///wsl$/Ubuntu/home/herik/Livo-Enxaqueca/types/crisis.ts#L134-L156)

### 🗺️ Contexto no App

Na tela de resumo, a seção **"Medicamentos"** exibe tags com os remédios registrados. O wizard tem uma lista de opções conhecidas (Dipirona, Paracetamol, etc.) mais a opção *"Nenhum"*. Se o usuário marcou *"Nenhum"* no wizard mas depois fala no áudio *"tomei um Tylenol"*, três coisas devem acontecer: (1) *"Nenhum"* é removido, (2) Tylenol vai para `customMedications` por não estar na lista padrão, e (3) aparece como tag na UI. Um bug aqui poderia fazer o app exibir *"Nenhum"* e *"Tylenol"* ao mesmo tempo — uma contradição visível para o usuário.

| # | Nome do teste | Código/lógica testada | Dados de entrada | Resultado esperado |
|---|---|---|---|---|
| 17 | `separa medicamentos conhecidos de customizados` | Loop que testa `knownIds.find(...)` para cada medicamento | IA retorna `['dipirona', 'Tylenol']` | `patch.medications` tem `'dipirona'`; `patch.customMedications` tem `'Tylenol'` |
| 18 | `remove "nenhum" quando a IA detecta medicamentos reais` | `current.medications.filter((m) => m !== 'nenhum')` | Usuário tinha `['nenhum']`, IA retorna `['paracetamol']` | `patch.medications` tem `'paracetamol'` e **não tem** `'nenhum'` |
| 19 | `faz a união de medicamentos conhecidos sem duplicatas` | `Array.from(new Set([...baseKnown, ...aiKnown]))` | Usuário tinha `['ibuprofeno']`, IA retorna `['ibuprofeno', 'dipirona']` | `'ibuprofeno'` aparece **uma vez**, `'dipirona'` é adicionado |
| 20 | `não altera medicamentos quando a IA não retorna nenhum` | Condição `if (structured.medicamentos_tomados.length > 0)` | `medicamentos_tomados: []` | `patch` **não tem** as chaves `medications` nem `customMedications` |
| 21 | `ignora "nenhum" retornado pela IA` | `normalized !== 'nenhum'` no loop de classificação | IA retorna `['nenhum']` | `'nenhum'` não aparece em nenhuma das listas do patch |

---

## Grupo 6 — `mergeAiResultIntoCrisis()` — Fatores Desencadeantes

**O que é:** A IA faz a **união acumulada** dos triggers a cada complemento — nunca descarta o que o usuário informou.
**Código testado:** [crisis.ts L158–L164](file:///wsl$/Ubuntu/home/herik/Livo-Enxaqueca/types/crisis.ts#L158-L164)

### 🗺️ Contexto no App

Os fatores desencadeantes ("gatilhos") são exibidos na seção **"Análise da IA"** da tela de detalhe, cada um como uma linha com ícone de raio e um botão de remover (X). O usuário pode complementar a crise múltiplas vezes — primeiro um áudio, depois um texto. A cada complemento, a função acumula os gatilhos sem apagar os anteriores. Se a função substituísse em vez de acumular, o usuário perderia gatilhos detectados em rodadas anteriores.

| # | Nome do teste | Código/lógica testada | Dados de entrada | Resultado esperado |
|---|---|---|---|---|
| 22 | `adiciona triggers da IA quando o usuário não tinha nenhum` | `Array.from(new Set([...current.triggers, ...structured.fatores_desencadeantes]))` | Crise sem triggers, IA retorna `['estresse', 'falta de sono']` | `patch.triggers` contém ambos |
| 23 | `faz a união com triggers do usuário, sem duplicatas` | Uso de `Set` para deduplicação | Usuário tinha `['estresse']`, IA retorna `['estresse', 'falta de sono']` | `'estresse'` aparece **uma vez**, `'falta de sono'` é adicionado |
| 24 | `não define triggers quando a IA não retorna nenhum` | Condição `if (structured.fatores_desencadeantes.length > 0)` | `fatores_desencadeantes: []` | `patch` **não tem** a chave `triggers` |

---

## Grupo 7 — `crisisToMigraineStructured()` — Localização

**O que é:** Converte o `LocationId` do app para o formato do backend. `'atras_olhos'` é uma opção do app que o backend não reconhece — deve virar `null`.
**Código testado:** [crisis.ts L179–L183](file:///wsl$/Ubuntu/home/herik/Livo-Enxaqueca/types/crisis.ts#L179-L183)

### 🗺️ Contexto no App

`crisisToMigraineStructured` é chamada **imediatamente antes** de enviar os dados ao backend de IA, tanto no fluxo de áudio (linha 203 de `crisis.tsx`) quanto no de texto (linha 222). Ela converte o estado interno do app para o schema que a API Python espera. `'atras_olhos'` existe no app como uma opção de localização reconhecível pelo usuário, mas o backend só aceita `'frontal'`, `'temporal'`, `'occipital'` e `'difusa'`. Se esse mapeamento falhasse e enviasse `'atras_olhos'` para a API, o backend retornaria um erro de validação e o processamento de IA quebraria completamente.

| # | Nome do teste | Código/lógica testada | Dados de entrada | Resultado esperado |
|---|---|---|---|---|
| 25 | `converte localização conhecida corretamente` | Passthrough direto do `location` | `location: 'frontal'` | `result.localizacao === 'frontal'` |
| 26 | `mapeia "atras_olhos" para null` | `crisis.location === 'atras_olhos' ? null : crisis.location` | `location: 'atras_olhos'` | `result.localizacao === null` |
| 27 | `retorna null quando localização é null` | Condição `=== null` | `location: null` | `result.localizacao === null` |

---

## Grupo 8 — `crisisToMigraineStructured()` — Nível de Incapacidade

**O que é:** Converte a intensidade numérica (0–10) em categoria textual para o backend: `'leve'`, `'moderado'` ou `'severo'`.
**Código testado:** [crisis.ts L185–L190](file:///wsl$/Ubuntu/home/herik/Livo-Enxaqueca/types/crisis.ts#L185-L190)

> Usa `it.each()` — o mesmo teste roda automaticamente para cada valor da lista.

### 🗺️ Contexto no App

O backend de IA usa `nivel_incapacidade` para contextualizar a análise e gerar o **resumo textual** que aparece no card "Análise da IA". Se a conversão estiver errada — por exemplo, intensidade `6` sendo classificada como `'severo'` em vez de `'moderado'` — o modelo de linguagem recebe contexto incorreto e pode gerar um resumo impreciso. Os `it.each` foram usados aqui propositalmente para testar **cada valor possível de 0 a 10** sem repetir código, garantindo que as fronteiras (`3→4` e `6→7`) estejam corretas.

| # | Nome do teste | Código/lógica testada | Dados de entrada | Resultado esperado |
|---|---|---|---|---|
| 28 | `intensidade null → nivel_incapacidade null` | `if (crisis.intensity !== null)` — caso em que a condição é falsa | `intensity: null` | `result.nivel_incapacidade === null` |
| 29–32 | `intensidade 0, 1, 2, 3 → leve` | `if (crisis.intensity <= 3)` | `intensity: 0`, `1`, `2`, `3` (4 execuções) | `result.nivel_incapacidade === 'leve'` |
| 33–35 | `intensidade 4, 5, 6 → moderado` | `else if (crisis.intensity <= 6)` | `intensity: 4`, `5`, `6` (3 execuções) | `result.nivel_incapacidade === 'moderado'` |
| 36–39 | `intensidade 7, 8, 9, 10 → severo` | `else` (acima de 6) | `intensity: 7`, `8`, `9`, `10` (4 execuções) | `result.nivel_incapacidade === 'severo'` |

---

## Grupo 9 — `crisisToMigraineStructured()` — Sintomas, Medicamentos e Outros

**Código testado:** [crisis.ts L168–L207](file:///wsl$/Ubuntu/home/herik/Livo-Enxaqueca/types/crisis.ts#L168-L207)

### 🗺️ Contexto no App

Esse conjunto de campos também vai direto para o payload enviado ao backend antes de cada análise de IA. Os **sintomas** precisam ser convertidos de um array de strings (`['nausea', 'aura']`) para um objeto booleano (`{ nausea: true, aura: true, vomito: false, ... }`), que é o formato que o schema Python valida. Os **medicamentos** têm o `'nenhum'` filtrado porque é uma convenção do app ("usuário escolheu explicitamente não tomar nada") que não tem significado no backend — se fosse enviado, o modelo de IA poderia interpretá-lo como um medicamento real chamado "nenhum".

| # | Nome do teste | Código/lógica testada | Dados de entrada | Resultado esperado |
|---|---|---|---|---|
| 40 | `mapeia todos os sintomas selecionados para true` | `crisis.symptoms.includes('nausea')` etc. para cada campo | `symptoms: ['nausea', 'aura', 'fonofobia']` | `sintomas_associados.nausea`, `.aura`, `.fonofobia` são `true` |
| 41 | `sintomas não selecionados ficam como false` | Mesmos `includes()` mas retornando `false` | `symptoms: ['nausea']` | `vomito`, `fotofobia`, `tontura` são `false` |
| 42 | `sem nenhum sintoma, todos ficam false` | Todos os `includes()` retornam `false` | `symptoms: []` | Todos os campos booleanos de `sintomas_associados` são `false` |
| 43 | `filtra "nenhum" da lista final` | `.filter((m) => m !== 'nenhum')` | `medications: ['nenhum', 'dipirona']` | `medicamentos_tomados` tem `'dipirona'` mas **não** `'nenhum'` |
| 44 | `inclui customMedications na lista final` | Spread `[...crisis.medications.filter(...), ...crisis.customMedications]` | `customMedications: ['Tylenol', 'Aspirina']` | `medicamentos_tomados` contém `'Tylenol'` e `'Aspirina'` |
| 45 | `combina medicamentos conhecidos e customizados` | Concatenação dos dois arrays | `medications: ['paracetamol']`, `customMedications: ['Tylenol']` | `medicamentos_tomados` contém ambos |
| 46 | `lista vazia quando não há medicamentos` | Caso base — sem medicamentos de nenhum tipo | Crise vazia | `medicamentos_tomados === []` |
| 47 | `copia triggers da crise para o resultado` | `[...crisis.triggers]` | `triggers: ['estresse', 'cafeína']` | `fatores_desencadeantes === ['estresse', 'cafeína']` |
| 48 | `retorna array vazio quando não há triggers` | Spread de array vazio | `triggers: []` | `fatores_desencadeantes === []` |
| 49 | `lado é mapeado corretamente` | `lado: crisis.side ?? null` | `side: 'esquerdo'` | `result.lado === 'esquerdo'` |
| 50 | `intensidade é preservada no campo intensidade_dor` | `intensidade_dor: crisis.intensity` | `intensity: 6` | `result.intensidade_dor === 6` |
| 51 | `campos não preenchidos ficam como null ou array vazio` | Valores padrão hardcoded na função | Crise vazia | `inicio_estimado` e `resumo` são `null`; `qualidade_dor` é `[]` |

---

## Grupo 10 — Constantes

**O que é:** Verificações de integridade das constantes exportadas — garantem que ninguém removeu acidentalmente um item importante ou quebrou a estrutura.

### 🗺️ Contexto no App

As constantes `INTENSITY_CONFIG`, `LOCATIONS`, `SYMPTOMS` e `MEDICATIONS` são usadas diretamente nas **telas do app** para gerar a UI dinamicamente:
- `INTENSITY_CONFIG` → a cor e o emoji do card de intensidade mudam com base no valor (linha 161 de `crisis.tsx`)
- `LOCATIONS` → as opções exibidas no modal de edição de localização
- `SYMPTOMS` → as tags de sintomas na tela de resumo (linha 164–166)
- `MEDICATIONS` → as tags de medicamentos (linha 167–169)

Se alguém remover um item de `SYMPTOMS` sem querer, o sintoma some da UI silenciosamente. Se a cor de `INTENSITY_CONFIG` para intensidade `10` for removida, o card fica sem cor. Esses testes atuam como uma **rede de segurança** para refatorações nas constantes.

| # | Nome do teste | Constante testada | Dados de entrada | Resultado esperado |
|---|---|---|---|---|
| 52 | `tem exatamente 11 itens (valores de 0 a 10)` | `INTENSITY_CONFIG` | — | `INTENSITY_CONFIG.length === 11` |
| 53 | `valores vão de 0 a 10 sem lacunas` | `INTENSITY_CONFIG` | Loop de 0 a 10 | Cada número inteiro de 0 a 10 está presente no array |
| 54 | `cada item tem todos os campos obrigatórios preenchidos` | `INTENSITY_CONFIG` | Loop por todos os 11 itens | `value` definido, `label`/`sublabel`/`emoji` truthy, `color` é hex válido (`#RRGGBB`) |
| 55 | `contém as localizações esperadas` | `LOCATIONS` | — | `ids` contém `'frontal'`, `'temporal'`, `'occipital'`, `'atras_olhos'`, `'difusa'` |
| 56 | `contém os 6 sintomas esperados` | `SYMPTOMS` | — | Array tem 6 itens com os ids corretos |
| 57 | `contém "nenhum" como opção` | `MEDICATIONS` | — | `ids` contém `'nenhum'` |
| 58 | `cada medicamento tem id, label e emoji` | `MEDICATIONS` | Loop por todos os itens | `id`, `label` e `emoji` são truthy para todos |
