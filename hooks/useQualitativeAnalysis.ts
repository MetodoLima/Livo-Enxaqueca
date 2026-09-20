import { supabase } from '@/lib/supabase';
import { analyzeInsights, CriseInsightRecord, QualitativeAnalysis } from '@/services/api';
import { medicationLabel, symptomLabel } from '@/types/crisis';
import { useCallback, useState } from 'react';

function serializeCrises(rows: any[]): CriseInsightRecord[] {
  return rows.flatMap((c) => {
    const inicio = c.inicio_crise ? new Date(c.inicio_crise) : null;
    const fim = c.fim_crise ? new Date(c.fim_crise) : null;
    const duracao_horas =
      inicio && fim
        ? Math.round(((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60)) * 10) / 10
        : null;
    const data = inicio ? inicio.toISOString().split('T')[0] : 'data desconhecida';

    const registros: any[] = Array.isArray(c.registro_crise) ? c.registro_crise : [];
    if (registros.length === 0) return [];

    return registros.map((reg: any) => ({
      data,
      intensidade: reg.intensidade_dor ?? null,
      localizacao: reg.regiao_dor ?? null,
      lado: reg.lado ?? null,
      duracao_horas,
      sintomas: ((reg.sintomas ?? []) as string[]).map(symptomLabel),
      medicamentos: [
        ...((reg.medicamentos ?? []) as string[]).map(medicationLabel),
        ...((reg.medicamentos_livres ?? []) as string[]),
      ],
      gatilhos: (reg.fatores ?? []) as string[],
      nivel_incapacidade: reg.nivel_incapacidade ?? null,
      resumo: reg.resumo ?? null,
    }));
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
          inicio_crise,
          fim_crise,
          registro_crise (
            intensidade_dor,
            regiao_dor,
            lado,
            nivel_incapacidade,
            resumo,
            sintomas,
            medicamentos,
            medicamentos_livres,
            fatores
          )
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
