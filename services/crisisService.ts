import { supabase } from '@/lib/supabase';
import { CrisisRecord } from '@/types/crisis';
import { randomUUID } from 'expo-crypto';

function getNivelIncapacidade(intensity: number | null): string | null {
  if (intensity === null) return null;
  if (intensity <= 3) return 'leve';
  if (intensity <= 6) return 'moderado';
  return 'severo';
}

function faseToPayload(phase: CrisisRecord) {
  return {
    id: randomUUID(),
    intensidade_dor: phase.intensity,
    regiao_dor: phase.location,
    lado: phase.side,
    nivel_incapacidade: getNivelIncapacidade(phase.intensity),
    resumo: phase.aiComplement?.aiResult?.structured?.resumo ?? null,
    sintomas: phase.symptoms,
    // 'nenhum' e opcao de interface para dizer que nao tomou nada, nao medicamento.
    medicamentos: phase.medications.filter((m) => m !== 'nenhum'),
    medicamentos_livres: phase.customMedications,
    fatores: phase.triggers,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Grava a crise e todas as suas fases numa unica chamada.
 *
 * Antes eram varios passos sem transacao entre eles: descobrir o usuario, inserir a crise,
 * e inserir cada fase. Uma falha no meio deixava crise incompleta no banco, sem nada
 * indicando isso. Agora a funcao salvar_crise grava tudo dentro de uma transacao.
 *
 * Os ids vem do aparelho, e a funcao usa on conflict do nothing, entao reenviar o mesmo
 * pacote depois de um timeout completa o que faltou em vez de duplicar.
 *
 * A resolucao de auth.uid() para usuarios.id mora dentro da funcao. O app nao precisa mais
 * consultar a tabela usuarios antes de gravar.
 */
export async function saveCrisisToSupabase(
  crisis: CrisisRecord,
  phases: CrisisRecord[] = [],
): Promise<void> {
  const allPhases = [...phases, crisis];

  const { error } = await supabase.rpc('salvar_crise', {
    p_crise: {
      id: randomUUID(),
      inicio_crise: allPhases[0].startTime.toISOString(),
      fim_crise: crisis.endTime?.toISOString() ?? null,
      updated_at: new Date().toISOString(),
    },
    p_fases: allPhases.map(faseToPayload),
  });

  if (error) throw new Error(`Erro ao salvar crise: ${error.message}`);
}
