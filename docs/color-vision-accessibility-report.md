# Color-vision accessibility palette report

## Scope and interpretation

The three alternatives are corrective semantic palettes, not simulations of how a person sees. WCAG 2.2 contrast is an objective gate; Machado full-deficiency matrices are used only to screen likely color collisions. Neither replaces Android/iOS inspection or evaluation with people who have the corresponding color-vision deficiency.

References:

- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- WCAG contrast guidance for pairs that actually occur together: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- WCAG non-text contrast: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- Okabe–Ito Color Universal Design: https://jfly.uni-koeln.de/color/
- Machado, Oliveira, and Fernandes simulation model: https://pubmed.ncbi.nlm.nih.gov/19834201/

## Palette values

### Roles

| Token | Deuteranopia | Protanopia | Tritanopia |
|---|---:|---:|---:|
| canvas | `#0F2733` | `#0F2733` | `#0F2733` |
| surface | `#16313F` | `#16313F` | `#16313F` |
| surfaceRaised | `#1E3A52` | `#1E3A52` | `#1E3A52` |
| line | `#2A4458` | `#2A4458` | `#2A4458` |
| lineStrong | `#6A8796` | `#6A8796` | `#6A8796` |
| content | `#E7EAE8` | `#E7EAE8` | `#E7EAE8` |
| contentMuted | `#90A8AC` | `#90A8AC` | `#90A8AC` |
| primary | `#00D5E0` | `#73C5FF` | `#35C6A8` |
| primaryStrong | `#205F73` | `#205B7A` | `#195046` |
| primarySubtle | `#183F52` | `#193F55` | `#173F3C` |
| secondary | `#B8A1E3` | `#C6A0DC` | `#D08ACB` |
| secondarySubtle | `#40354D` | `#44344F` | `#49344D` |
| attention | `#F5C242` | `#FFD166` | `#FFB05C` |
| attentionSubtle | `#4A3D25` | `#493D26` | `#503A25` |
| danger | `#D5679F` | `#D5679F` | `#EA668D` |
| dangerSubtle | `#4A2F43` | `#493043` | `#4A2D3B` |
| success | `#8CB4FF` | `#00D6C4` | `#8FD36A` |
| successSubtle | `#243F63` | `#174A48` | `#29492D` |
| scrim | `rgba(0, 0, 0, 0.6)` | `rgba(0, 0, 0, 0.6)` | `rgba(0, 0, 0, 0.6)` |

### Pain

| Intensity | Deuteranopia | Protanopia | Tritanopia |
|---:|---:|---:|---:|
| 0 | `#8CB4FF` | `#8CB4FF` | `#79C99E` |
| 1 | `#75BDF5` | `#74BDF5` | `#6FC6A4` |
| 2 | `#5CC7E8` | `#58C8E7` | `#64C2AA` |
| 3 | `#3FD0D0` | `#3CD1CE` | `#5BBDAF` |
| 4 | `#70C7AA` | `#6CC9AC` | `#81B589` |
| 5 | `#AFC56E` | `#A9C774` | `#A6AD70` |
| 6 | `#E1BD59` | `#DDC05E` | `#CCA264` |
| 7 | `#F2A65A` | `#F0A85B` | `#E18D6B` |
| 8 | `#EA8B79` | `#E98D78` | `#E47778` |
| 9 | `#DF759D` | `#DC779D` | `#DB688A` |
| 10 | `#D567B1` | `#D06CB3` | `#D36FA7` |

### Mood

| Token | Deuteranopia | Protanopia | Tritanopia |
|---|---:|---:|---:|
| terrible | `#D5679F` | `#D5679F` | `#EA668D` |
| bad | `#EA8B79` | `#E98D78` | `#E18D6B` |
| soSo | `#F5C242` | `#FFD166` | `#CCA264` |
| okay | `#00D5E0` | `#73C5FF` | `#35C6A8` |
| great | `#8CB4FF` | `#00D6C4` | `#8FD36A` |

### Legacy

| Token | Deuteranopia | Protanopia | Tritanopia |
|---|---:|---:|---:|
| accent | `#00D5E0` | `#73C5FF` | `#35C6A8` |
| bgDark | `#112F3D` | `#112F3D` | `#112F3D` |
| muted | `#8BA3A7` | `#8BA3A7` | `#8BA3A7` |
| soft | `#E7EAE8` | `#E7EAE8` | `#E7EAE8` |
| cardDark | `#1E293B` | `#1E293B` | `#1E293B` |
| borderDark | `#334155` | `#334155` | `#334155` |
| purple | `#B8A1E3` | `#C6A0DC` | `#D08ACB` |
| orange | `#F5C242` | `#FFD166` | `#FFB05C` |

## Rationale

- Stable dark neutrals preserve Livo's identity and existing hierarchy.
- Deuteranopia and protanopia avoid red/green opposition for state meaning. Cyan/blue identify primary and success with different lightness; amber identifies attention; rose identifies danger.
- Protanopia uses a lighter blue primary and cyan success because dark reds can lose apparent brightness.
- Tritanopia uses teal/green for positive and primary states, orange for attention, and rose for danger, avoiding a blue/yellow-only distinction.
- Pain retains an ordered cool-to-warm-to-rose progression. The eleven values are also encoded by fixed position, displayed numbers, selected-marker geometry, spoken accessibility values, and textual labels.
- Mood reuses the same semantic families, avoiding a second contradictory color language.

## WCAG contrast results

Tests cover 17 normal-text pairs actually used in the interface, 10 semantic control pairs, and all 11 pain markers against canvas.

| Mode | Minimum normal-text ratio | Minimum semantic non-text ratio | Minimum pain/canvas ratio | Result |
|---|---:|---:|---:|---|
| Original | 4.70 (`contentMuted/surfaceRaised`) | 3.82 (`secondary/secondarySubtle`) | 1.86 (pain 10) | Text/control pairs pass; pain 9 and 10 fail 3:1 |
| Deuteranopia | 4.62 (`danger/canvas`) | 3.52 (`danger/dangerSubtle`) | 4.71 (pain 10) | Pass |
| Protanopia | 4.62 (`danger/canvas`) | 3.51 (`danger/dangerSubtle`) | 4.77 (pain 10) | Pass |
| Tritanopia | 4.70 (`contentMuted/surfaceRaised`) | 3.92 (`danger/dangerSubtle`) | 4.86 (pain 10) | Pass |

The Original pain 9/10 failure is preexisting and intentionally unchanged. Original Emergency white labels also remain below 4.5:1 on selected intensities 1–9; changing those labels would violate the exact-appearance constraint. All alternative Emergency intensity labels pass 4.5:1. Calendar's 30%-alpha pain background does not reach 3:1 by itself; it is supplemental to a solid marker, day selection/borders, accessible labels, and detailed numeric records.

## CVD collision screening

Full-deficiency Machado matrices plus OKLab distance screen primary/attention, primary/danger, attention/danger, success/danger, pain 0/5, and pain 5/10. All configured gates pass (`>= 0.10` for semantic pairs and `>= 0.08` for pain bands). Lowest observed values:

- Deuteranopia: primary/danger `0.130`.
- Protanopia: pain 0/5 `0.208`.
- Tritanopia: pain 0/5 `0.109`.

These numbers flag gross collisions only and are not a claim that every adjacent color is distinguishable to every user.

## Remaining exceptions

- Raster images under `assets/images/`, including mood, pain, and head-location illustrations, are unchanged.
- PDF HTML colors in `features/profile/usePdfExport.ts` are unchanged.
- The Emergency screen keeps white text and its translucent emerald success decoration in Original mode to preserve exact visuals. Alternative modes use active semantic success/pain colors where the visual carries state.
- `components/ui/PulsingMic.tsx` retains its exact white stop icon in Original and uses `canvas` in adapted modes so the icon remains visible on the dynamic pain surface.

## Manual Android/iOS validation

Run the following on both platforms with a test-only local wrapper that changes the `ColorThemeProvider` `palette` prop at runtime. Do not add or commit a product control.

1. Cycle Original → Deuteranopia → Protanopia → Tritanopia → Original without reloading.
2. Check Home cards, hydration/sleep dialogs, recording controls, and illustrations.
3. Check onboarding search, medication loading, sleep slider, and selections.
4. Check tab colors and React Navigation backgrounds before and after navigation.
5. Check Calendar day backgrounds, solid intensity markers, multiple-crisis badges, list icons, and selected-day details.
6. Check the full 0–10 `IntensityScale`, the quick Emergency screen, active-crisis state, and saved-crisis summaries. Confirm numbers and records never change when the palette changes.
7. Open shared dialogs, Export, AppLock management, and the global lock modal; switch while each is open.
8. Check Insights bars and percentages so information remains readable without naming colors.
9. Check normal/large text, focus/selection borders, disabled states, warning/danger/success states, and 30% pain overlays.
10. Return to Original and compare against the previous build. Obtain review from people with the represented color-vision deficiencies before release.
