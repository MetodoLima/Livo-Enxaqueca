import { pullFromServer } from './pull';
import { contarPendentes, pushToServer } from './push';

export type SyncResult = {
  enviados: number;
  pendentes: number;
  replicou: boolean;
};

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
