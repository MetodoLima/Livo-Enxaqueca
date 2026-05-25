import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([nome, count]) => ({
      nome,
      count,
      pct: Math.round((count / total) * 100),
    }));
}

export function useInsights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: rows, error: supabaseError } = await supabase
        .from('crise_enxaqueca')
        .select(`
          id,
          intensidade_dor,
          regiao_dor,
          inicio_crise,
          fim_crise,
          sintoma_crise ( sintomas ( nome ) ),
          medicamentos_crise ( medicamentos ( nome ) ),
          fatores_desencadeantes_crise ( fatores_desencadeantes ( nome ) )
        `)
        .order('inicio_crise', { ascending: true });

      if (supabaseError) throw supabaseError;

      const crises = rows ?? [];
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

      const intensities = crises
        .map((c) => c.intensidade_dor)
        .filter((v): v is number => v != null);
      const avgIntensity =
        intensities.length > 0
          ? Math.round((intensities.reduce((a, b) => a + b, 0) / intensities.length) * 10) / 10
          : null;

      const durations = crises
        .filter((c) => c.inicio_crise && c.fim_crise)
        .map(
          (c) =>
            (new Date(c.fim_crise).getTime() - new Date(c.inicio_crise).getTime()) /
            (1000 * 60 * 60)
        );
      const avgDurationHours =
        durations.length > 0
          ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
          : null;

      const firstDate = new Date(crises[0].inicio_crise);
      const now = new Date();
      const monthsDiff = Math.max(
        1,
        (now.getFullYear() - firstDate.getFullYear()) * 12 +
          (now.getMonth() - firstDate.getMonth()) +
          1
      );
      const crisesPerMonth = Math.round((total / monthsDiff) * 10) / 10;

      const allTriggers = crises.flatMap((c) =>
        (c.fatores_desencadeantes_crise ?? [])
          .map((f: any) => f.fatores_desencadeantes?.nome)
          .filter(Boolean)
      );
      const allSintomas = crises.flatMap((c) =>
        (c.sintoma_crise ?? [])
          .map((s: any) => s.sintomas?.nome)
          .filter(Boolean)
      );
      const allMedicamentos = crises.flatMap((c) =>
        (c.medicamentos_crise ?? [])
          .map((m: any) => m.medicamentos?.nome)
          .filter(Boolean)
      );
      const allRegions = crises.map((c) => c.regiao_dor).filter(Boolean) as string[];

      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const last30 = crises.filter((c) => new Date(c.inicio_crise) >= thirtyDaysAgo).length;
      const prev30 = crises.filter((c) => {
        const d = new Date(c.inicio_crise);
        return d >= sixtyDaysAgo && d < thirtyDaysAgo;
      }).length;

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
        topMedicamentos: countTop(allMedicamentos, total),
        trend,
      });
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao buscar insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return { data, loading, error, refetch: fetchInsights };
}
