# Color Mode Preference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users select and persist any of the four existing color palettes from Appearance, applying the selection globally and immediately.

**Architecture:** Add one normalized field to the existing preference payload and serialize its writes. Bridge that single preference state into the existing color provider, whose context exposes both the palette and its explicit identifier.

**Tech Stack:** React 19, React Native 0.81, Expo SDK 54, Expo Router, NativeWind 4, AsyncStorage 2.2, Node test runner, TypeScript 5.9.

**Spec:** `docs/superpowers/specs/2026-11-18-color-mode-preference-design.md`

## Global Constraints

- Do not change any value in the four palettes or `constants/colors.json`.
- Do not add dependencies, storage keys, account synchronization, routes, themes, clinical-data changes, or commits.
- Keep `ColorPaletteMode` as the only mode identifier and `PreferencesContext` as the only owner of the selected mode.
- Preserve typography behavior, splash hydration, local-first behavior, navigation, modals, and PDF/image handling.

## Review Focus

- A read completing after a local change must not overwrite that change.
- Two writes resolving in reverse natural latency must still persist the latest state last.
- Old v1 payloads and malformed/invalid values must preserve valid typography and safely select Original.
- A copied Original palette must still receive Original-only presentation through the explicit mode.
- Appearance selection must expose radio semantics, checked state, adequate touch area, and non-color indication.

---

### Task 1: Pure preference schema and persistence behavior

**Files:**
- Create: `constants/colorPaletteMode.ts`
- Create: `contexts/preferencesPersistence.ts`
- Modify: `constants/colorPalettes.ts`
- Modify: `constants/typography.ts`
- Test: `tests/preferencesPersistence.test.mjs`

**Interfaces:**
- Produces: `ColorPaletteMode`, `isColorPaletteMode()`, `selectColorPalette()`, `interpretPreferences()`, `serializePreferences()`, `mergePreferences()`, `shouldApplyHydration()`, and `createPreferenceWriteQueue()`.

- [ ] Write tests for missing, old, valid, invalid and malformed payloads; typography preservation; merge/reset data; identifier selection; late hydration; and ordered writes.
- [ ] Run the test and confirm failures are caused by the missing modules/APIs.
- [ ] Implement the minimal pure schema and queue functions, re-exporting the single mode type from `colorPalettes.ts`.
- [ ] Run the preference test and the complete suite.

### Task 2: Context persistence and global color bridge

**Files:**
- Modify: `contexts/PreferencesContext.tsx`
- Modify: `contexts/ColorPaletteContext.ts`
- Modify: `contexts/ColorThemeContext.tsx`
- Modify: `app/_layout.tsx`
- Test: `tests/colorPaletteContext.test.mjs`

**Interfaces:**
- Consumes: normalized `Preferencias.modoDeCores` and `colorPalettes`.
- Produces: `useColorPaletteMode(): ColorPaletteMode`; global palette selection derived from preferences.

- [ ] Extend context tests to assert reactive palette and explicit mode updates without remounting.
- [ ] Run the context test and confirm it fails because mode is not exposed.
- [ ] Carry `{ palette, mode }` in the pure color context while preserving `useColorPalette()`.
- [ ] Use the persistence helpers and one queue in `PreferencesProvider`, retaining the late-hydration guard.
- [ ] Add a root bridge that resolves `colorPalettes[preferencias.modoDeCores]` and passes mode plus palette to `ColorThemeProvider`.
- [ ] Run focused and complete tests.

### Task 3: Accessible Appearance selection and explicit Original behavior

**Files:**
- Modify: `components/ui/OptionCard.tsx`
- Modify: `features/preferences/AppearanceScreen.tsx`
- Modify: `components/ui/PulsingMic.tsx`
- Modify: `features/crisis/EmergencyScreen.tsx`

**Interfaces:**
- Consumes: `usePreferences()`, `colorPalettes`, and `useColorPaletteMode()`.
- Produces: the Visão de cores radio group with four described options and decorative previews.

- [ ] Extend `OptionCard` with an optional decorative `previewColors` row while preserving existing call sites.
- [ ] Add the four accessible radio options to Appearance and announce selection/reset changes.
- [ ] Replace Original reference equality with `mode === 'original'` in Emergency and `PulsingMic`.
- [ ] Run TypeScript and the complete automated suite.

### Task 4: Documentation and release-level validation

**Files:**
- Create: `docs/color-mode-preference-validation.md`

**Interfaces:**
- Produces: migration description and Android/iOS manual validation route.

- [ ] Document storage compatibility, immediate switching, navigation/modal/pain/calendar/mood checks, restart persistence, and reset.
- [ ] Run all Node tests and TypeScript.
- [ ] Compile Tailwind and export Android and iOS.
- [ ] Run `git diff --check`, inspect scope, and report any device-validation limitation.
