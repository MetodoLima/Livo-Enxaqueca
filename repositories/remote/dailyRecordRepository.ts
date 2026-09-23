import { supabase } from '@/lib/supabase';
import { randomUUID } from 'expo-crypto';
import type { DailyRecord, DailyRecordRepository, HumorId, NewDailyRecord } from '../types';
import { userRepository } from './userRepository';

/**
 * Registro diario de sono, agua, humor e relato. Issue #48.
 */

function toDailyRecord(row: any): DailyRecord {
  return {
    id: row.id,
    data: row.data,
    relato: row.relato ?? null,
    horasSono: row.horas_sono ?? null,
    mlAgua: row.ml_agua ?? null,
    humor: (row.humor ?? null) as HumorId | null,
    createdAt: row.created_at,
  };
}

export const dailyRecordRepository: DailyRecordRepository = {
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

  async save(registro: NewDailyRecord): Promise<void> {
    const usuarioId = await userRepository.currentUsuarioId();
    if (usuarioId === null) {
      throw new Error('Perfil do usuario nao encontrado');
    }

    const { error } = await supabase.from('registro_diario').insert({
      // O id vem do aparelho, nao do banco: sem isso a criacao offline e impossivel. #44
      id: randomUUID(),
      user_id: usuarioId,
      data: registro.data,
      relato: registro.relato,
      horas_sono: registro.horasSono,
      ml_agua: registro.mlAgua,
      humor: registro.humor,
      // Escrito pelo app, nao por trigger: no modelo offline o momento que importa e o da
      // edicao no aparelho. Ver a #46 e a ressalva registrada na #50 sobre o trigger de
      // UPDATE que ainda existe nesta tabela.
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  },
};
