import { bancoDoUsuario } from '@/db/owner';
import { inicioDoDiaLocal } from '@/lib/format';
import type { MomentoPayload } from '@/repositories/remote/momentRepository';
import type { HumorId, Momento } from '@/repositories/types';

type MomentoRow = {
  id: string;
  registrado_em: string;
  humor: string | null;
  relato: string | null;
  synced: number;
};

function toMomento(l: MomentoRow): Momento {
  return {
    id: l.id,
    registradoEm: l.registrado_em,
    humor: (l.humor ?? null) as HumorId | null,
    relato: l.relato,
    enviado: l.synced === 1,
  };
}

function intervaloDosDias(de: string, ate: string): [string, string] {
  const inicio = inicioDoDiaLocal(de);
  const fim = inicioDoDiaLocal(ate);
  fim.setDate(fim.getDate() + 1);
  return [inicio.toISOString(), fim.toISOString()];
}

export const momentRepository = {
  async listBetween(de: string, ate: string): Promise<Momento[]> {
    const db = await bancoDoUsuario();
    const [inicio, fim] = intervaloDosDias(de, ate);

    const linhas = await db.getAllAsync<MomentoRow>(
      `select id, registrado_em, humor, relato, synced
         from registro_momento
        where registrado_em >= ? and registrado_em < ?
        order by registrado_em asc`,
      [inicio, fim],
    );

    return linhas.map(toMomento);
  },

  async ultimoDoDia(data: string): Promise<Momento | null> {
    const db = await bancoDoUsuario();
    const [inicio, fim] = intervaloDosDias(data, data);

    const linha = await db.getFirstAsync<MomentoRow>(
      `select id, registrado_em, humor, relato, synced
         from registro_momento
        where registrado_em >= ? and registrado_em < ?
        order by registrado_em desc
        limit 1`,
      [inicio, fim],
    );

    return linha ? toMomento(linha) : null;
  },

  async registrar(momento: MomentoPayload): Promise<string> {
    const db = await bancoDoUsuario();

    await db.runAsync(
      `insert into registro_momento (id, registrado_em, humor, relato, updated_at, synced)
       values (?, ?, ?, ?, ?, 0)`,
      [momento.id, momento.registradoEm, momento.humor, momento.relato, momento.updatedAt],
    );

    return momento.id;
  },
};
