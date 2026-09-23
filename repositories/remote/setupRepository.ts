import { supabase } from '@/lib/supabase';
import type { SetupAnswer, SetupQuestion, SetupRepository } from '../types';

/**
 * Perguntas e respostas do cadastro inicial de nove passos. Issue #48.
 */

function toQuestion(row: any): SetupQuestion {
  return {
    id: row.id,
    texto: row.texto,
    tipo: row.tipo,
    passoSetup: row.passo_setup,
    opcoes: (Array.isArray(row.opcoes_pergunta) ? row.opcoes_pergunta : []).map((o: any) => ({
      id: o.id,
      texto: o.texto,
    })),
  };
}

/**
 * Nao grava chave ausente. A tabela tem uma coluna por tipo de resposta e a linha preenche
 * so a que corresponde ao tipo da pergunta; mandar as outras como undefined viraria null
 * explicito no insert.
 */
function toRow(resposta: SetupAnswer): Record<string, unknown> {
  const row: Record<string, unknown> = {
    user_id: resposta.usuarioId,
    pergunta_id: resposta.perguntaId,
  };

  if (resposta.valorNumero !== undefined) row.valor_numero = resposta.valorNumero;
  if (resposta.valorTexto !== undefined) row.valor_texto = resposta.valorTexto;
  if (resposta.valorBooleano !== undefined) row.valor_booleano = resposta.valorBooleano;
  if (resposta.opcaoId !== undefined) row.opcao_id = resposta.opcaoId;
  if (resposta.valorAcimaMax !== undefined) row.valor_acima_max = resposta.valorAcimaMax;
  if (resposta.valorAbaixoMin !== undefined) row.valor_abaixo_min = resposta.valorAbaixoMin;

  return row;
}

export const setupRepository: SetupRepository = {
  async listQuestions(): Promise<SetupQuestion[]> {
    const { data, error } = await supabase
      .from('perguntas_setup')
      .select('id, texto, tipo, passo_setup, opcoes_pergunta(id, texto)');

    if (error) throw error;
    if (!data) throw new Error('Falha ao buscar perguntas.');
    return data.map(toQuestion);
  },

  async saveAnswers(respostas: SetupAnswer[]): Promise<void> {
    if (respostas.length === 0) return;

    const { error } = await supabase.from('respostas_setup').insert(respostas.map(toRow));
    if (error) throw error;
  },
};
