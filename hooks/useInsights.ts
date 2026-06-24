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
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const sliced = limit > 0 ? sorted.slice(0, limit) : sorted;
  return sliced.map(([nome, count]) => ({
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
          inicio_crise,
          fim_crise,
          registro_crise (
            id,
            intensidade_dor,
            regiao_dor,
            sintoma_registro_crise ( sintomas ( nome ) ),
            medicamentos_registro_crise ( medicamentos ( nome ) ),
            fatores_desencadeantes_registro_crise ( fatores_desencadeantes ( nome ) )
          )
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

      // Todos os registros de todas as crises (uma crise pode ter vários registros)
      const allRegistros = crises.flatMap((c) =>
        Array.isArray(c.registro_crise) ? c.registro_crise : []
      );

      const intensities = allRegistros
        .map((r: any) => r.intensidade_dor)
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

      const allTriggers = allRegistros.flatMap((r: any) =>
        (r.fatores_desencadeantes_registro_crise ?? [])
          .map((f: any) => f.fatores_desencadeantes?.nome)
          .filter(Boolean)
      );
      const allSintomas = allRegistros.flatMap((r: any) =>
        (r.sintoma_registro_crise ?? [])
          .map((s: any) => s.sintomas?.nome)
          .filter(Boolean)
      );
      const allRegions = allRegistros
        .map((r: any) => r.regiao_dor)
        .filter(Boolean) as string[];

      // Query direta para medicamentos: garante que remédios customizados também sejam incluídos
      const registroIds = allRegistros.map((r: any) => r.id).filter(Boolean);
      let allMedicamentos: string[] = [];
      if (registroIds.length > 0) {
        const { data: medRows } = await supabase
          .from('medicamentos_registro_crise')
          .select('medicamentos ( nome )')
          .in('registro_crise_id', registroIds);
        allMedicamentos = (medRows ?? [])
          .map((row: any) => row.medicamentos?.nome)
          .filter(Boolean);
      }

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
        topMedicamentos: countTop(allMedicamentos, total, 0),
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
