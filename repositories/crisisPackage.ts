import type { CrisisRecord } from '@/types/crisis';
import { randomUUID } from 'expo-crypto';
import type { CrisePayload, FasePayload } from './remote/crisisRepository';

export type PacoteCrise = {
  crise: CrisePayload;
  fases: FasePayload[];
};

function nivelIncapacidade(intensidade: number | null): string | null {
  if (intensidade === null) return null;
  if (intensidade <= 3) return 'leve';
  if (intensidade <= 6) return 'moderado';
  return 'severo';
}

export function montarPacoteCrise(crisis: CrisisRecord, fases: CrisisRecord[] = []): PacoteCrise {
  const todasAsFases = [...fases, crisis];
  const agora = new Date().toISOString();

  return {
    crise: {
      id: randomUUID(),
      inicio_crise: todasAsFases[0].startTime.toISOString(),
      fim_crise: crisis.endTime ? crisis.endTime.toISOString() : null,
      updated_at: agora,
    },
    fases: todasAsFases.map((fase) => ({
      id: randomUUID(),
      intensidade_dor: fase.intensity,
      regiao_dor: fase.location,
      lado: fase.side,
      nivel_incapacidade: nivelIncapacidade(fase.intensity),
      resumo: fase.aiComplement?.aiResult?.structured?.resumo ?? null,
      sintomas: fase.symptoms,
      medicamentos: fase.medications.filter((m) => m !== 'nenhum'),
      medicamentos_livres: fase.customMedications,
      fatores: fase.triggers,
      updated_at: agora,
    })),
  };
}
