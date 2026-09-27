import { getDb } from '@/db';
import type { PacoteCrise } from '../crisisPackage';
import type { Crisis, CrisisFilter, Phase } from '../types';

/**
 * Leitura de crise contra o banco local. Issue #49.
 *
 * Satisfaz a mesma parte de leitura do contrato `CrisisRepository` que a implementacao
 * remota. O `save` NAO esta aqui: ate a #50 a gravacao continua indo direto ao servidor.
 * A composicao acontece em repositories/index.ts.
 */

type CriseRow = {
  id: string;
  inicio_crise: string | null;
  fim_crise: string | null;
  /** 0 enquanto a crise existe so no aparelho. Issue #51. */
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

// Os arrays chegam como texto JSON, porque o SQLite nao tem tipo de array. Linha corrompida
// vira lista vazia em vez de derrubar a tela: perder um sintoma e melhor que perder o
// historico inteiro.
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
    const db = await getDb();

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

    // O `nulls last` / `nulls first` e explicito de proposito: inicio_crise aceita nulo, e
    // os dois bancos discordam no padrao. Postgres poe nulo no fim em asc e no inicio em
    // desc; o SQLite faz o contrario. Sem isso, a mesma consulta devolveria ordem diferente
    // dependendo de haver rede, que e o tipo de divergencia impossivel de depurar depois.
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
    const db = await getDb();
    const linha = await db.getFirstAsync<{ fim_crise: string }>(
      'select fim_crise from crise_enxaqueca where fim_crise is not null order by fim_crise desc limit 1',
    );
    return linha?.fim_crise ? new Date(linha.fim_crise) : null;
  },

  async countSince(data: Date): Promise<number> {
    const db = await getDb();
    const linha = await db.getFirstAsync<{ total: number }>(
      'select count(*) as total from crise_enxaqueca where inicio_crise >= ?',
      [data.toISOString()],
    );
    return linha?.total ?? 0;
  },

  async intensities(): Promise<number[]> {
    const db = await getDb();
    const linhas = await db.getAllAsync<{ intensidade_dor: number }>(
      'select intensidade_dor from registro_crise where intensidade_dor is not null',
    );
    return linhas.map((l) => l.intensidade_dor);
  },

  /**
   * Grava a crise e as fases no aparelho, com `synced = 0`. Issue #50.
   *
   * Recebe o pacote ja montado, com os identificadores gerados, em vez de montar o seu. E o
   * que permite o envio direto ao servidor — quando este banco nao abre — usar os MESMOS ids:
   * se por algum motivo os dois caminhos gravarem, o `on conflict (id) do nothing` do servidor
   * reconhece a mesma crise em vez de criar duas. A montagem mora em repositories/crisisPackage.
   *
   * Tudo numa transacao: uma crise sem as fases seria pior do que nenhuma crise. E a mesma
   * garantia que a #40 deu no servidor, agora tambem no aparelho.
   */
  async save(pacote: PacoteCrise): Promise<string> {
    const db = await getDb();
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
