import { crisisRepository, type Crisis } from '@/repositories';
import { analyzeInsights, CriseInsightRecord, QualitativeAnalysis } from '@/services/api';
import { medicationLabel, symptomLabel } from '@/types/crisis';
import { useCallback, useState } from 'react';

function serializeCrises(crises: Crisis[]): CriseInsightRecord[] {
  return crises.flatMap((c) => {
    const inicio = c.inicioCrise;
    const fim = c.fimCrise;
    const duracao_horas =
      inicio && fim
        ? Math.round(((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60)) * 10) / 10
        : null;
    const data = inicio ? inicio.toISOString().split('T')[0] : 'data desconhecida';

    if (c.fases.length === 0) return [];

    return c.fases.map((reg) => ({
      data,
      intensidade: reg.intensidadeDor,
      localizacao: reg.regiaoDor,
      lado: reg.lado,
      duracao_horas,
      sintomas: reg.sintomas.map(symptomLabel),
      medicamentos: [...reg.medicamentos.map(medicationLabel), ...reg.medicamentosLivres],
      gatilhos: reg.fatores,
      nivel_incapacidade: reg.nivelIncapacidade,
      resumo: reg.resumo,
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
      const crises = serializeCrises(await crisisRepository.list());
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
