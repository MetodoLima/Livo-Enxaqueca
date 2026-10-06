import { bancoDoUsuario } from '@/db/owner';
import type { PacoteCrise } from '@/repositories/crisisPackage';
import type { Crisis, CrisisFilter, Phase } from '@/repositories/types';

type CriseRow = {
  id: string;
  inicio_crise: string | null;
  fim_crise: string | null;
  synced: number;
};

type FaseRow = {
  id: string;
  crise_id: string;
  intensidade_dor: number | null;
  regiao_dor: string | null;
  lado: string | null;
  nivel_incapacidade: string | null;
  resumo: string | null;
  sintomas: string;
  medicamentos: string;
  medicamentos_livres: string;
  fatores: string;
};

function parseArray(texto: string | null): string[] {
  if (!texto) return [];
  try {
    const valor = JSON.parse(texto);
    return Array.isArray(valor) ? (valor as string[]) : [];
  } catch {
    return [];
  }
}

function toPhase(row: FaseRow): Phase {
  return {
    id: row.id,
    intensidadeDor: row.intensidade_dor,
    regiaoDor: row.regiao_dor,
    lado: row.lado,
    nivelIncapacidade: row.nivel_incapacidade,
    resumo: row.resumo,
    sintomas: parseArray(row.sintomas),
    medicamentos: parseArray(row.medicamentos),
    medicamentosLivres: parseArray(row.medicamentos_livres),
    fatores: parseArray(row.fatores),
  };
}

const COLUNAS_FASE = `
  id, crise_id, intensidade_dor, regiao_dor, lado, nivel_incapacidade, resumo,
  sintomas, medicamentos, medicamentos_livres, fatores
`;

export const crisisRepository = {
  async list(filtro: CrisisFilter = {}): Promise<Crisis[]> {
    const db = await bancoDoUsuario();

    const condicoes: string[] = [];
    const params: string[] = [];

    if (filtro.desde) {
      condicoes.push('inicio_crise >= ?');
      params.push(filtro.desde.toISOString());
    }
    if (filtro.ate) {
      condicoes.push('inicio_crise <= ?');
      params.push(filtro.ate.toISOString());
    }
    if (filtro.comecouAntesDe) {
      condicoes.push('inicio_crise < ?');
      params.push(filtro.comecouAntesDe.toISOString());
    }
    if (filtro.terminaApos) {
      condicoes.push('fim_crise >= ?');
      params.push(filtro.terminaApos.toISOString());
    }

    const where = condicoes.length > 0 ? `where ${condicoes.join(' and ')}` : '';

    const ordem =
      filtro.ordem === 'desc'
        ? 'order by inicio_crise desc nulls first'
        : 'order by inicio_crise asc nulls last';

    const crises = await db.getAllAsync<CriseRow>(
      `select id, inicio_crise, fim_crise, synced from crise_enxaqueca ${where} ${ordem}`,
      params,
    );

    if (crises.length === 0) return [];

    const ids = crises.map((c) => c.id);
    const marcadores = ids.map(() => '?').join(', ');
    const fases = await db.getAllAsync<FaseRow>(
      `select ${COLUNAS_FASE} from registro_crise where crise_id in (${marcadores})`,
      ids,
    );

    const porCrise = new Map<string, Phase[]>();
    for (const fase of fases) {
      const lista = porCrise.get(fase.crise_id);
      if (lista) lista.push(toPhase(fase));
      else porCrise.set(fase.crise_id, [toPhase(fase)]);
    }

    return crises.map((c) => ({
      id: c.id,
      inicioCrise: c.inicio_crise ? new Date(c.inicio_crise) : null,
      fimCrise: c.fim_crise ? new Date(c.fim_crise) : null,
      fases: porCrise.get(c.id) ?? [],
      enviado: c.synced === 1,
    }));
  },

  async lastEndedAt(): Promise<Date | null> {
    const db = await bancoDoUsuario();
    const linha = await db.getFirstAsync<{ fim_crise: string }>(
      'select fim_crise from crise_enxaqueca where fim_crise is not null order by fim_crise desc limit 1',
    );
    return linha?.fim_crise ? new Date(linha.fim_crise) : null;
  },

  async countSince(data: Date): Promise<number> {
    const db = await bancoDoUsuario();
    const linha = await db.getFirstAsync<{ total: number }>(
      'select count(*) as total from crise_enxaqueca where inicio_crise >= ?',
      [data.toISOString()],
    );
    return linha?.total ?? 0;
  },

  async intensities(): Promise<number[]> {
    const db = await bancoDoUsuario();
    const linhas = await db.getAllAsync<{ intensidade_dor: number }>(
      'select intensidade_dor from registro_crise where intensidade_dor is not null',
    );
    return linhas.map((l) => l.intensidade_dor);
  },

  async save(pacote: PacoteCrise): Promise<string> {
    const db = await bancoDoUsuario();
    const { crise, fases } = pacote;

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `insert into crise_enxaqueca (id, inicio_crise, fim_crise, updated_at, synced)
         values (?, ?, ?, ?, 0)`,
        [crise.id, crise.inicio_crise, crise.fim_crise, crise.updated_at],
      );

      for (const fase of fases) {
        await db.runAsync(
          `insert into registro_crise
             (id, crise_id, intensidade_dor, regiao_dor, lado, nivel_incapacidade, resumo,
              sintomas, medicamentos, medicamentos_livres, fatores, updated_at, synced)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            fase.id,
            crise.id,
            fase.intensidade_dor,
            fase.regiao_dor,
            fase.lado,
            fase.nivel_incapacidade,
            fase.resumo,
            JSON.stringify(fase.sintomas),
            JSON.stringify(fase.medicamentos),
            JSON.stringify(fase.medicamentos_livres),
            JSON.stringify(fase.fatores),
            fase.updated_at,
          ],
        );
      }
    });

    return crise.id;
  },
};
