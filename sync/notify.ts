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
