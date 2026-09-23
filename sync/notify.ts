/**
 * Aviso de que o dado local mudou. Issues #49 e #50.
 *
 * Quem escreve avisa; quem le, rele. O dado local muda em tres momentos — a replicacao traz
 * do servidor, a gravacao cria linha nova, e o envio marca linha como enviada — e nenhum
 * deles pode depender de a tela lembrar de atualizar sozinha. A gravacao e o envio acontecem
 * dentro do repositorio e da fila, fora do React, e nem teriam acesso ao contexto.
 *
 * O SyncContext e o unico ouvinte, e e ele que os hooks observam.
 */

type Ouvinte = () => void;

const ouvintes = new Set<Ouvinte>();

export function onDadosLocaisMudaram(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

export function notificarDadosLocais(): void {
  for (const ouvinte of ouvintes) ouvinte();
}
