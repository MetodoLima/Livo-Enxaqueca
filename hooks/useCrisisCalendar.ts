import { useEffect, useState, useCallback } from 'react';
import { crisisRepository, type Crisis } from '@/repositories';
import { useSync } from '@/contexts/SyncContext';
import { medicationLabel, symptomLabel } from '@/types/crisis';

export interface CrisisPhase {
  id: string;
  intensidadeDor: number | null;
  regiaoDor: string | null;
  lado: string | null;
  nivelIncapacidade: string | null;
  resumo: string | null;
  sintomas: string[];
  medicamentos: string[];
}

export interface CrisisDay {
  id: string;
  inicioCrise: Date;
  fimCrise: Date | null;
  fases: CrisisPhase[];
  // campos derivados da última fase para exibição rápida no calendário
  intensidadeDor: number | null;
  sintomas: string[];
  medicamentos: string[];
}

export interface CrisisByDay {
  [day: number]: CrisisDay[];
}

// O repositorio entrega os ids do catalogo; o calendario mostra os rotulos.
// Crise sem inicio nao chega aqui: nao ha dia do mes onde coloca-la.
function toCrisisDay(crise: Crisis & { inicioCrise: Date }): CrisisDay {
  const fases: CrisisPhase[] = crise.fases.map((f) => ({
    id: f.id,
    intensidadeDor: f.intensidadeDor,
    regiaoDor: f.regiaoDor,
    lado: f.lado,
    nivelIncapacidade: f.nivelIncapacidade,
    resumo: f.resumo,
    sintomas: f.sintomas.map(symptomLabel),
    medicamentos: [...f.medicamentos.map(medicationLabel), ...f.medicamentosLivres],
  }));

  const maxIntensidadeFase = fases.reduce<CrisisPhase | null>(
    (max, f) => (f.intensidadeDor !== null && (max === null || f.intensidadeDor > (max.intensidadeDor ?? 0)) ? f : max),
    null
  );

  return {
    id: crise.id,
    inicioCrise: crise.inicioCrise,
    fimCrise: crise.fimCrise,
    fases,
    intensidadeDor: maxIntensidadeFase?.intensidadeDor ?? null,
    sintomas: [...new Set(fases.flatMap((f) => f.sintomas))],
    medicamentos: [...new Set(fases.flatMap((f) => f.medicamentos))],
  };
}

export function useCrisisCalendar(year: number, month: number) {
  const { ultimaAtualizacao } = useSync();
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

    const comInicio = (crises: Crisis[]) =>
      crises.filter((c): c is Crisis & { inicioCrise: Date } => c.inicioCrise !== null);

    try {
      // Crises que começam neste mês
      const doMes = await crisisRepository.list({ desde: firstDay, ate: lastDay });
      for (const crise of comInicio(doMes)) spreadCrisis(toCrisisDay(crise));

      // Crises que começaram antes mas terminam neste mês
      const anteriores = await crisisRepository.list({
        comecouAntesDe: firstDay,
        terminaApos: firstDay,
      });
      for (const crise of comInicio(anteriores)) spreadCrisis(toCrisisDay(crise));

      setCrisisByDay(grouped);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao buscar crises');
    } finally {
      setLoading(false);
    }
  }, [year, month, ultimaAtualizacao]);

  useEffect(() => {
    fetchCrises();
  }, [fetchCrises]);

  return { crisisByDay, loading, error, refetch: fetchCrises };
}