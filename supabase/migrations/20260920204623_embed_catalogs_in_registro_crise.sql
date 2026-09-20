-- Elimina o padrao de tabela de consulta para sintomas, medicamentos e fatores.
-- Issue #45.
--
-- Antes de gravar um sintoma, o app consultava o servidor para saber se aquele nome
-- ja existia e inseria caso nao existisse. Essa consulta e impossivel offline e era o
-- principal bloqueio ao funcionamento sem internet.
--
-- Era tambem a origem de um bug ativo: sem politica de INSERT em
-- fatores_desencadeantes, o ultimo laco de savePhaseToSupabase estourava e deixava a
-- crise gravada pela metade. Em 101 crises, nenhum fator desencadeante chegou a ser
-- associado, enquanto sintomas e medicamentos gravaram 185 e 140.
--
-- O catalogo passa a viver no app, em types/crisis.ts, e o registro guarda os ids.
-- Um registro vira uma linha, sem juncao para sincronizar, que e o que a fila de envio
-- da T3.7 precisa.
--
-- NOTA SOBRE ACENTOS: nenhum literal acentuado aparece abaixo, de proposito. Os nomes
-- no banco tem acento ("Nausea", "Vomito"), e se o encoding do arquivo nao casasse com
-- o do cliente, a comparacao falharia em silencio e os arrays sairiam vazios sem erro.
-- Por isso a comparacao usa LIKE com curinga no lugar da letra acentuada.

-- --- Colunas novas ---------------------------------------------------------

alter table public.registro_crise
  add column sintomas            text[] not null default '{}',
  add column medicamentos        text[] not null default '{}',
  add column medicamentos_livres text[] not null default '{}',
  add column fatores             text[] not null default '{}';

-- --- Migracao dos dados existentes -----------------------------------------

-- Sintomas: a tabela de catalogo guarda o rotulo em portugues, o app usa o id.
-- Os dois nomes que existem no banco mas nao no catalogo do app
-- ("Sensibilidade a cheiros" e "Visao turva") tem zero associacoes; o
-- array_remove descarta o null que o case produziria para eles.
update public.registro_crise rc
set sintomas = coalesce((
  select array_remove(array_agg(distinct case
      when lower(s.nome) like 'n%usea'    then 'nausea'
      when lower(s.nome) = 'luz incomoda' then 'fotofobia'
      when lower(s.nome) = 'som incomoda' then 'fonofobia'
      when lower(s.nome) = 'tontura'      then 'tontura'
      when lower(s.nome) = 'aura visual'  then 'aura'
      when lower(s.nome) like 'v%mito'    then 'vomito'
    end), null)
  from public.sintoma_registro_crise src
  join public.sintomas s on s.id = src.sintoma_id
  where src.registro_crise_id = rc.id
), '{}');

-- Medicamentos do catalogo: o id e o nome em minusculas, sem excecao.
update public.registro_crise rc
set medicamentos = coalesce((
  select array_agg(distinct lower(m.nome))
  from public.medicamentos_registro_crise mrc
  join public.medicamentos m on m.id = mrc.medicamentos_id
  where mrc.registro_crise_id = rc.id
    and lower(m.nome) in ('sumatriptano', 'dipirona', 'paracetamol',
                          'ibuprofeno', 'naproxeno', 'nimesulida')
), '{}');

-- Medicamentos digitados pelo usuario. Preserva o texto como esta, inclusive as
-- duplicatas por diferenca de maiuscula que existem hoje ("Dorflex icehot" e
-- "Dorflex Icehot"), porque normalizar isso e decisao de produto, nao de migracao.
update public.registro_crise rc
set medicamentos_livres = coalesce((
  select array_agg(distinct m.nome)
  from public.medicamentos_registro_crise mrc
  join public.medicamentos m on m.id = mrc.medicamentos_id
  where mrc.registro_crise_id = rc.id
    and lower(m.nome) not in ('sumatriptano', 'dipirona', 'paracetamol',
                              'ibuprofeno', 'naproxeno', 'nimesulida', 'nenhum')
), '{}');

-- Fatores: a juncao esta vazia por causa do bug descrito no topo, entao este update
-- nao tem o que copiar. Fica aqui porque a migracao nao pode assumir que ninguem
-- gravou nada entre a auditoria e a aplicacao.
update public.registro_crise rc
set fatores = coalesce((
  select array_agg(distinct f.nome)
  from public.fatores_desencadeantes_registro_crise fc
  join public.fatores_desencadeantes f on f.id = fc.fatores_desencadeantes_id
  where fc.registro_crise_id = rc.id
), '{}');

-- --- Remocao das tabelas antigas -------------------------------------------

-- As juncoes primeiro, porque referenciam os catalogos. As politicas de RLS de cada
-- tabela caem junto com ela.
drop table public.sintoma_registro_crise;
drop table public.medicamentos_registro_crise;
drop table public.fatores_desencadeantes_registro_crise;

drop table public.sintomas;
drop table public.medicamentos;
drop table public.fatores_desencadeantes;

-- sensacao_dor e sensacao_dor_registro_crise seguem o mesmo padrao de tabela de
-- consulta e nenhuma tela as acessa, mas estao fora do escopo da #45 e ficam.
