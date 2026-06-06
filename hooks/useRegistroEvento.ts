import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type HumorId = 'terrible' | 'bad' | 'so-so' | 'okay' | 'great';

export interface RegistroEvento {
  id?: number;
  data: string;
  relato: string | null;
  horasSono: number | null;
  mlAgua: number | null;
  humor: HumorId | null;
}

async function getUserId(): Promise<number | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('usuarios')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }

  return data.id;
}

export function useRegistroEvento(data: string) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const salvar = useCallback(async (patch: Omit<RegistroEvento, 'id' | 'data'>) => {
    setSaving(true);
    setSaved(false);
    try {
      const userId = await getUserId();
      if (!userId) {
        console.error('Usuário não encontrado em public.usuarios');
        return;
      }

      const payload = {
        user_id: userId,
        data,
        relato: patch.relato,
        horas_sono: patch.horasSono,
        ml_agua: patch.mlAgua,
        humor: patch.humor,
      };

      const { error } = await supabase
        .from('registro_diario')
        .insert(payload);

      if (error) {
        console.error('Supabase error:', error);
        return;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar registro:', err);
    } finally {
      setSaving(false);
    }
  }, [data]);

  return { saving, saved, salvar };
}
