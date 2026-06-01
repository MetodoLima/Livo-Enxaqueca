import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { analyzeInsights, CriseInsightRecord, QualitativeAnalysis } from '@/services/api';

function serializeCrises(rows: any[]): CriseInsightRecord[] {
  return rows.map((c) => {
    const inicio = c.inicio_crise ? new Date(c.inicio_crise) : null;
    const fim = c.fim_crise ? new Date(c.fim_crise) : null;
    const duracao_horas =
      inicio && fim
        ? Math.round(((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60)) * 10) / 10
        : null;

    return {
      data: inicio ? inicio.toISOString().split('T')[0] : 'data desconhecida',
      intensidade: c.intensidade_dor ?? null,
      localizacao: c.regiao_dor ?? null,
      lado: c.lado ?? null,
      duracao_horas,
      sintomas: (c.sintoma_crise ?? [])
        .map((s: any) => s.sintomas?.nome)
        .filter(Boolean) as string[],
      medicamentos: (c.medicamentos_crise ?? [])
        .map((m: any) => m.medicamentos?.nome)
        .filter(Boolean) as string[],
      gatilhos: (c.fatores_desencadeantes_crise ?? [])
        .map((f: any) => f.fatores_desencadeantes?.nome)
        .filter(Boolean) as string[],
      nivel_incapacidade: c.nivel_incapacidade ?? null,
      resumo: c.resumo ?? null,
    };
  });
}

export function useQualitativeAnalysis() {
  const [analysis, setAnalysis] = useState<QualitativeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: rows, error: supabaseError } = await supabase
        .from('crise_enxaqueca')
        .select(`
          id,
          intensidade_dor,
          regiao_dor,
          lado,
          nivel_incapacidade,
          resumo,
          inicio_crise,
          fim_crise,
          sintoma_crise ( sintomas ( nome ) ),
          medicamentos_crise ( medicamentos ( nome ) ),
          fatores_desencadeantes_crise ( fatores_desencadeantes ( nome ) )
        `)
        .order('inicio_crise', { ascending: true });

      if (supabaseError) throw supabaseError;

      const crises = serializeCrises(rows ?? []);
      const result = await analyzeInsights(crises);
      setAnalysis(result);
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao gerar análise');
    } finally {
      setLoading(false);
    }
  }, []);

  return { analysis, loading, error, generate };
}
