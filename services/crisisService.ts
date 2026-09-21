import { supabase } from '@/lib/supabase';
import { CrisisRecord } from '@/types/crisis';
import { randomUUID } from 'expo-crypto';

// usuarios.id continua bigint: a #44 pede uuid para crise, registro de crise e registro
// diario, e mudar usuarios arrastaria respostas_setup e o fluxo de setup inteiro.
//
// Esta consulta e a dependencia de rede que ainda sobra na criacao de um registro. Offline
// ela precisa vir de cache local, o que e trabalho da T3.6.
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

// Uma fase e uma linha. Antes, cada sintoma, medicamento e fator custava uma consulta ao
// catalogo e um insert na tabela de juncao, o que passava de quarenta requisicoes em serie
// por crise e era impossivel offline. Os catalogos agora vivem em types/crisis.ts e o
// registro guarda os ids.
async function savePhaseToSupabase(criseId: string, phase: CrisisRecord): Promise<void> {
  const { error } = await supabase.from('registro_crise').insert({
    id: randomUUID(),
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
    updated_at: new Date().toISOString(),
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

  // O id vem do aparelho. Antes era preciso gravar a crise, ler o id de volta e so entao
  // gravar as fases, o que tornava a criacao offline impossivel. Agora as fases ja sabem
  // a qual crise pertencem antes de qualquer resposta do servidor.
  const criseId = randomUUID();

  const { error: criseError } = await supabase.from('crise_enxaqueca').insert({
    id: criseId,
    user_id: usuarioId,
    inicio_crise: startTime.toISOString(),
    fim_crise: endTime?.toISOString() ?? null,
    updated_at: new Date().toISOString(),
  });

  if (criseError) throw new Error(`Erro ao salvar crise: ${criseError.message}`);

  for (const phase of allPhases) {
    await savePhaseToSupabase(criseId, phase);
  }
}
