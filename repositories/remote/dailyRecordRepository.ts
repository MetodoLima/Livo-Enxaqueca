import { supabase } from '@/lib/supabase';
import type { DailyRecord, HumorId } from '../types';
import { userRepository } from './userRepository';

/**
 * Registro diario de sono, agua, humor e relato. Issues #48 e #50.
 *
 * `listBetween` continua consultando o servidor: e usado pela replicacao da #49, que so roda
 * com rede. A leitura offline vive em repositories/local.
 */

/**
 * O que o insert precisa, e nada mais. Issue #51.
 *
 * Nao reutiliza `DailyRecord`: aquele tipo descreve um registro LIDO, e carrega `createdAt` e
 * `enviado`, que nao existem antes de a linha chegar ao servidor. Enviar um tipo de leitura
 * obrigaria a fila a inventar valor para campo que ela nao tem.
 */
export type RegistroDiarioPayload = {
  id: string;
  data: string;
  relato: string | null;
  horasSono: number | null;
  mlAgua: number | null;
  humor: HumorId | null;
  updatedAt: string;
};

function toDailyRecord(row: any): DailyRecord {
  return {
    id: row.id,
    data: row.data,
    relato: row.relato ?? null,
    horasSono: row.horas_sono ?? null,
    mlAgua: row.ml_agua ?? null,
    humor: (row.humor ?? null) as HumorId | null,
    createdAt: row.created_at,
    // O que veio do servidor esta enviado por definicao. Issue #51.
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

  /**
   * Envia um registro diario ja formado. Issue #50.
   *
   * Recebe `usuarioId` de fora em vez de perguntar ao servidor: quem chama e a fila, que le
   * o dono de sync_state e funciona sem rede ate a hora do envio. Era essa consulta que
   * produzia "Perfil do usuario nao encontrado" ao salvar em modo aviao.
   *
   * O aparelho informar o dono nao e brecha: a politica de INSERT da tabela confere
   * `user_id` contra `auth.uid()` dentro do banco, entao valor errado e recusado.
   *
   * `upsert` com `ignoreDuplicates` vira `on conflict do nothing` no PostgREST, o que da
   * idempotencia no reenvio sem migration nova. E como nao acontece UPDATE, o gatilho
   * trg_registro_diario_updated_at nao dispara e nao sobrescreve o horario do aparelho.
   */
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
