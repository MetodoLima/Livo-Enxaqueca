import { useThemeColors } from '@/constants/Colors';
import { usePreferences } from '@/contexts/PreferencesContext';

/** Cores do tema ativo (já com a intensidade aplicada) para o que não passa por className. */
export function useTema() {
  const { preferencias } = usePreferences();
  const { roles, pain, mood } = useThemeColors();
  return { tema: preferencias.tema, color: roles, painColor: pain, moodColor: mood };
}
