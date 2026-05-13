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

export async function saveCrisisToSupabase(crisis: CrisisRecord): Promise<void> {
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) throw new Error('Usuário não autenticado.');

  const usuarioId = await getUsuarioId(authData.user.id);

  const { data: criseData, error: criseError } = await supabase
    .from('crise_enxaqueca')
    .insert({
      user_id: usuarioId,
      intensidade_dor: crisis.intensity,
      regiao_dor: crisis.location,
      lado: crisis.side,
      nivel_incapacidade: getNivelIncapacidade(crisis.intensity),
      resumo: crisis.aiComplement?.aiResult?.structured?.resumo ?? null,
      inicio_crise: crisis.startTime.toISOString(),
      fim_crise: crisis.endTime?.toISOString() ?? null,
    })
    .select('id')
    .single();

  if (criseError || !criseData) throw new Error(`Erro ao salvar crise: ${criseError?.message}`);
  const criseId = criseData.id;

  for (const symptomId of crisis.symptoms) {
    const sintomaLabel = SYMPTOMS.find((s) => s.id === symptomId)?.label ?? symptomId;
    console.log(sintomaLabel)
    const sintomaId = await upsertLookup('sintomas', sintomaLabel);
    console.log(sintomaId)
    const { error } = await supabase
      .from('sintoma_crise')
      .insert({ crise_id: criseId, sintoma_id: sintomaId });
    if (error) throw new Error(`Erro ao salvar sintoma: ${error.message}`);
  }

  const allMeds = [
    ...crisis.medications.filter((m) => m !== 'nenhum'),
    ...crisis.customMedications,
  ];
  for (const med of allMeds) {
    const medLabel = MEDICATIONS.find((m) => m.id === med)?.label ?? med;
    const medId = await upsertLookup('medicamentos', medLabel);
    const { error } = await supabase
      .from('medicamentos_crise')
      .insert({ crise_id: criseId, medicamentos_id: medId });
    if (error) throw new Error(`Erro ao salvar medicamento: ${error.message}`);
  }

  for (const trigger of crisis.triggers) {
    const fatorId = await upsertLookup('fatores_desencadeantes', trigger);
    const { error } = await supabase
      .from('fatores_desencadeantes_crise')
      .insert({ crise_id: criseId, fatores_desencadeantes_id: fatorId });
    if (error) throw new Error(`Erro ao salvar fator desencadeante: ${error.message}`);
  }
}
