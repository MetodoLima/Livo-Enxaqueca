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
  sintomas: string[];
  medicamentos: string[];
}

export interface CrisisByDay {
  [day: number]: CrisisDay[];
}

const SELECT = `
  id,
  inicio_crise,
  fim_crise,
  registro_crise (
    id,
    intensidade_dor,
    regiao_dor,
    lado,
    nivel_incapacidade,
    resumo,
    sintoma_registro_crise ( sintomas ( nome ) ),
    medicamentos_registro_crise ( medicamentos ( nome ) )
  )
`;

function rowToCrisis(row: any): CrisisDay {
  const registros: any[] = Array.isArray(row.registro_crise) ? row.registro_crise : [];
  // Usa o último registro como snapshot principal (dados mais recentes)
  const reg = registros.length > 0 ? registros[registros.length - 1] : null;
  return {
    id: row.id,
    intensidadeDor: reg?.intensidade_dor ?? null,
    regiaoDor: reg?.regiao_dor ?? null,
    lado: reg?.lado ?? null,
    nivelIncapacidade: reg?.nivel_incapacidade ?? null,
    resumo: reg?.resumo ?? null,
    inicioCrise: new Date(row.inicio_crise),
    fimCrise: row.fim_crise ? new Date(row.fim_crise) : null,
    sintomas: [
      ...new Set(
        registros.flatMap((r: any) =>
          (r.sintoma_registro_crise ?? []).map((s: any) => s.sintomas?.nome).filter(Boolean)
        )
      ),
    ],
    medicamentos: [
      ...new Set(
        registros.flatMap((r: any) =>
          (r.medicamentos_registro_crise ?? []).map((m: any) => m.medicamentos?.nome).filter(Boolean)
        )
      ),
    ],
  };
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
    const daysInMonth = lastDay.getDate();
    const grouped: CrisisByDay = {};

    const addToDay = (day: number, crisis: CrisisDay) => {
      if (day < 1 || day > daysInMonth) return;
      if (!grouped[day]) grouped[day] = [];
      if (!grouped[day].some((c) => c.id === crisis.id)) {
        grouped[day].push(crisis);
      }
    };

    const spreadCrisis = (crisis: CrisisDay) => {
      const start = new Date(crisis.inicioCrise);
      start.setHours(0, 0, 0, 0);

      if (!crisis.fimCrise) {
        if (start.getMonth() === month && start.getFullYear() === year) {
          addToDay(start.getDate(), crisis);
        }
        return;
      }

      const end = new Date(crisis.fimCrise);
      end.setHours(0, 0, 0, 0);

      const cursor = new Date(Math.max(start.getTime(), firstDay.getTime()));
      cursor.setHours(0, 0, 0, 0);
      const limit = new Date(Math.min(end.getTime(), lastDay.getTime()));
      limit.setHours(0, 0, 0, 0);

      while (cursor <= limit) {
        addToDay(cursor.getDate(), crisis);
        cursor.setDate(cursor.getDate() + 1);
      }
    };

    try {
      // Crises que começam neste mês
      const { data, error: err1 } = await supabase
        .from('crise_enxaqueca')
        .select(SELECT)
        .gte('inicio_crise', firstDay.toISOString())
        .lte('inicio_crise', lastDay.toISOString())
        .order('inicio_crise', { ascending: true });

      if (err1) throw err1;
      for (const row of data ?? []) spreadCrisis(rowToCrisis(row));

      // Crises que começaram antes mas terminam neste mês
      const { data: prevData } = await supabase
        .from('crise_enxaqueca')
        .select(SELECT)
        .lt('inicio_crise', firstDay.toISOString())
        .gte('fim_crise', firstDay.toISOString())
        .order('inicio_crise', { ascending: true });

      for (const row of prevData ?? []) spreadCrisis(rowToCrisis(row));

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