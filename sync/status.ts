import { bancoDoUsuario } from '@/db/owner';

export const DIAS_PARA_AVISAR = 3;

export type EstadoDaFila = {
  pendentes: number;
  pendenteMaisAntigo: Date | null;
  travado: boolean;
};

export const FILA_VAZIA: EstadoDaFila = {
  pendentes: 0,
  pendenteMaisAntigo: null,
  travado: false,
};

export async function lerEstadoDaFila(): Promise<EstadoDaFila> {
  const db = await bancoDoUsuario();

  const linha = await db.getFirstAsync<{ total: number; mais_antigo: string | null }>(
    `select count(*) as total, min(updated_at) as mais_antigo
       from (
         select updated_at from crise_enxaqueca where synced = 0
         union all
         select updated_at from registro_diario where synced = 0
       ) as pendentes`,
  );

  const pendentes = linha?.total ?? 0;
  if (pendentes === 0) return FILA_VAZIA;

  const maisAntigo = linha?.mais_antigo ? new Date(linha.mais_antigo) : null;
  const limite = Date.now() - DIAS_PARA_AVISAR * 24 * 60 * 60 * 1000;

  return {
    pendentes,
    pendenteMaisAntigo: maisAntigo,
    travado: maisAntigo !== null && maisAntigo.getTime() < limite,
  };
}
