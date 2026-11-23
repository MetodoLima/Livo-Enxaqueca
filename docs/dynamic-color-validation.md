# Dynamic color validation and remaining-color audit

## Automated coverage

The Node tests use a deliberately different palette only in `tests/`. They verify that:

- all 43 original tokens in `roles`, `pain`, `mood`, and `legacy` produce raw, RGB-channel, and alpha variables;
- every Tailwind semantic token resolves through those runtime variables;
- intrinsic alpha and Tailwind opacity are composed rather than replacing one another;
- changing the pure context provider updates JavaScript consumers without remounting the renderer;
- changing test colors in each semantic group changes the corresponding generated variables without mutating `colors.json`.

These tests do not prove React Native rendering. `react-test-renderer` is limited to the pure React context test and matches React 19.1.0; its deprecation warning is expected and the file can be replaced independently.

## Manual Android and iOS checklist

Run this checklist separately on a physical device or emulator/simulator for each platform.

1. Build and open the unchanged original palette. Compare the login/setup flow, Home, Calendar, crisis recording, Insights, Profile, and Appearance with the previous build.
2. In a test-only local instrumentation that is never committed, pass an alternate `ColorPalette` to the existing `ColorThemeProvider` and switch the prop from original to alternate with React state after the app is already mounted. Use visibly different values in `roles`, `pain`, `mood`, and `legacy`; do not add a product preference or AsyncStorage entry.
3. While staying on one screen, switch the palette twice. Confirm that NativeWind backgrounds, text, borders, and opacity variants update immediately without a reload.
4. Confirm direct JavaScript consumers update at the same time: Lucide icons, `ActivityIndicator`, `Switch`, `TextInput` selection/placeholder colors, the pulsing microphone, and tab active/inactive colors.
5. Navigate between tabs after each switch. Confirm the tab bar and React Navigation background remain coherent and no navigation state is lost.
6. Open a shared `Dialog` (for example Profile → Export data or sign-out confirmation), switch while it is open, and verify its scrim, surface, border, text, icons, and buttons.
7. Open Profile → Security and the global AppLock modal. Switch while each native `Modal` is open and verify both class-based and JavaScript colors. Close and reopen to ensure the scope is reapplied.
8. Exercise the 0–10 `IntensityScale`, Calendar days with `bg-pain-N/30`, calendar intensity indicators, crisis list markers, and Insights bars. Confirm only presentation changes: selected values and saved clinical records must remain identical.
9. Verify `scrim` retains its original 0.6 alpha and that Calendar pain backgrounds retain the 30% modifier under both palettes.
10. Restore the original palette without restarting. Confirm the original visual values return immediately, then remove the test-only instrumentation and run `git diff --check`.

Until this device checklist is executed, native `Modal` variable propagation, native control repainting, and React Navigation repainting remain build-validated but not visually proven.

## Remaining-color audit

### 1. Semantic application colors using static JavaScript exports

The audited Home, onboarding, Calendar, Crisis, and Profile consumers now resolve semantic colors through `useColorPalette()` during render. The remaining `Colors.ts` import in `EmergencyScreen` is only the `originalPalette` identity needed to preserve that legacy screen's exact Original intensity colors.

### 2. Images and decorative/informational artwork

Raster artwork under `assets/images/`, especially `assets/images/crisis/intensity/` and `assets/images/crisis/locations/`, is not transformed by CSS variables. These files need a separate accessibility review because recoloring the application palette cannot alter embedded pixels. No image was modified in this stage.

### 3. Legacy component-specific colors

`features/crisis/EmergencyScreen.tsx` keeps its fixed intensity array only for Original. Deuteranopia, protanopia, and tritanopia use the active semantic pain scale. Original white text and the translucent emerald completion decoration remain deliberate exact-appearance exceptions.

`components/ui/PulsingMic.tsx` uses dynamic `pain[7]` for its existing `#EF4444` surface. Its stop icon remains exactly white in Original and uses `canvas` in the adapted modes to retain contrast on their lighter pain colors.

### 4. Document export colors

`features/profile/usePdfExport.ts` contains an independent light document palette and intensity colors inside generated HTML. PDF generation is intentionally unchanged and does not inherit the runtime application palette.

## Pain-scale data boundary

`IntensityScale`, `CalendarDay`, calendar indicators, crisis markers, and the current bar components use semantic class names that now resolve dynamically. Their numeric values, `INTENSITY_CONFIG`, persisted records, repository payloads, and synchronization code were not changed. The intensity images remain fixed raster assets as noted above.

The implemented palette values, contrast results, collision screening, remaining exceptions, and four-mode device checklist are documented in `docs/color-vision-accessibility-report.md`.
