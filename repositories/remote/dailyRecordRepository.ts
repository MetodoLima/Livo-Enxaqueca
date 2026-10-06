import { supabase } from '@/lib/supabase';
import type { DailyRecord, HumorId } from '@/repositories/types';
import { userRepository } from './userRepository';

export type RegistroDiarioPayload = {
  id: string;
  data: string;
  relato: string | null;
  horasSono: number | null;
  mlAgua: number | null;
  humor: HumorId | null;
  updatedAt: string;
};

type RegistroDiarioRow = {
  id: string;
  data: string;
  relato: string | null;
  horas_sono: number | null;
  ml_agua: number | null;
  humor: string | null;
  created_at: string;
};

function toDailyRecord(row: RegistroDiarioRow): DailyRecord {
  return {
    id: row.id,
    data: row.data,
    relato: row.relato ?? null,
    horasSono: row.horas_sono ?? null,
    mlAgua: row.ml_agua ?? null,
    humor: (row.humor ?? null) as HumorId | null,
    createdAt: row.created_at,
    enviado: true,
  };
}

export const dailyRecordRepository = {
  async listBetween(de: string, ate: string): Promise<DailyRecord[]> {
    const usuarioId = await userRepository.currentUsuarioId();
    if (usuarioId === null) return [];

    const { data, error } = await supabase
      .from('registro_diario')
      .select('id, data, relato, horas_sono, ml_agua, humor, created_at')
      .eq('user_id', usuarioId)
      .gte('data', de)
      .lte('data', ate)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(toDailyRecord);
  },

  async enviarRegistroDiario(
    registro: RegistroDiarioPayload,
    usuarioId: number,
  ): Promise<void> {
    const { error } = await supabase.from('registro_diario').upsert(
      {
        id: registro.id,
        user_id: usuarioId,
        data: registro.data,
        relato: registro.relato,
        horas_sono: registro.horasSono,
        ml_agua: registro.mlAgua,
        humor: registro.humor,
        updated_at: registro.updatedAt,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    );

    if (error) throw error;
  },
};
