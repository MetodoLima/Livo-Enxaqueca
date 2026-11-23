# Color mode preference design

## Intent

Expose the four existing Livo color palettes in Appearance, persist the selected mode with the existing local preferences, and apply it globally without restarting or remounting the application. Selection must remain understandable without color and preserve all typography preferences and existing clinical behavior.

## Constraints

- `ColorPaletteMode` remains the single typed identifier for `original`, `deuteranopia`, `protanopia`, and `tritanopia`.
- The existing `livo.preferencias.v1` AsyncStorage entry remains the only preference store. The additive `modoDeCores` field defaults to `original`; no account sync or storage key migration is introduced.
- The four palette values and `colors.json` remain unchanged.
- `PreferencesContext` owns the mode. `ColorThemeProvider` receives the derived palette and explicit mode but owns no competing state.
- The existing splash/hydration gate remains responsible for keeping preferences-dependent UI hidden until hydration completes.

## Approaches considered

1. **Add an optional field to the existing v1 payload (selected).** Normalize old, invalid, and malformed values to defaults; serialize writes through one queue. This is backward-compatible, preserves typography, and keeps one preference source.
2. **Use a second AsyncStorage key.** Rejected because hydration, reset, and write ordering would span two stores and create avoidable consistency problems.
3. **Bump the storage version and migrate the full payload.** Rejected because this is an additive field whose absence has an unambiguous default. A version bump increases data-loss risk without adding schema safety.

## Design

Pure persistence helpers parse, normalize, merge, serialize, and queue preference writes independently of React Native. `PreferencesProvider` retains its late-read guard and adds an ordered write queue so consecutive changes cannot finish out of order. Reset uses the complete default object, including `modoDeCores: original`.

The color context carries `{ palette, mode }` as one value. `useColorPalette()` keeps its existing return type and a new `useColorPaletteMode()` reads the explicit identifier. At the application root, a small bridge reads `preferencias.modoDeCores`, resolves it through `colorPalettes`, and passes both values to `ColorThemeProvider`. Because visible content is still gated by `pronto`, a saved mode is applied before the splash is hidden whenever hydration finishes normally.

Appearance uses the existing `OptionCard` radio pattern inside an accessible radiogroup. Every option has a name, description, checked state, shape-based radio indicator, and a compact decorative palette preview. Selecting an option updates `PreferencesContext` immediately and announces the new mode.

The Emergency screen and `PulsingMic` use `useColorPaletteMode()` for Original-specific presentation. No behavior depends on object identity.

## Tests and validation

Node tests cover old/missing/valid/invalid/malformed payloads, typography preservation, merging, reset, ordered persistence, late-hydration protection, mode selection, reactive palette/mode updates, and four-palette integrity. Existing color tests continue to cover runtime variables and palette values. TypeScript, Tailwind compilation, Android/iOS Expo exports, and `git diff --check` provide integration checks. Native visual behavior remains a manual Android/iOS validation item.
