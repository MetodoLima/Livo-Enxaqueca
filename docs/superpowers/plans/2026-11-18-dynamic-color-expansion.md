# Dynamic Color Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every existing semantic color token and prioritized shared component react to a runtime palette without changing the current appearance.

**Architecture:** A pure React palette context is the only active-palette source. A reusable NativeWind scope consumes it and reapplies `vars()` at the root and inside native modals; direct JavaScript consumers use the same context hook.

**Tech Stack:** Expo SDK 54, React 19.1, React Native, NativeWind 4.2, Tailwind CSS 3.4, TypeScript, Node test runner, react-test-renderer 19.1.

**Spec:** `docs/superpowers/specs/2026-11-18-dynamic-color-expansion-design.md`

## Global Constraints

- Preserve `constants/colors.json` unchanged as the original-palette source.
- Add no dependency and use no NativeWind 5 API.
- Do not change PreferencesContext, AsyncStorage, Appearance, light theme, clinical data, authentication, synchronization, or PDF generation.
- Do not add colorblind palettes or user controls.
- Do not commit automatically.

## Review Focus

- A token with intrinsic alpha must retain it and multiply it by a Tailwind opacity modifier.
- Every key in roles, pain, mood, and legacy must have raw, RGB, and alpha variables and a Tailwind runtime mapping.
- Replacing a provider palette must synchronously update hook consumers without remounting the app.
- Modal variable scopes must consume the existing context rather than establish independent state.
- Existing static exports (`color`, `painColor`, `moodColor`, `Colors`) must preserve their exact API and values.

---

### Task 1: Pure palette context and complete token mapping

**Files:**
- Create: `contexts/ColorPaletteContext.ts`
- Modify: `contexts/ColorThemeContext.tsx`
- Modify: `tailwind.config.js`
- Modify: `tests/colorTheme.test.mjs`
- Create: `tests/colorPaletteContext.test.mjs`

**Interfaces:**
- Produces: `ColorPaletteProvider`, `useColorPalette`, `ColorVariableScope`, and all-token Tailwind color expressions.

- [ ] Write failing tests for all group keys, alpha composition, static export compatibility, and context palette replacement.
- [ ] Run the isolated Node tests and confirm the new assertions fail.
- [ ] Add the pure context and refactor `ColorThemeProvider` to compose it with `ColorVariableScope`.
- [ ] Map every Tailwind semantic color to RGB/alpha variables.
- [ ] Run the isolated tests and confirm they pass.

### Task 2: Shared component runtime consumers and modal scopes

**Files:**
- Modify: `components/ui/Button.tsx`, `IconButton.tsx`, `LoadingState.tsx`, `OptionCard.tsx`, `SwitchRow.tsx`, `TextField.tsx`, `TimeWheel.tsx`, `PulsingMic.tsx`
- Modify: `components/ui/tone.ts`, `Chip.tsx`, `IconBadge.tsx`, `Notice.tsx`
- Modify: `components/ui/Dialog.tsx`
- Modify: raw app-lock modal hosts if audit proves they bypass the shared dialog.

**Interfaces:**
- Consumes: `useColorPalette(): ColorPalette`, `ColorVariableScope`.
- Produces: no API changes; colors are resolved during render.

- [ ] Add source-level regression assertions preventing prioritized UI files from importing static palette values.
- [ ] Run tests and confirm those assertions identify the current static consumers.
- [ ] Replace module-level derived colors with render-time hook lookups or a custom tone hook.
- [ ] Wrap native modal content in `ColorVariableScope` without adding a palette provider.
- [ ] Run tests and TypeScript verification.

### Task 3: Navigation, pain-scale coverage, audit, and full verification

**Files:**
- Modify: `app/(tabs)/_layout.tsx`
- Create: `docs/dynamic-color-validation.md`
- Test: `tests/colorTheme.test.mjs`

**Interfaces:**
- Consumes: runtime palette hook and all-token Tailwind mapping.
- Produces: reactive tab colors, fixed-color inventory, and native-device acceptance checklist.

- [ ] Add tests proving pain/mood/legacy tokens and opacity classes compile to runtime expressions.
- [ ] Migrate static tab-navigation colors; verify React Navigation already consumes the runtime hook.
- [ ] Confirm IntensityScale, CalendarDay, and graph/indicator classes resolve through dynamic pain tokens without changing stored values.
- [ ] Audit remaining literals by category and write an Android/iOS runtime-switch checklist covering navigation, shared controls, pain scale, dialogs, and raw modals.
- [ ] Run Node tests, TypeScript, Tailwind compilation, Android export, iOS export, and `git diff --check`; record all results and limitations.

## Self-review

All requested groups, reactivity paths, modal behavior, shared components, navigation, pain-scale presentation, audit categories, build targets, and explicit exclusions map to a task. The plan intentionally omits commit steps because the user prohibited commits, and it uses inline/native execution because delegation is not authorized in this session.
