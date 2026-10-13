import { supabase } from '@/lib/supabase';
import type { HumorId, Momento } from '@/repositories/types';
import { userRepository } from './userRepository';

export type MomentoPayload = {
  id: string;
  registradoEm: string;
  humor: HumorId | null;
  relato: string | null;
  updatedAt: string;
};

type MomentoRow = {
  id: string;
  registrado_em: string;
  humor: string | null;
  relato: string | null;
};

function toMomento(row: MomentoRow): Momento {
  return {
    id: row.id,
    registradoEm: new Date(row.registrado_em).toISOString(),
    humor: (row.humor ?? null) as HumorId | null,
    relato: row.relato ?? null,
    enviado: true,
  };
}

export const momentRepository = {
  async listAll(): Promise<Momento[]> {
    const usuarioId = await userRepository.currentUsuarioId();
    if (usuarioId === null) return [];

    const { data, error } = await supabase
      .from('registro_momento')
      .select('id, registrado_em, humor, relato')
      .eq('user_id', usuarioId)
      .order('registrado_em', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(toMomento);
  },

  async enviarMomento(momento: MomentoPayload, usuarioId: number): Promise<void> {
    const { error } = await supabase.from('registro_momento').upsert(
      {
        id: momento.id,
        user_id: usuarioId,
        registrado_em: momento.registradoEm,
        humor: momento.humor,
        relato: momento.relato,
        updated_at: momento.updatedAt,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    );

    if (error) throw error;
  },
};
