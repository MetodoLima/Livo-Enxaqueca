import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type HumorId = 'pessimo' | 'ruim' | 'regular' | 'bem' | 'otimo';

export interface RegistroEvento {
  id?: number;
  data: string;
  relato: string | null;
  horasSono: number | null;
  mlAgua: number | null;
  humor: HumorId | null;
}

export function useRegistroEvento(data: string) {
  const [registro, setRegistro] = useState<RegistroEvento>({
    data,
    relato: null,
    horasSono: null,
    mlAgua: null,
    humor: null,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchRegistro = useCallback(async () => {
    setLoading(true);
    try {
      const { data: row } = await supabase
        .from('registro_diario')
        .select('id, data, relato, horas_sono, ml_agua, humor')
        .eq('data', data)
        .maybeSingle();

      if (row) {
        setRegistro({
          id: row.id,
          data: row.data,
          relato: row.relato ?? null,
          horasSono: row.horas_sono ?? null,
          mlAgua: row.ml_agua ?? null,
          humor: row.humor ?? null,
        });
      } else {
        setRegistro({ data, relato: null, horasSono: null, mlAgua: null, humor: null });
      }
    } finally {
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    fetchRegistro();
  }, [fetchRegistro]);

  const salvar = useCallback(async (patch: Partial<Omit<RegistroEvento, 'id' | 'data'>>) => {
    setSaving(true);
    setSaved(false);
    const snapshot = registro;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updated = { ...registro, ...patch };
      setRegistro(updated);

      const payload = {
        user_id: user.id,
        data,
        relato: updated.relato,
        horas_sono: updated.horasSono,
        ml_agua: updated.mlAgua,
        humor: updated.humor,
      };

      const { data: row } = await supabase
        .from('registro_diario')
        .upsert(payload, { onConflict: 'user_id,data' })
        .select('id')
        .single();

      if (row) setRegistro((prev) => ({ ...prev, id: row.id }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setRegistro(snapshot);
      console.error('Erro ao salvar registro:', err);
    } finally {
      setSaving(false);
    }
  }, [registro, data]);

  return { registro, setRegistro, loading, saving, saved, salvar };
}