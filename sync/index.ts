import { pullFromServer } from './pull';
import { contarPendentes, pushToServer } from './push';

/**
 * Ponto unico de sincronizacao. Issue #50.
 *
 * Envia primeiro, replica depois. A ordem importa: replicar antes deixaria a tela mostrando
 * por um instante a versao do servidor de algo que o aparelho acabou de mudar.
 */

export type SyncResult = {
  enviados: number;
  pendentes: number;
  replicou: boolean;
};

/**
 * Trava de MODULO, nao de componente.
 *
 * A sincronizacao dispara de tres lugares: o boot, a volta da conexao e a gravacao — e esta
 * ultima acontece dentro do repositorio, fora do React. Um guarda que vivesse no contexto nao
 * veria a chamada vinda do repositorio, e duas gravacoes seguidas abririam duas
 * sincronizacoes concorrentes escrevendo na mesma transacao do SQLite.
 *
 * Quem chega durante uma sincronizacao em andamento recebe a MESMA promessa em vez de ser
 * ignorado: assim `await sincronizar()` depois de gravar espera o resultado real.
 */
let emAndamento: Promise<SyncResult> | null = null;

export function sincronizar(): Promise<SyncResult> {
  if (emAndamento) return emAndamento;

  emAndamento = executar().finally(() => {
    emAndamento = null;
  });

  return emAndamento;
}

async function executar(): Promise<SyncResult> {
  const envio = await pushToServer();

  // Falha na replicacao nao pode apagar o resultado do envio: o registro ja esta no servidor,
  // e a proxima replicacao traz o estado consolidado.
  let replicou = false;
  try {
    const resultado = await pullFromServer();
    replicou = resultado.replicou;
  } catch {
    replicou = false;
  }

  return {
    enviados: envio.enviados,
    pendentes: await contarPendentes(),
    replicou,
  };
}

/**
 * Só envia, sem replicar. Usado depois de gravar. Issue #50.
 *
 * Gravar não precisa baixar o servidor de novo: a linha já está no banco local e a tela já a
 * mostra, porque a leitura é local desde a #49. Chamar a sincronização completa aqui faria
 * cada registro salvo rebaixar o histórico inteiro, com a tela de sucesso esperando por isso.
 *
 * Compartilha a mesma trava, para não concorrer com uma sincronização de boot em andamento.
 */
export function enviarPendentes(): Promise<number> {
  if (emAndamento) return emAndamento.then((r) => r.enviados);

  const promessa = pushToServer().then((r) => ({
    enviados: r.enviados,
    pendentes: r.pendentes,
    replicou: false,
  }));

  emAndamento = promessa.finally(() => {
    emAndamento = null;
  });

  return emAndamento.then((r) => r.enviados);
}

export { contarPendentes } from './push';
export { onDadosLocaisMudaram } from './notify';
