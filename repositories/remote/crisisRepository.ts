import { supabase } from '@/lib/supabase';
import type { Crisis, CrisisFilter, Phase } from '../types';

/**
 * O formato que a funcao salvar_crise espera. Nomes de coluna, nao de dominio, porque este e
 * o contrato com o banco e nao com o app.
 */
export type CrisePayload = {
  id: string;
  inicio_crise: string | null;
  fim_crise: string | null;
  updated_at: string;
};

export type FasePayload = {
  id: string;
  intensidade_dor: number | null;
  regiao_dor: string | null;
  lado: string | null;
  nivel_incapacidade: string | null;
  resumo: string | null;
  sintomas: string[];
  medicamentos: string[];
  medicamentos_livres: string[];
  fatores: string[];
  updated_at: string;
};

/**
 * Implementacao contra o Supabase. Issue #48.
 *
 * Quatro hooks faziam esta mesma consulta, cada um com um recorte diferente de colunas e o
 * mapeamento reescrito por cima de `any`. Aqui ela existe uma vez, com o superconjunto das
 * colunas, e quem chama usa o que precisa.
 */

const SELECT = `
  id,
  inicio_crise,
  fim_crise,
  registro_crise (
    id,
    intensidade_dor,
    regiao_dor,
    lado,
    nivel_incapacidade,
    resumo,
    sintomas,
    medicamentos,
    medicamentos_livres,
    fatores
  )
`;

function toPhase(row: any): Phase {
  return {
    id: row.id,
    intensidadeDor: row.intensidade_dor ?? null,
    regiaoDor: row.regiao_dor ?? null,
    lado: row.lado ?? null,
    nivelIncapacidade: row.nivel_incapacidade ?? null,
    resumo: row.resumo ?? null,
    sintomas: (row.sintomas ?? []) as string[],
    medicamentos: (row.medicamentos ?? []) as string[],
    medicamentosLivres: (row.medicamentos_livres ?? []) as string[],
    fatores: (row.fatores ?? []) as string[],
  };
}

function toCrisis(row: any): Crisis {
  return {
    id: row.id,
    inicioCrise: row.inicio_crise ? new Date(row.inicio_crise) : null,
    fimCrise: row.fim_crise ? new Date(row.fim_crise) : null,
    fases: (Array.isArray(row.registro_crise) ? row.registro_crise : []).map(toPhase),
  };
}

export const crisisRepository = {
  async list(filtro: CrisisFilter = {}): Promise<Crisis[]> {
    let query = supabase.from('crise_enxaqueca').select(SELECT);

    if (filtro.desde) query = query.gte('inicio_crise', filtro.desde.toISOString());
    if (filtro.ate) query = query.lte('inicio_crise', filtro.ate.toISOString());
    if (filtro.comecouAntesDe) {
      query = query.lt('inicio_crise', filtro.comecouAntesDe.toISOString());
    }
    if (filtro.terminaApos) query = query.gte('fim_crise', filtro.terminaApos.toISOString());

    const { data, error } = await query.order('inicio_crise', {
      ascending: filtro.ordem !== 'desc',
    });

    if (error) throw error;
    return (data ?? []).map(toCrisis);
  },

  async lastEndedAt(): Promise<Date | null> {
    const { data, error } = await supabase
      .from('crise_enxaqueca')
      .select('fim_crise')
      .not('fim_crise', 'is', null)
      .order('fim_crise', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.fim_crise ? new Date(data.fim_crise) : null;
  },

  async countSince(data: Date): Promise<number> {
    const { count, error } = await supabase
      .from('crise_enxaqueca')
      .select('id', { count: 'exact', head: true })
      .gte('inicio_crise', data.toISOString());

    if (error) throw error;
    return count ?? 0;
  },

  async intensities(): Promise<number[]> {
    const { data, error } = await supabase
      .from('registro_crise')
      .select('intensidade_dor')
      .not('intensidade_dor', 'is', null);

    if (error) throw error;
    return (data ?? [])
      .map((row: { intensidade_dor: number | null }) => row.intensidade_dor)
      .filter((v): v is number => v != null);
  },

  /**
   * Envia uma crise e todas as suas fases numa unica chamada atomica. Issues #40 e #50.
   *
   * Recebe o payload pronto em vez de um CrisisRecord: desde a #50 a crise nasce no banco
   * local com identificador proprio, e e a fila que a envia lendo as linhas de la. Se os
   * identificadores fossem gerados aqui, cada reenvio criaria linha nova e a idempotencia da
   * funcao salvar_crise nao serviria para nada.
   *
   * A resolucao do usuario mora dentro da funcao, por auth.uid(), entao o aparelho nao
   * informa nem tem como informar o dono.
   */
  async enviarCrise(crise: CrisePayload, fases: FasePayload[]): Promise<void> {
    const { error } = await supabase.rpc('salvar_crise', {
      p_crise: crise,
      p_fases: fases,
    });

    if (error) throw new Error(`Erro ao salvar crise: ${error.message}`);
  },
};
