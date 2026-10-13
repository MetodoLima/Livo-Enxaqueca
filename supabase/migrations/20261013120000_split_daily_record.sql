-- Separa o registro diario em dois: o resumo do dia (sono e agua) e o momento
-- (humor e relato).
--
-- Ritmos diferentes: humor e relato acontecem varias vezes ao dia, a qualquer hora;
-- sono e agua sao um por dia. Na mesma linha, o registro do dia virava duplicata a
-- cada envio, e o momento perdia a hora em que aconteceu.
--
-- O historico de registro_diario era de teste e foi descartado por decisao do time:
-- a tabela e recriada, sem migracao de dados. Antes do drop foi conferido no painel
-- (pg_depend, pg_constraint e pg_proc) que nenhuma view, chave estrangeira de entrada
-- ou funcao depende da tabela; so os objetos dela mesma, que caem junto.
--
-- registro_diario
--   Uma linha por usuario e dia, chave (user_id, data). A linha e atualizada, nao
--   duplicada, e a chave natural dispensa id gerado no aparelho.
--   data e a data LOCAL do aparelho, enviada pelo app. Nunca derivar de timestamp no
--   servidor: agua registrada as 23h em Fortaleza cairia no dia seguinte em UTC.
--   Convencao do sono: o registro pertence ao dia em que a pessoa ACORDOU. Dormiu as
--   23h do dia 10 e acordou as 7h do dia 11: e o registro do dia 11. A duracao nao e
--   gravada; o app calcula a partir de dormi_as e acordei_as, tratando a virada da
--   meia-noite.
--   updated_at e escrito pelo app, como nas demais tabelas desde a #46. O trigger
--   trg_registro_diario_updated_at, que sobrescrevia esse valor, nao volta.
--   synced fica pelo mesmo motivo da migracao device_generated_ids_and_sync_fields:
--   decorativo aqui, existe para o schema local espelhar este.
--
-- registro_momento
--   Varias linhas por dia. id gerado no aparelho, como as crises (#44): o reenvio
--   depois de timeout usa o mesmo id e nao duplica.
--   registrado_em vem do aparelho, no momento do registro. Um momento registrado as
--   9h sem internet e enviado as 15h continua marcado 9h.
--   O humor de um momento pode ter sido herdado do momento anterior do mesmo dia, sem
--   ser reafirmado pela pessoa naquele instante. Ver docs/ARCHITECTURE.md.

drop table public.registro_diario;

create table public.registro_diario (
  user_id    bigint      not null references public.usuarios(id),
  data       date        not null,
  dormi_as   time,
  acordei_as time,
  ml_agua    integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  synced     boolean     not null default true,
  constraint registro_diario_pkey primary key (user_id, data),
  constraint registro_diario_sono_completo check ((dormi_as is null) = (acordei_as is null)),
  constraint registro_diario_ml_agua_check check (ml_agua is null or ml_agua >= 0)
);

create table public.registro_momento (
  id            uuid        not null default gen_random_uuid(),
  user_id       bigint      not null references public.usuarios(id),
  registrado_em timestamptz not null,
  humor         text,
  relato        text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  synced        boolean     not null default true,
  constraint registro_momento_pkey primary key (id),
  constraint registro_momento_humor_check check (humor is null or humor = any (array['terrible', 'bad', 'so-so', 'okay', 'great'])),
  constraint registro_momento_conteudo check (humor is not null or relato is not null)
);

create index idx_registro_momento_user_registrado_em
  on public.registro_momento (user_id, registrado_em);

alter table public.registro_diario  enable row level security;
alter table public.registro_momento enable row level security;

-- Mesma indirecao das politicas de crise (#77): user_id aponta para usuarios.id, e
-- quem guarda o id de autenticacao e usuarios.user_id. A tabela antiga tinha so
-- select, insert e update, sem "to authenticated" e sem with check no update; aqui as
-- quatro voltam completas, porque o update passa a ser usado de verdade.

create policy "Usuario pode ver seus registros do dia"
  on public.registro_diario for select to authenticated
  using (user_id in (select usuarios.id from public.usuarios where usuarios.user_id = auth.uid()));

create policy "Usuario pode criar seus registros do dia"
  on public.registro_diario for insert to authenticated
  with check (user_id in (select usuarios.id from public.usuarios where usuarios.user_id = auth.uid()));

create policy "Usuario pode atualizar seus registros do dia"
  on public.registro_diario for update to authenticated
  using (user_id in (select usuarios.id from public.usuarios where usuarios.user_id = auth.uid()))
  with check (user_id in (select usuarios.id from public.usuarios where usuarios.user_id = auth.uid()));

create policy "Usuario pode apagar seus registros do dia"
  on public.registro_diario for delete to authenticated
  using (user_id in (select usuarios.id from public.usuarios where usuarios.user_id = auth.uid()));

create policy "Usuario pode ver seus momentos"
  on public.registro_momento for select to authenticated
  using (user_id in (select usuarios.id from public.usuarios where usuarios.user_id = auth.uid()));

create policy "Usuario pode criar seus momentos"
  on public.registro_momento for insert to authenticated
  with check (user_id in (select usuarios.id from public.usuarios where usuarios.user_id = auth.uid()));

create policy "Usuario pode atualizar seus momentos"
  on public.registro_momento for update to authenticated
  using (user_id in (select usuarios.id from public.usuarios where usuarios.user_id = auth.uid()))
  with check (user_id in (select usuarios.id from public.usuarios where usuarios.user_id = auth.uid()));

create policy "Usuario pode apagar seus momentos"
  on public.registro_momento for delete to authenticated
  using (user_id in (select usuarios.id from public.usuarios where usuarios.user_id = auth.uid()));

-- Defesa em profundidade, como na #40: o Supabase concede acesso a anon nas tabelas
-- novas por default privileges, e a chave anonima e publica.
revoke all on table public.registro_diario  from anon;
revoke all on table public.registro_momento from anon;
