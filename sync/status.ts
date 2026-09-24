import { getDb } from '@/db';

/**
 * Estado da fila de envio, para a interface. Issue #51.
 *
 * Conta `crise_enxaqueca` e `registro_diario`, NAO `registro_crise`: a fase sobe junto com a
 * crise, no mesmo pacote atomico da #40. Contar fase separada inflaria o numero — uma crise de
 * duas fases apareceria como tres pendencias.
 */

/** Passado esse tempo, uma pendencia deixou de ser "sem rede" e virou algo que nao vai subir
 *  sozinho. Tres dias e a mesma janela de tolerancia offline que a #56 definiu: e quando a
 *  sessao local expira e a pessoa cai na tela de login. Se a pendencia chegar ate la, ela
 *  precisa saber antes. */
export const DIAS_PARA_AVISAR = 3;

export type EstadoDaFila = {
  /** Registros gravados no aparelho e ainda nao enviados. */
  pendentes: number;
  /** O mais antigo deles, pela hora em que o aparelho gravou. */
  pendenteMaisAntigo: Date | null;
  /**
   * Verdadeiro quando ha pendencia mais velha que DIAS_PARA_AVISAR.
   *
   * E o unico caso em que a interface diz algo em texto. Abaixo disso o relogio no historico
   * basta: a fila esvazia sozinha e nao ha nada a fazer.
   */
  travado: boolean;
};

export const FILA_VAZIA: EstadoDaFila = {
  pendentes: 0,
  pendenteMaisAntigo: null,
  travado: false,
};

export async function lerEstadoDaFila(): Promise<EstadoDaFila> {
  const db = await getDb();

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

// Marcar cada crise no historico NAO passa por aqui: `Crisis.enviado` faz parte do contrato de
// leitura, entao o objeto carrega o proprio estado. Uma segunda consulta devolvendo ids
// pendentes seria uma fonte de verdade paralela, capaz de divergir da lista que a tela desenha.
