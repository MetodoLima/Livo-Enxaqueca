# Dynamic Colors Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Disponibilizar a paleta original em runtime para JavaScript e NativeWind 4 sem qualquer alteração visual ou persistida.

**Architecture:** `colors.json` permanece como fonte única. Funções puras derivam variáveis raw/RGB/alpha; um provider global entrega a mesma paleta por Context e `vars()`, e o React Navigation deriva seu tema desse contexto.

**Tech Stack:** TypeScript, React 19, React Native 0.81, Expo 54, NativeWind 4, Tailwind CSS 3.

**Spec:** `docs/superpowers/specs/2026-11-18-dynamic-colors-design.md`

## Global Constraints

- Não criar paletas alternativas, preferência persistida ou controles de interface.
- Não alterar cores, tipografia, navegação, autenticação, dados clínicos ou sincronização.
- Não adicionar dependências e não criar commits.
- Usar apenas APIs do NativeWind 4 e Expo SDK 54.

## Review Focus

- `rgba()` deve manter valor raw e alpha, sem gerar CSS inválido.
- Hex curto e hex com alpha devem ser interpretados corretamente para futuras paletas.
- Valores CSS não interpretáveis devem continuar disponíveis como raw, sem inventar canais.
- Variáveis devem atravessar a árvore do Expo Router; portais nativos exigem validação em dispositivo.
- A referência da paleta deve permanecer estável para evitar rerenders desnecessários.

---

### Task 1: Modelo de paleta e variáveis

**Files:**
- Modify: `constants/Colors.ts`
- Create: `constants/colorTheme.ts`
- Create: `tests/colorTheme.test.mjs`

**Interfaces:**
- Produces: `ColorPalette`, `originalPalette`, `createColorVariables(palette)` e `parseColor(value)`.

- [ ] Escrever testes com valores literais para paleta original, RGB, alpha e formatos suportados.
- [ ] Executar `node --test --experimental-strip-types tests/colorTheme.test.mjs` e confirmar falha pela ausência do módulo.
- [ ] Implementar o modelo e as funções puras mínimas.
- [ ] Executar o teste novamente e confirmar sucesso.

### Task 2: Provider global e prova de conceito

**Files:**
- Create: `contexts/ColorThemeContext.tsx`
- Modify: `tailwind.config.js`
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: `ColorPalette`, `originalPalette`, `createColorVariables`.
- Produces: `ColorThemeProvider` e `useColorPalette`.

- [ ] Adicionar teste estrutural que carrega a configuração Tailwind com um preset substituto e verifica os seis tokens dinâmicos.
- [ ] Confirmar que o novo teste falha antes da integração.
- [ ] Implementar o provider com `vars()` e instalar no ancestral do Expo Router.
- [ ] Calcular o `DarkTheme` do React Navigation dentro de `RootLayoutNav` usando `useColorPalette`.
- [ ] Executar os testes e o TypeScript.

### Task 3: Verificação final

**Files:**
- Inspect: todos os arquivos alterados e `contexts/PreferencesContext.tsx`

**Interfaces:**
- Consumes: infraestrutura concluída.

- [ ] Confirmar por diff que `colors.json` e a persistência de preferências não mudaram.
- [ ] Executar testes, TypeScript e lint disponível.
- [ ] Executar uma exportação/bundle Expo se as dependências e o ambiente permitirem.
- [ ] Registrar explicitamente a ausência de validação Android/iOS se não houver dispositivo/emulador.
