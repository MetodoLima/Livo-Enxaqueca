import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface CrisisDay {
  id: number;
  intensidadeDor: number | null;
  regiaoDor: string | null;
  lado: string | null;
  nivelIncapacidade: string | null;
  resumo: string | null;
  inicioCrise: Date;
  fimCrise: Date | null;
}

export interface CrisisByDay {
  [day: number]: CrisisDay[];
}

export function useCrisisCalendar(year: number, month: number) {
  const [crisisByDay, setCrisisByDay] = useState<CrisisByDay>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCrises = useCallback(async () => {
    setLoading(true);
    setError(null);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0, 23, 59, 59);

    try {
      const { data, error: supabaseError } = await supabase
        .from('crise_enxaqueca')
        .select('id, intensidade_dor, regiao_dor, lado, nivel_incapacidade, resumo, inicio_crise, fim_crise')
        .gte('inicio_crise', firstDay.toISOString())
        .lte('inicio_crise', lastDay.toISOString())
        .order('inicio_crise', { ascending: true });

      if (supabaseError) throw supabaseError;

      const grouped: CrisisByDay = {};
      for (const row of data ?? []) {
        const date = new Date(row.inicio_crise);
        const day = date.getDate();
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push({
          id: row.id,
          intensidadeDor: row.intensidade_dor ?? null,
          regiaoDor: row.regiao_dor ?? null,
          lado: row.lado ?? null,
          nivelIncapacidade: row.nivel_incapacidade ?? null,
          resumo: row.resumo ?? null,
          inicioCrise: date,
          fimCrise: row.fim_crise ? new Date(row.fim_crise) : null,
        });
      }

      setCrisisByDay(grouped);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao buscar crises');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchCrises();
  }, [fetchCrises]);

  return { crisisByDay, loading, error, refetch: fetchCrises };
}