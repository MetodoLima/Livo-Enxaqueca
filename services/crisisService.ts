import { supabase } from '@/lib/supabase';
import { CrisisRecord, MEDICATIONS, SYMPTOMS } from '@/types/crisis';

async function getUsuarioId(authUserId: string): Promise<number> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id')
    .eq('user_id', authUserId)
    .single();
  if (error || !data) throw new Error('Perfil do usuário não encontrado.');
  return data.id;
}

async function upsertLookup(table: string, nome: string): Promise<number> {
  const { data: existing } = await supabase
    .from(table)
    .select('id')
    .eq('nome', nome)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: inserted, error } = await supabase
    .from(table)
    .insert({ nome })
    .select('id')
    .single();
  if (error || !inserted) throw new Error(`Erro ao inserir em ${table} ("${nome}"): ${error?.message}`);
  return inserted.id;
}

function getNivelIncapacidade(intensity: number | null): string | null {
  if (intensity === null) return null;
  if (intensity <= 3) return 'leve';
  if (intensity <= 6) return 'moderado';
  return 'severo';
}

async function savePhaseToSupabase(criseId: number, phase: CrisisRecord): Promise<void> {
  const { data: registroData, error: registroError } = await supabase
    .from('registro_crise')
    .insert({
      crise_id: criseId,
      intensidade_dor: phase.intensity,
      regiao_dor: phase.location,
      lado: phase.side,
      nivel_incapacidade: getNivelIncapacidade(phase.intensity),
      resumo: phase.aiComplement?.aiResult?.structured?.resumo ?? null,
    })
    .select('id')
    .single();

  if (registroError || !registroData) throw new Error(`Erro ao salvar registro: ${registroError?.message}`);
  const registroId = registroData.id;

  for (const symptomId of phase.symptoms) {
    const sintomaLabel = SYMPTOMS.find((s) => s.id === symptomId)?.label ?? symptomId;
    const sintomaId = await upsertLookup('sintomas', sintomaLabel);
    const { error } = await supabase
      .from('sintoma_registro_crise')
      .insert({ registro_crise_id: registroId, sintoma_id: sintomaId });
    if (error) throw new Error(`Erro ao salvar sintoma: ${error.message}`);
  }

  const allMeds = [
    ...phase.medications.filter((m) => m !== 'nenhum'),
    ...phase.customMedications,
  ];
  for (const med of allMeds) {
    const medLabel = MEDICATIONS.find((m) => m.id === med)?.label ?? med;
    const medId = await upsertLookup('medicamentos', medLabel);
    const { error } = await supabase
      .from('medicamentos_registro_crise')
      .insert({ registro_crise_id: registroId, medicamentos_id: medId });
    if (error) throw new Error(`Erro ao salvar medicamento: ${error.message}`);
  }

  for (const trigger of phase.triggers) {
    const fatorId = await upsertLookup('fatores_desencadeantes', trigger);
    const { error } = await supabase
      .from('fatores_desencadeantes_registro_crise')
      .insert({ registro_crise_id: registroId, fatores_desencadeantes_id: fatorId });
    if (error) throw new Error(`Erro ao salvar fator desencadeante: ${error.message}`);
  }
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
