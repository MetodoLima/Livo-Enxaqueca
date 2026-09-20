import { supabase } from '@/lib/supabase';
import { CrisisRecord } from '@/types/crisis';

async function getUsuarioId(authUserId: string): Promise<number> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id')
    .eq('user_id', authUserId)
    .single();
  if (error || !data) throw new Error('Perfil do usuário não encontrado.');
  return data.id;
}

function getNivelIncapacidade(intensity: number | null): string | null {
  if (intensity === null) return null;
  if (intensity <= 3) return 'leve';
  if (intensity <= 6) return 'moderado';
  return 'severo';
}

// Uma fase e uma linha. Antes, cada sintoma, medicamento e fator custava uma consulta
// ao catalogo e um insert na tabela de juncao, o que passava de quarenta requisicoes em
// serie por crise e era impossivel offline. Os catalogos agora vivem em types/crisis.ts
// e o registro guarda os ids.
async function savePhaseToSupabase(criseId: number, phase: CrisisRecord): Promise<void> {
  const { error } = await supabase.from('registro_crise').insert({
    crise_id: criseId,
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
  });

  if (error) throw new Error(`Erro ao salvar registro: ${error.message}`);
}

export async function saveCrisisToSupabase(
  crisis: CrisisRecord,
  phases: CrisisRecord[] = [],
): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) throw new Error('Usuário não autenticado.');

  const usuarioId = await getUsuarioId(authData.user.id);

  const allPhases = [...phases, crisis];
  const startTime = allPhases[0].startTime;
  const endTime = crisis.endTime;

  const { data: criseData, error: criseError } = await supabase
    .from('crise_enxaqueca')
    .insert({
      user_id: usuarioId,
      inicio_crise: startTime.toISOString(),
      fim_crise: endTime?.toISOString() ?? null,
    })
    .select('id')
    .single();

  if (criseError || !criseData) throw new Error(`Erro ao salvar crise: ${criseError?.message}`);
  const criseId = criseData.id;

  for (const phase of allPhases) {
    await savePhaseToSupabase(criseId, phase);
  }
}
