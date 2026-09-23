import { getDb } from '@/db';
import type { DailyRecord, HumorId } from '../types';

/**
 * Leitura de registro diario contra o banco local. Issue #49.
 *
 * A versao remota resolve o dono chamando `userRepository.currentUsuarioId()`, que vai ao
 * servidor. Aqui isso nao acontece, e nao e simplificacao: em modo aviao aquela chamada
 * falharia e derrubaria a leitura local junto. A replica pertence a um usuario so, garantido
 * pela conferencia de dono em sync_state a cada replicacao, entao nao ha o que filtrar.
 */

type RegistroRow = {
  id: string;
  data: string;
  relato: string | null;
  horas_sono: number | null;
  ml_agua: number | null;
  humor: string | null;
  created_at: string | null;
};

export const dailyRecordRepository = {
  async listBetween(de: string, ate: string): Promise<DailyRecord[]> {
    const db = await getDb();

    const linhas = await db.getAllAsync<RegistroRow>(
      `select id, data, relato, horas_sono, ml_agua, humor, created_at
         from registro_diario
        where data >= ? and data <= ?
        order by created_at asc`,
      [de, ate],
    );

    return linhas.map((l) => ({
      id: l.id,
      data: l.data,
      relato: l.relato,
      horasSono: l.horas_sono,
      mlAgua: l.ml_agua,
      humor: (l.humor ?? null) as HumorId | null,
      createdAt: l.created_at ?? '',
    }));
  },
};
