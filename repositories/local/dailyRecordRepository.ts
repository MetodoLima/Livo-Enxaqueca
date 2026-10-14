import { bancoDoUsuario } from '@/db/owner';
import type { RegistroDia, RegistroDiaPatch } from '@/repositories/types';

type RegistroDiaRow = {
  data: string;
  dormi_as: string | null;
  acordei_as: string | null;
  ml_agua: number | null;
  created_at: string | null;
  synced: number;
};

function toRegistroDia(l: RegistroDiaRow): RegistroDia {
  return {
    data: l.data,
    dormiAs: l.dormi_as,
    acordeiAs: l.acordei_as,
    mlAgua: l.ml_agua,
    createdAt: l.created_at ?? '',
    enviado: l.synced === 1,
  };
}

export const dailyRecordRepository = {
  async listBetween(de: string, ate: string): Promise<RegistroDia[]> {
    const db = await bancoDoUsuario();

    const linhas = await db.getAllAsync<RegistroDiaRow>(
      `select data, dormi_as, acordei_as, ml_agua, created_at, synced
         from registro_diario
        where data >= ? and data <= ?
        order by data asc`,
      [de, ate],
    );

    return linhas.map(toRegistroDia);
  },

  async salvarDia(data: string, patch: RegistroDiaPatch, agora: string): Promise<string> {
    const db = await bancoDoUsuario();

    await db.withTransactionAsync(async () => {
      const atual = await db.getFirstAsync<RegistroDiaRow>(
        `select data, dormi_as, acordei_as, ml_agua, created_at, synced
           from registro_diario
          where data = ?`,
        [data],
      );

      const dormiAs = patch.sono !== undefined ? (patch.sono?.dormiAs ?? null) : (atual?.dormi_as ?? null);
      const acordeiAs = patch.sono !== undefined ? (patch.sono?.acordeiAs ?? null) : (atual?.acordei_as ?? null);
      const mlAgua = patch.mlAgua !== undefined ? patch.mlAgua : (atual?.ml_agua ?? null);

      await db.runAsync(
        `insert or replace into registro_diario
           (data, dormi_as, acordei_as, ml_agua, created_at, updated_at, synced,
            tentativas, ultima_tentativa_em, ultimo_erro)
         values (?, ?, ?, ?, ?, ?, 0, 0, null, null)`,
        [data, dormiAs, acordeiAs, mlAgua, atual?.created_at ?? agora, agora],
      );
    });

    return data;
  },
};
