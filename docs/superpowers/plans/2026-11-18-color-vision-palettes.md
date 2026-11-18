# Color Vision Accessibility Palettes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three complete, tested color-vision accessibility palettes and migrate remaining semantic color consumers without adding selection or persistence.

**Architecture:** Typed alternative palettes feed the existing `ColorThemeProvider` and `useColorPalette()` path. Pure test utilities evaluate actual UI pairs for WCAG contrast and use Machado matrices only as a screening metric.

**Tech Stack:** Expo SDK 54, React 19.1, TypeScript, NativeWind 4.2, Tailwind 3.4, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-18-color-vision-palettes-design.md`

## Global Constraints

- Do not modify `constants/colors.json`, PreferencesContext, AsyncStorage, authentication, clinical data, SQLite, Supabase, raster images, or PDF generation.
- Add no dependency, product control, light theme, or commit.
- Preserve the exact Original appearance and numeric pain semantics.
- Treat simulation as screening, not proof.

## Review Focus

- Every alternative must contain exactly the same 43 keys as Original with parseable RGB/alpha values.
- Text and essential component pairs must meet their stated 4.5:1 or 3:1 threshold, including composed alpha where used.
- Runtime switching must update roles, pain, mood, legacy, NativeWind variables, and JavaScript consumers without mutation.
- Original-only Emergency intensity literals must remain exact while alternatives use active pain tokens.
- Static consumer migration must not introduce hooks outside React components or alter business/data flows.

---

### Task 1: Typed palettes and accessibility tests

**Files:**
- Create: `constants/accessibilityPalettes.ts`
- Create: `constants/colorPalettes.ts`
- Create: `tests/colorAccessibility.test.mjs`
- Modify: `tests/colorPaletteContext.test.mjs`

**Interfaces:**
- Produces: `deuteranopiaPalette`, `protanopiaPalette`, `tritanopiaPalette`, `ColorPaletteMode`, and `colorPalettes`.

- [ ] Write failing tests for the 43-key shape, supported formats, variables, contrast pairs, screened semantic/pain separation, four-way reactivity, and Original immutability.
- [ ] Run tests and confirm failure because alternative palettes do not exist.
- [ ] Add the three complete palettes and registry using existing `ColorPalette` types.
- [ ] Tune only alternative values until structural and contrast tests pass.
- [ ] Run the complete Node suite.

### Task 2: Remaining semantic consumers

**Files:**
- Modify: audited Home, onboarding, Calendar, Crisis, Profile, AppLock-adjacent, and legacy Emergency consumers.
- Modify: `docs/dynamic-color-validation.md`

**Interfaces:**
- Consumes: `useColorPalette()` and alternative `pain` groups.
- Produces: render-time palette resolution with no static semantic imports in audited consumers.

- [ ] Migrate direct semantic colors to render-time hook values without changing Original values.
- [ ] Add a pure Emergency intensity resolver test that preserves its ten literals for Original and returns `pain[1..10]` for alternatives.
- [ ] Implement the resolver and retain white/component-specific literals only where no exact semantic token exists.
- [ ] Verify pain values, labels, accessibility values, persistence types, and synchronization files are unchanged.
- [ ] Run TypeScript and Node tests.

### Task 3: Compliance report and release validation

**Files:**
- Create: `docs/color-vision-accessibility-report.md`
- Modify: `docs/dynamic-color-validation.md`

**Interfaces:**
- Consumes: tested palettes, contrast results, and remaining audit.
- Produces: per-mode results, exceptions, rationale, and Android/iOS visual checklist.

- [ ] Record every palette value and tested real-interface contrast pair by mode.
- [ ] Report Original failures separately, simulation-screening limits, raster/PDF exclusions, and remaining literals.
- [ ] Add manual Android/iOS coverage for all four modes, navigation, modals, graphs, pain scale, and runtime switching.
- [ ] Run Node tests, TypeScript, Tailwind compilation, Android export, iOS export, and `git diff --check`.
- [ ] Self-review the full diff because independent agent review is not authorized.

## Self-review

The plan covers palette completeness, technical rationale, WCAG pairs, CVD screening, reactive switching, remaining consumers, pain semantics, exclusions, documentation, and every requested build. Commit steps are intentionally omitted because the user prohibited commits.
