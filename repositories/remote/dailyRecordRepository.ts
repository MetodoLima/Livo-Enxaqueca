import { supabase } from '@/lib/supabase';
import type { RegistroDia } from '@/repositories/types';
import { userRepository } from './userRepository';

export type RegistroDiaPayload = {
  data: string;
  dormiAs?: string | null;
  acordeiAs?: string | null;
  mlAgua?: number | null;
  updatedAt: string;
};

type RegistroDiaRow = {
  data: string;
  dormi_as: string | null;
  acordei_as: string | null;
  ml_agua: number | null;
  created_at: string;
};

function semSegundos(horario: string | null): string | null {
  return horario ? horario.slice(0, 5) : null;
}

function toRegistroDia(row: RegistroDiaRow): RegistroDia {
  return {
    data: row.data,
    dormiAs: semSegundos(row.dormi_as),
    acordeiAs: semSegundos(row.acordei_as),
    mlAgua: row.ml_agua ?? null,
    createdAt: new Date(row.created_at).toISOString(),
    enviado: true,
  };
}

export const dailyRecordRepository = {
  async listBetween(de: string, ate: string): Promise<RegistroDia[]> {
    const usuarioId = await userRepository.currentUsuarioId();
    if (usuarioId === null) return [];

    const { data, error } = await supabase
      .from('registro_diario')
      .select('data, dormi_as, acordei_as, ml_agua, created_at')
      .eq('user_id', usuarioId)
      .gte('data', de)
      .lte('data', ate)
      .order('data', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(toRegistroDia);
  },

  async enviarRegistroDia(registro: RegistroDiaPayload, usuarioId: number): Promise<void> {
    const linha: Record<string, string | number | null> = {
      user_id: usuarioId,
      data: registro.data,
      updated_at: registro.updatedAt,
    };
    if (registro.dormiAs !== undefined) linha.dormi_as = registro.dormiAs;
    if (registro.acordeiAs !== undefined) linha.acordei_as = registro.acordeiAs;
    if (registro.mlAgua !== undefined) linha.ml_agua = registro.mlAgua;

    const { error } = await supabase
      .from('registro_diario')
      .upsert(linha, { onConflict: 'user_id,data' });

    if (error) throw error;
  },
};
