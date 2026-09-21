-- Identificadores gerados no aparelho e campos de controle de sincronizacao.
-- Issues #44 e #46.
--
-- #44: os ids vinham do banco, como bigint identity. Sem conexao o app nao tinha como
-- criar o identificador de um registro novo, o que tornava a criacao offline impossivel.
-- Passam a ser uuid, gerados pelo cliente.
--
-- #46: a fila de envio precisa saber o que mudou, quando mudou e o que ja subiu. Sem
-- esses campos nao existe resolucao de conflito nem remocao logica.
--
-- As duas vao na mesma migracao porque mexem nas mesmas tabelas, e separadas abririam
-- duas janelas de incompatibilidade entre app e banco.
--
-- Os dados sao preservados: cada linha recebe um uuid novo e as chaves estrangeiras sao
-- reapontadas antes de as colunas antigas sairem. Mesmo padrao que funcionou na #45.
--
-- usuarios.id continua bigint de proposito. A #44 pede uuid para crise, registro de
-- crise e registro diario; mudar usuarios arrastaria respostas_setup e o setup inteiro.

-- ===========================================================================
-- PARTE 1: chaves para uuid
-- ===========================================================================

-- Duas politicas de RLS fazem join em crise_enxaqueca.id e registro_crise.id, e o
-- Postgres recusa dropar coluna que uma politica referencia. Elas saem aqui e voltam
-- identicas no fim desta parte. As definicoes vieram de pg_policies, nao foram
-- reescritas de memoria: e assim que se abre brecha de autorizacao sem perceber.
drop policy "usuarios_acessam_proprios_registros" on public.registro_crise;
drop policy "usuarios_acessam_proprias_sensacoes" on public.sensacao_dor_registro_crise;

-- gen_random_uuid() e nativo no Postgres 13+, sem precisar de extensao.
alter table public.crise_enxaqueca add column id_uuid uuid not null default gen_random_uuid();
alter table public.registro_crise  add column id_uuid uuid not null default gen_random_uuid();
alter table public.registro_diario add column id_uuid uuid not null default gen_random_uuid();

alter table public.registro_crise              add column crise_uuid uuid;
alter table public.sensacao_dor_registro_crise add column registro_crise_uuid uuid;

-- Reaponta as referencias para os ids novos, antes de qualquer coluna sair.
update public.registro_crise r
   set crise_uuid = c.id_uuid
  from public.crise_enxaqueca c
 where c.id = r.crise_id;

update public.sensacao_dor_registro_crise s
   set registro_crise_uuid = r.id_uuid
  from public.registro_crise r
 where r.id = s.registro_crise_id;

-- Restricoes antigas. As estrangeiras primeiro, senao as primarias nao saem.
alter table public.registro_crise              drop constraint registro_crise_crise_id_fkey;
alter table public.sensacao_dor_registro_crise drop constraint sensacao_dor_registro_crise_registro_crise_id_fkey;
alter table public.sensacao_dor_registro_crise drop constraint sensacao_dor_registro_crise_pkey;

alter table public.crise_enxaqueca drop constraint crise_enxaqueca_pkey;
alter table public.registro_crise  drop constraint registro_crise_pkey;
alter table public.registro_diario drop constraint registro_diario_pkey;

-- Troca as colunas. Dropar a coluna leva embora a identity ou o default de sequencia.
alter table public.crise_enxaqueca drop column id;
alter table public.crise_enxaqueca rename column id_uuid to id;

alter table public.registro_crise drop column id;
alter table public.registro_crise rename column id_uuid to id;
alter table public.registro_crise drop column crise_id;
alter table public.registro_crise rename column crise_uuid to crise_id;
alter table public.registro_crise alter column crise_id set not null;

alter table public.registro_diario drop column id;
alter table public.registro_diario rename column id_uuid to id;

alter table public.sensacao_dor_registro_crise drop column registro_crise_id;
alter table public.sensacao_dor_registro_crise rename column registro_crise_uuid to registro_crise_id;
alter table public.sensacao_dor_registro_crise alter column registro_crise_id set not null;

drop sequence if exists public.registro_diario_id_seq;

-- Restricoes de volta, com os mesmos nomes de antes.
alter table public.crise_enxaqueca add constraint crise_enxaqueca_pkey primary key (id);
alter table public.registro_crise  add constraint registro_crise_pkey  primary key (id);
alter table public.registro_diario add constraint registro_diario_pkey primary key (id);

alter table public.sensacao_dor_registro_crise
  add constraint sensacao_dor_registro_crise_pkey primary key (registro_crise_id, sensacao_dor_id);

alter table public.registro_crise
  add constraint registro_crise_crise_id_fkey
  foreign key (crise_id) references public.crise_enxaqueca(id);

alter table public.sensacao_dor_registro_crise
  add constraint sensacao_dor_registro_crise_registro_crise_id_fkey
  foreign key (registro_crise_id) references public.registro_crise(id);

-- Politicas de volta, identicas. A igualdade continua valendo entre uuids.
create policy "usuarios_acessam_proprios_registros"
  on public.registro_crise
  for all
  to authenticated
  using (exists (
    select 1
      from public.crise_enxaqueca ce
      join public.usuarios u on u.id = ce.user_id
     where ce.id = registro_crise.crise_id
       and u.user_id = auth.uid()
  ))
  with check (exists (
    select 1
      from public.crise_enxaqueca ce
      join public.usuarios u on u.id = ce.user_id
     where ce.id = registro_crise.crise_id
       and u.user_id = auth.uid()
  ));

create policy "usuarios_acessam_proprias_sensacoes"
  on public.sensacao_dor_registro_crise
  for all
  to authenticated
  using (exists (
    select 1
      from public.registro_crise rc
      join public.crise_enxaqueca ce on ce.id = rc.crise_id
      join public.usuarios u on u.id = ce.user_id
     where rc.id = sensacao_dor_registro_crise.registro_crise_id
       and u.user_id = auth.uid()
  ))
  with check (exists (
    select 1
      from public.registro_crise rc
      join public.crise_enxaqueca ce on ce.id = rc.crise_id
      join public.usuarios u on u.id = ce.user_id
     where rc.id = sensacao_dor_registro_crise.registro_crise_id
       and u.user_id = auth.uid()
  ));

-- ===========================================================================
-- PARTE 2: campos de controle de sincronizacao
-- ===========================================================================

-- Nas cinco tabelas de dado de paciente. As de catalogo (perguntas_setup,
-- opcoes_pergunta, sensacao_dor) ficam de fora: nao guardam dado de usuario.
--
-- updated_at e escrito pelo APP, nao por trigger. No modelo offline o momento que
-- importa e o da edicao no aparelho, nao o da chegada ao servidor; um trigger
-- sobrescreveria isso e quebraria a regra de ultima escrita vence.
--
-- deleted_at nulo significa nao removido. Nenhuma remocao fisica existe no app hoje,
-- entao este campo nasce sem nada para converter.
--
-- synced e decorativo AQUI: o que esta no Supabase esta sincronizado por definicao. Ele
-- existe para o schema do SQLite local espelhar este, nas T3.6 e T3.7, onde marca o que
-- ainda nao subiu. Default true no servidor justamente por isso.

-- O if not exists e proposital: registro_diario JA tinha updated_at, criado em algum
-- momento antes desta migracao e sem os outros dois campos. As cinco tabelas tambem ja
-- tinham created_at.

alter table public.usuarios
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists synced     boolean not null default true;

alter table public.crise_enxaqueca
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists synced     boolean not null default true;

alter table public.registro_crise
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists synced     boolean not null default true;

alter table public.registro_diario
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists synced     boolean not null default true;

alter table public.respostas_setup
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists synced     boolean not null default true;

-- O updated_at pre-existente de registro_diario aceitava nulo, o que quebraria a
-- resolucao de conflito: linha sem data de atualizacao nao tem como ser comparada. O
-- coalesce cai para created_at antes de exigir o not null.
update public.registro_diario
   set updated_at = coalesce(updated_at, created_at, now())
 where updated_at is null;

alter table public.registro_diario alter column updated_at set not null;
