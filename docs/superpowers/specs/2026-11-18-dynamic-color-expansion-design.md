# Dynamic Color Expansion Design

## Objective

Expand the existing NativeWind 4 color-variable proof of concept to every semantic token, keep one reactive palette source for JavaScript and CSS-variable consumers, and migrate the shared UI primitives that currently capture static colors.

## Architecture

The active `ColorPalette` lives in a pure React context. `ColorThemeProvider` owns no independent state: it supplies the palette to that context and renders `ColorVariableScope`, which derives NativeWind `vars()` from the same context value. Additional scopes, including those placed inside React Native `Modal` content, only reapply variables and never create another palette provider.

`colors.json` remains the original-palette source. Every Tailwind color emitted from `roles`, `pain`, `mood`, and `legacy` resolves through RGB channel and alpha variables. The expression combines the token's intrinsic alpha with Tailwind's opacity modifier, so both `bg-scrim` and forms such as `bg-pain-6/30` retain their meaning.

Shared components read direct JavaScript colors through `useColorPalette()` during render. Static class-name maps remain valid because their resolved Tailwind colors become dynamic. A deliberately different palette exists only inside tests and is never exported to the application.

## Scope

- Pure palette context separated from NativeWind/React Native integration.
- All semantic Tailwind tokens made runtime-variable based.
- Shared UI direct-color consumers migrated, including tone helpers and modal scope.
- Navigation tabs and React Navigation palette consumers made reactive.
- Existing pain-scale class consumers verified against dynamic tokens without altering clinical data.
- Fixed-color audit and Android/iOS manual validation checklist documented.

## Exclusions

- No deuteranopia, protanopia, or tritanopia palette.
- No preference, AsyncStorage, Appearance screen, light theme, clinical-data, authentication, sync, or PDF-generation changes.
- No dependency additions and no commits.

## Verification

Node tests cover exact original values, every group/token, intrinsic transparency, Tailwind opacity expressions, legacy exports, and palette replacement in the pure React context using the already installed React 19-compatible renderer. TypeScript, Tailwind compilation, Android/iOS Expo exports, and diff integrity are run separately. Device rendering remains a manual acceptance step.
