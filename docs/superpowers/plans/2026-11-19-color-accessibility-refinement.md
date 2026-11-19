# Color Accessibility Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir os achados confirmados de contraste e tipografia da Etapa 6 sem alterar paletas globais, dados clínicos ou fluxos.

**Architecture:** Correções localizadas ficam nas primitivas e telas consumidoras. Regras reutilizadas por mais de um componente ficam em módulos puros testáveis; o PDF mantém uma paleta clara própria. Riscos sem evidência objetiva permanecem documentados.

**Tech Stack:** React Native 0.81, Expo SDK 54, NativeWind 4, TypeScript e `node:test`.

**Spec:** `docs/color-vision-functional-accessibility-audit.md`

## Global Constraints

- Não alterar `constants/colors.json` nem as quatro paletas.
- Não modificar autenticação, dados clínicos, SQLite, Supabase ou sincronização.
- Não adicionar dependências, recriar a visualização web, usar EAS ou fazer commits.
- Preservar as pistas numéricas, textuais e geométricas.

## Review Focus

- Texto de apoio selecionado deve passar 4,5:1 nas quatro paletas.
- Intensidades 9/10 no Original devem ganhar contorno sem mudar cor, valor ou ordem.
- Emergência deve respeitar toda a tipografia e manter texto com 4,5:1.
- PDF deve manter conteúdo e cálculos, com pares reais acima dos limites WCAG.
- Hidratação, imagens e gráficos só mudam com solução comprovadamente mais segura.

---

### Task 1: OptionCard

**Files:** `components/ui/OptionCard.tsx`, `components/ui/optionCardPresentation.ts`, `tests/colorAccessibility.test.mjs`

- [x] Testar a estratégia de texto de apoio nos estados selecionado, não selecionado e desabilitado.
- [x] Usar `content` somente sobre `primarySubtle` e preservar `contentMuted` sobre `surfaceRaised`.
- [x] Verificar o teste de contraste.

### Task 2: Escala de dor Original

**Files:** `constants/painPresentation.ts`, `features/crisis/components/IntensityScale.tsx`, `features/calendar/components/CalendarDay.tsx`, `tests/painPresentation.test.mjs`

- [x] Testar que somente Original 9/10 exige contorno adicional.
- [x] Aplicar contorno aos marcadores/barras e ao indicador do calendário sem mudar `pain-*`.
- [x] Verificar valores 0–10 e classes dinâmicas.

### Task 3: Emergência

**Files:** `features/crisis/EmergencyScreen.tsx`, `tests/colorAccessibility.test.mjs`

- [x] Testar os pares de texto usados após a correção.
- [x] Migrar todos os textos para a primitiva `Text` e variantes tipográficas existentes.
- [x] Manter o fundo de intensidade e colocar o número Original sobre núcleo de alto contraste.
- [x] Verificar fluxo e tipagem.

### Task 4: PDF acessível

**Files:** `features/profile/pdfPresentation.ts`, `features/profile/usePdfExport.ts`, `tests/pdfAccessibility.test.mjs`

- [x] Testar contraste dos pares reais e a associação das três bandas de intensidade.
- [x] Centralizar a paleta de impressão e interpolá-la no HTML sem mudar conteúdo/cálculos.
- [x] Verificar todos os pares e o TypeScript.

### Task 5: Riscos, documentação e validação

**Files:** `features/profile/ProfileScreen.tsx`, `docs/color-vision-functional-accessibility-audit.md`

- [x] Atualizar a descrição de Aparência para incluir cores.
- [x] Manter hidratação, imagens e gráficos sem mudança, documentando a decisão e o risco.
- [x] Executar testes, TypeScript, Tailwind, exports Android/iOS e `git diff --check`.
