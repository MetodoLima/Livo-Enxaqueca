import { useCallback, useEffect, useState } from 'react';
import { crisisRepository } from '@/repositories';
import { useSync } from '@/contexts/SyncContext';
import { medicationLabel, symptomLabel } from '@/types/crisis';

export interface InsightItem {
  nome: string;
  count: number;
  pct: number;
}

export interface InsightsData {
  totalCrises: number;
  crisesPerMonth: number;
  avgIntensity: number | null;
  avgDurationHours: number | null;
  topTriggers: InsightItem[];
  topSintomas: InsightItem[];
  topRegions: InsightItem[];
  topMedicamentos: InsightItem[];
  trend: { direction: 'up' | 'down' | 'stable'; pct: number } | null;
}

function countTop(items: string[], total: number, limit = 5): InsightItem[] {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item] = (counts[item] ?? 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const sliced = limit > 0 ? sorted.slice(0, limit) : sorted;
  return sliced.map(([nome, count]) => ({
    nome,
    count,
    pct: Math.round((count / total) * 100),
  }));
}

export function useInsights() {
  const { ultimaAtualizacao } = useSync();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const crises = await crisisRepository.list();
      const total = crises.length;

      if (total === 0) {
        setData({
          totalCrises: 0,
          crisesPerMonth: 0,
          avgIntensity: null,
          avgDurationHours: null,
          topTriggers: [],
          topSintomas: [],
          topRegions: [],
          topMedicamentos: [],
          trend: null,
        });
        return;
      }

      const allRegistros = crises.flatMap((c) => c.fases);

      const intensities = allRegistros
        .map((r) => r.intensidadeDor)
        .filter((v): v is number => v != null);
      const avgIntensity =
        intensities.length > 0
          ? Math.round((intensities.reduce((a, b) => a + b, 0) / intensities.length) * 10) / 10
          : null;

      const durations = crises
        .filter((c) => c.inicioCrise !== null && c.fimCrise !== null)
        .map((c) => (c.fimCrise!.getTime() - c.inicioCrise!.getTime()) / (1000 * 60 * 60));
      const avgDurationHours =
        durations.length > 0
          ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
          : null;

      const comInicio = crises.filter((c) => c.inicioCrise !== null) as Array<
        (typeof crises)[number] & { inicioCrise: Date }
      >;

      const now = new Date();
      const firstDate = comInicio[0]?.inicioCrise ?? now;
      const monthsDiff = Math.max(
        1,
        (now.getFullYear() - firstDate.getFullYear()) * 12 +
          (now.getMonth() - firstDate.getMonth()) +
          1
      );
      const crisesPerMonth = Math.round((total / monthsDiff) * 10) / 10;

      const allTriggers = allRegistros.flatMap((r) => r.fatores);
      const allSintomas = allRegistros.flatMap((r) => r.sintomas.map(symptomLabel));
      const allRegions = allRegistros.map((r) => r.regiaoDor).filter(Boolean) as string[];

      const allMedicamentos = allRegistros.flatMap((r) => [
        ...r.medicamentos.map(medicationLabel),
        ...r.medicamentosLivres,
      ]);

      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const last30 = comInicio.filter((c) => c.inicioCrise >= thirtyDaysAgo).length;
      const prev30 = comInicio.filter(
        (c) => c.inicioCrise >= sixtyDaysAgo && c.inicioCrise < thirtyDaysAgo
      ).length;

      let trend: InsightsData['trend'] = null;
      if (prev30 > 0) {
        const pct = Math.round((Math.abs(last30 - prev30) / prev30) * 100);
        trend = {
          direction: last30 < prev30 ? 'down' : last30 > prev30 ? 'up' : 'stable',
          pct,
        };
      } else if (last30 > 0) {
        trend = { direction: 'up', pct: 100 };
      }

      setData({
        totalCrises: total,
        crisesPerMonth,
        avgIntensity,
        avgDurationHours,
        topTriggers: countTop(allTriggers, total),
        topSintomas: countTop(allSintomas, total),
        topRegions: countTop(allRegions, total),
        topMedicamentos: countTop(allMedicamentos, total, 0),
        trend,
      });
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao buscar insights');
    } finally {
      setLoading(false);
    }
  }, [ultimaAtualizacao]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return { data, loading, error, refetch: fetchInsights };
}
