import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { HumorId } from '@/hooks/useRegistroEvento';

export interface RegistroCalendarDay {
  id: number;
  data: string;
  relato: string | null;
  horasSono: number | null;
  mlAgua: number | null;
  humor: HumorId | null;
  createdAt: string;
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

export function useRegistroCalendar(year: number, month: number) {
  const [registroByDay, setRegistroByDay] = useState<Record<number, RegistroCalendarDay[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistros = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = await getUserId();
      if (!userId) return;

      const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const { data: rows, error: err } = await supabase
        .from('registro_diario')
        .select('id, data, relato, horas_sono, ml_agua, humor, created_at')
        .eq('user_id', userId)
        .gte('data', from)
        .lte('data', to)
        .order('created_at', { ascending: true });

      if (err) throw err;

      const map: Record<number, RegistroCalendarDay[]> = {};
      for (const row of rows ?? []) {
        const day = parseInt(row.data.split('-')[2], 10);
        if (!map[day]) map[day] = [];
        map[day].push({
          id: row.id,
          data: row.data,
          relato: row.relato ?? null,
          horasSono: row.horas_sono ?? null,
          mlAgua: row.ml_agua ?? null,
          humor: row.humor ?? null,
          createdAt: row.created_at,
        });
      }
      setRegistroByDay(map);
    } catch (e: any) {
      setError(e.message ?? 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useFocusEffect(
    useCallback(() => {
      fetchRegistros();
    }, [fetchRegistros])
  );

  return { registroByDay, loading, error, refetch: fetchRegistros };
}