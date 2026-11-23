# Color Vision Accessibility Palettes Design

## Intent

Add complete deuteranopia, protanopia, and tritanopia adaptations to the existing runtime palette system. The palettes improve distinguishability; they do not simulate color-vision deficiency and do not claim clinical validation.

## Constraints

- `constants/colors.json` and the Original palette remain byte-for-byte unchanged.
- Each alternative has all 43 `ColorPalette` tokens and is selectable through the existing `ColorThemeProvider` prop.
- No preference UI, persistence, new dependency, raster-image change, PDF change, data-model change, or business-flow change.
- Existing original visuals are preserved while remaining static JavaScript consumers are migrated.

## Approaches considered

1. **Mathematical correction filter:** rejected. A simulation/correction matrix is not a semantic palette and cannot preserve intentional hierarchy reliably.
2. **One universal alternative palette:** simpler, but it ignores the materially different blue/yellow confusions of tritanopia and the brightness loss affecting reds in protanopia.
3. **Three curated semantic palettes with objective checks:** selected. Neutrals remain stable; categorical roles, pain, mood, and matching legacy accents are adjusted per deficiency. WCAG contrast and CVD simulation are screening gates, while labels, numbers, position, and device/user review remain required.

## Palette strategy

- Preserve canvas, surface, raised surface, content, muted content, lines, and scrim when their contrast is already adequate. This keeps Livo visually recognizable.
- For deuteranopia and protanopia, separate states primarily with cyan/blue, amber, and rose/magenta families plus deliberate luminance differences instead of red/green opposition.
- For tritanopia, avoid relying on blue/yellow opposition; use teal/green, orange, and rose families with stronger lightness separation.
- Keep subtle surfaces dark and pair them with brighter semantic foregrounds. Keep `primaryStrong` dark enough for existing light button text.
- Make each alternative pain scale progress from a cool/low band through a warm/middle band into a rose/high band. Values, order, position, labels, accessibility values, and storage remain unchanged.
- Mood colors reuse each mode's semantic families so “terrible/bad/so-so/okay/great” remains consistent with danger/attention/primary/success.
- Legacy neutrals remain stable; legacy accent tracks the mode's primary and legacy purple/orange track the closest adapted semantic families.

## Objective validation

Real interface pairs are tested rather than all token permutations:

- normal text on canvas/surface/raised and subtle surfaces: 4.5:1;
- large/essential graphical semantic foregrounds: 3:1;
- button content on `primaryStrong`: 4.5:1;
- semantic foreground on matching subtle surface: 3:1;
- pain markers against canvas: 3:1.

Original-palette failures are reported but never fixed in this stage. Semi-transparent Calendar pain backgrounds are not treated as standalone signals because the interface also has a solid marker, numeric/detail views, and accessible labels.

The Machado model at full deficiency is used only to flag likely collisions between primary, attention, danger, and success and between low/mid/high pain bands. It is not treated as proof of accessibility.

## Technical references

- WCAG 2.2 use of color, minimum contrast, and non-text contrast: https://www.w3.org/TR/WCAG22/
- W3C explanation that contrast must be checked for pairs actually presented together: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Color Universal Design guidance by Okabe and Ito: https://jfly.uni-koeln.de/color/
- Machado, Oliveira, and Fernandes CVD simulation model: https://pubmed.ncbi.nlm.nih.gov/19834201/

## Integration and migration

Alternative palettes live in a dependency-free typed module; a registry combines them with `originalPalette`. Existing providers and hooks remain unchanged. Remaining static application consumers migrate to `useColorPalette()` during render. The Emergency screen keeps its exact Original-only custom intensity colors and uses dynamic `pain` colors for alternative palettes because those literals have no matching original semantic tokens.

## Acceptance boundary

Automated tests and native exports establish structural, contrast, and build correctness. They do not establish how real users perceive the palettes. Android/iOS inspection and user evaluation with people who have the relevant color-vision deficiencies remain necessary before product release.
