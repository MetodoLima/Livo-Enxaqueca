import { useMemo } from 'react';
import { PALETAS } from '@/constants/temas';
import { usePreferences } from '@/contexts/PreferencesContext';

/** Cores do tema ativo para o que não passa por className (ícones, switches, navegação). */
export function useTema() {
  const { preferencias } = usePreferences();
  const tema = preferencias.tema;
  return useMemo(() => {
    const { roles, pain, mood } = PALETAS[tema];
    return { tema, color: roles, painColor: pain, moodColor: mood };
  }, [tema]);
}
