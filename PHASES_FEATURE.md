# Histórico de Fases da Crise — Estado do Código

## O que foi feito

Adicionada a funcionalidade de **fases de crise**: durante um episódio ativo o usuário
pode registrar vários "momentos" da mesma crise (a dor mudou de localização, a
intensidade subiu, começou a tomar outro medicamento etc.). Cada fase fica visível
na tela de resumo como um card colapsável com o intervalo de tempo e os detalhes.

---

## Arquivos alterados e o que mudou em cada um

### `contexts/CrisisContext.tsx`
**Antes:** guardava apenas `activeCrisis: CrisisRecord | null`.  
**Depois:** guarda também `phases: CrisisRecord[]` (fases já confirmadas) e expõe
`addPhase()`.

Comportamento de `addPhase()`:
1. Define `endTime = now` na fase atual (se ainda não tiver).
2. Empurra essa fase para `phases[]`.
3. Cria um novo `activeCrisis` em branco com `startTime = endTime` anterior e com
   `location`/`side` pré-preenchidos da fase anterior.

`clearCrisis()` agora também limpa `phases[]`. `saveCrisis()` (chamado pelo wizard)
reseta `phases[]` para garantir estado limpo a cada novo registro.

---

### `services/crisisService.ts`
**Antes:** `saveCrisisToSupabase(crisis)` inseria exatamente 1 `registro_crise`.  
**Depois:** `saveCrisisToSupabase(crisis, phases = [])` monta
`allPhases = [...phases, crisis]` e insere **um `registro_crise` por fase**.

A função privada `savePhaseToSupabase(criseId, phase)` encapsula a lógica de salvar
sintomas, medicamentos e gatilhos de uma única fase.

O `crise_enxaqueca` (o "evento pai") usa:
- `inicio_crise` = startTime da **primeira** fase
- `fim_crise`    = endTime da **última/atual** fase

> **Compatibilidade com o banco:** a tabela `registro_crise` já tinha `crise_id`
> como FK para `crise_enxaqueca`, então múltiplos registros por crise já eram
> suportados pelo schema. Nenhuma migração necessária.

---

### `components/crisis/EditModals.tsx`
**Adicionado:** `MedicationsEditor` — bottom sheet com grid de medicamentos, campo
de texto livre para remédio customizado e opção "Nenhum", espelhando a lógica do
`StepMedication.tsx` do wizard.

---

### `app/(tabs)/crisis.tsx`
- **`PhaseCard`** (novo componente): card colapsável para cada fase confirmada.
  Mostra localização + lado mesmo quando colapsado.
- **Lista de fases anteriores** renderizada acima da seção editável, separada por
  um divisor "Fase N".
- **Botão "Registrar nova fase"** reposicionado logo após o card de medicamentos,
  com visual roxo distinto (não mais dashed border igual ao botão de voz).
- **Card de Medicamentos** agora tem `onPress` + `ChevronRight` e abre
  `MedicationsEditor`.
- `handleFinish` agora passa `phases` para `saveCrisisToSupabase`.

---

## Situação com o banco de dados

### Schema atual (sem alterações)

```
crise_enxaqueca
  id, user_id, inicio_crise, fim_crise

registro_crise                   ← uma ou mais por crise
  id, crise_id (FK), intensidade_dor, regiao_dor, lado,
  nivel_incapacidade, resumo, created_at

sintoma_registro_crise           ← N por registro
medicamentos_registro_crise      ← N por registro
fatores_desencadeantes_registro_crise  ← N por registro
```

**O schema já suporta múltiplos `registro_crise` por `crise_enxaqueca`.**
O código anterior simplesmente não aproveitava isso — inseria sempre um único.
Agora insere um por fase.

### O que os hooks de leitura já fazem corretamente

| Hook | Comportamento com múltiplos registro_crise |
|---|---|
| `useCrisisCalendar` | Usa o **último** registro como snapshot principal (intensidade/localização mais recente) e **mescla** sintomas e medicamentos de todos |
| `useInsights` | Itera sobre todos os `registro_crise` de cada crise — funciona sem alteração |
| `useQualitativeAnalysis` | Idem — já iterava sobre o array `registro_crise` |

> Esses hooks **não precisam de alteração**.

---

## Próximas etapas (o que ainda falta amarrar)

### 1. Tela de detalhe `crisis/[id].tsx` — mostrar fases
**Situação atual:** a tela recebe um objeto JSON via parâmetro de URL com os dados
de **um único** `registro_crise` (populado por `useCrisisCalendar`). Com múltiplas
fases, ela ainda mostrará apenas o último registro.

**O que fazer:**
- Opção A (simples): exibir uma seção "Fases" que lista todos os `registro_crise`
  da crise, igual ao `PhaseCard` da tela de resumo.
- Opção B (completa): fazer o `[id].tsx` buscar os dados diretamente do Supabase
  pelo `id` da crise em vez de receber via params, para ter acesso a todos os
  `registro_crise`.

**Código relevante:** `app/crisis/[id].tsx` linha 110 — o parse de `params.data`
vem de onde? Verificar `useCrisisCalendar` → `rowToCrisis` que serializa apenas
o último registro. A rota `crisis/[id]` provavelmente é chamada passando este
objeto como string.

---

### 2. Timestamp por fase no banco (opcional mas recomendado)
**Situação atual:** as fases são ordenadas por `created_at` (auto-inserido pelo
Supabase). Isso funciona na prática mas é implícito.

**O que fazer:** adicionar colunas `inicio_fase` e `fim_fase` na tabela
`registro_crise` e populá-las em `savePhaseToSupabase`.

```sql
alter table registro_crise
  add column inicio_fase timestamptz,
  add column fim_fase    timestamptz;
```

Em `crisisService.ts`, dentro do insert de cada fase:
```ts
inicio_fase: phase.startTime.toISOString(),
fim_fase:    phase.endTime?.toISOString() ?? null,
```

Isso permite exibir o intervalo de cada fase na tela de detalhe histórica sem
depender de `created_at`.

---

### 3. Estado persistente entre sessões (AsyncStorage / Supabase draft)
**Situação atual:** `CrisisContext` é estado em memória — se o app fechar com uma
crise ativa e fases, tudo é perdido.

**O que fazer:** persistir `activeCrisis` + `phases` em `AsyncStorage` (ou como
rascunho no Supabase) e recarregar no boot.

Arquivo: criar `services/crisisDraftService.ts` com `saveDraft` / `loadDraft` /
`clearDraft`, chamados em cada mutação do `CrisisContext`.

---

### 4. Confirmação antes de registrar nova fase (UX)
**Situação atual:** tocar em "Registrar nova fase" confirma imediatamente sem feedback.

**O que fazer (opcional):** exibir um pequeno modal de confirmação ("Isso vai
fechar a fase atual às HH:MM. Continuar?") antes de chamar `addPhase()`.

---

## Resumo rápido do que NÃO mudou

- Fluxo do wizard de 5 passos (`record-crisis.tsx`) — intacto
- Autenticação e lookup de usuário no Supabase — intacto
- Hooks de leitura (`useCrisisCalendar`, `useInsights`, `useQualitativeAnalysis`) — intactos
- Tela de calendário, insights e perfil — intactas
- Schema do banco — sem alterações
