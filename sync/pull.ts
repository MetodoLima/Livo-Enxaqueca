import { getDb } from '@/db';
import { getSyncValue, setSyncValue } from '@/db/syncState';
import { crisisRepository as remoteCrisisRepository } from '@/repositories/remote/crisisRepository';
import { dailyRecordRepository as remoteDailyRecordRepository } from '@/repositories/remote/dailyRecordRepository';
import { userRepository } from '@/repositories/remote/userRepository';

/**
 * Replicacao do servidor para o banco local. Issue #49.
 *
 * Nao escreve nenhuma consulta nova: usa as implementacoes remotas que a #48 ja criou. Era
 * esse o ponto de ter contratos em termos de dominio — a replicacao pede `Crisis[]` e nao
 * precisa saber como o PostgREST devolve.
 *
 * Reescreve as tabelas inteiras em vez de replicar incrementalmente. Com cerca de cem crises
 * o custo nao se mede, e reescrever e idempotente: nao existe estado parcial para consertar
 * se a replicacao for interrompida, porque tudo acontece numa transacao.
 */

// `registro_diario.data` e um dia, nao um instante. Os extremos cobrem qualquer data que o
// app consiga produzir sem precisar descobrir a mais antiga antes de consultar.
const DATA_MINIMA = '0001-01-01';
const DATA_MAXIMA = '9999-12-31';

export type PullResult = { replicou: boolean; motivo?: 'sem-perfil' };

/**
 * Quem replicou avisa; quem le, rele.
 *
 * A replicacao dispara de tres lugares — o boot, a volta da conexao e a gravacao, que ate a
 * #50 precisa replicar depois de subir. Sem um aviso central, cada um deles teria que
 * lembrar de atualizar a tela, e o de dentro do repositorio nem tem acesso ao contexto do
 * React. O SyncContext e o unico ouvinte hoje, e e ele que os hooks observam.
 */
type Ouvinte = () => void;
const ouvintes = new Set<Ouvinte>();

export function onReplicated(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

export async function pullFromServer(): Promise<PullResult> {
  const usuarioId = await userRepository.currentUsuarioId();
  if (usuarioId === null) {
    // Sem sessao ou sem perfil em public.usuarios nao ha o que replicar. Quem chama decide
    // se isso e erro; aqui e so ausencia de trabalho.
    return { replicou: false, motivo: 'sem-perfil' };
  }

  const [crises, registros] = await Promise.all([
    remoteCrisisRepository.list(),
    remoteDailyRecordRepository.listBetween(DATA_MINIMA, DATA_MAXIMA),
  ]);

  const db = await getDb();
  const donoAnterior = await getSyncValue('owner', db);
  const trocouUsuario = donoAnterior !== null && donoAnterior !== String(usuarioId);

  await db.withTransactionAsync(async () => {
    if (trocouUsuario) {
      // A replica e de outra pessoa e nao pode ficar no aparelho, entao sai inteira.
      //
      // ATENCAO PARA A #50: quando a fila existir, uma linha com synced = 0 aqui seria
      // registro nao enviado sendo apagado. Hoje nao existe nenhuma, porque so a #50 cria.
      // O que fazer nesse caso e uma das perguntas da issue da fila x fim de sessao, e
      // precisa ser respondida antes de a fila entrar.
      await db.execAsync(
        'delete from registro_crise; delete from crise_enxaqueca; delete from registro_diario;',
      );
    } else {
      // Apaga so o que veio do servidor. Linha com synced = 0 e escrita local que ainda nao
      // subiu e sobrevive a replicacao — a regra entra agora para a #50 nao precisar voltar
      // aqui, e para nao existir uma janela em que replicar apague registro do paciente.
      await db.runAsync('delete from registro_crise where synced = 1');
      await db.runAsync('delete from crise_enxaqueca where synced = 1');
      await db.runAsync('delete from registro_diario where synced = 1');
    }

    const agora = new Date().toISOString();

    for (const crise of crises) {
      // `or ignore` em vez de `or replace`: se sobrou linha local com synced = 0, a versao
      // do aparelho vence ate ser enviada.
      await db.runAsync(
        `insert or ignore into crise_enxaqueca (id, inicio_crise, fim_crise, updated_at, synced)
         values (?, ?, ?, ?, 1)`,
        [
          crise.id,
          crise.inicioCrise ? crise.inicioCrise.toISOString() : null,
          crise.fimCrise ? crise.fimCrise.toISOString() : null,
          agora,
        ],
      );

      for (const fase of crise.fases) {
        await db.runAsync(
          `insert or ignore into registro_crise
             (id, crise_id, intensidade_dor, regiao_dor, lado, nivel_incapacidade, resumo,
              sintomas, medicamentos, medicamentos_livres, fatores, updated_at, synced)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            fase.id,
            crise.id,
            fase.intensidadeDor,
            fase.regiaoDor,
            fase.lado,
            fase.nivelIncapacidade,
            fase.resumo,
            JSON.stringify(fase.sintomas),
            JSON.stringify(fase.medicamentos),
            JSON.stringify(fase.medicamentosLivres),
            JSON.stringify(fase.fatores),
            agora,
          ],
        );
      }
    }

    for (const registro of registros) {
      await db.runAsync(
        `insert or ignore into registro_diario
           (id, data, relato, horas_sono, ml_agua, humor, created_at, updated_at, synced)
         values (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          registro.id,
          registro.data,
          registro.relato,
          registro.horasSono,
          registro.mlAgua,
          registro.humor,
          registro.createdAt || null,
          agora,
        ],
      );
    }
  });

  await setSyncValue('owner', String(usuarioId), db);
  await setSyncValue('lastPulledAt', new Date().toISOString(), db);

  for (const ouvinte of ouvintes) ouvinte();

  return { replicou: true };
}
