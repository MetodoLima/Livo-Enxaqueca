export const MIGRACOES: string[] = [
  `
  create table if not exists crise_enxaqueca (
    id           text primary key not null,
    inicio_crise text,
    fim_crise    text,
    updated_at   text not null,
    deleted_at   text,
    synced       integer not null default 1
  );

  create table if not exists registro_crise (
    id                  text primary key not null,
    crise_id            text not null,
    intensidade_dor     integer,
    regiao_dor          text,
    lado                text,
    nivel_incapacidade  text,
    resumo              text,
    sintomas            text not null default '[]',
    medicamentos        text not null default '[]',
    medicamentos_livres text not null default '[]',
    fatores             text not null default '[]',
    updated_at          text not null,
    deleted_at          text,
    synced              integer not null default 1
  );

  create table if not exists registro_diario (
    id         text primary key not null,
    data       text not null,
    relato     text,
    horas_sono real,
    ml_agua    integer,
    humor      text,
    created_at text,
    updated_at text not null,
    deleted_at text,
    synced     integer not null default 1
  );

  create table if not exists sync_state (
    key   text primary key not null,
    value text
  );

  create index if not exists idx_registro_crise_crise_id on registro_crise(crise_id);
  create index if not exists idx_crise_enxaqueca_inicio  on crise_enxaqueca(inicio_crise);
  create index if not exists idx_crise_enxaqueca_fim     on crise_enxaqueca(fim_crise);
  create index if not exists idx_registro_diario_data    on registro_diario(data);
  `,

  `
  alter table crise_enxaqueca add column tentativas          integer not null default 0;
  alter table crise_enxaqueca add column ultima_tentativa_em text;
  alter table crise_enxaqueca add column ultimo_erro         text;

  alter table registro_crise  add column tentativas          integer not null default 0;
  alter table registro_crise  add column ultima_tentativa_em text;
  alter table registro_crise  add column ultimo_erro         text;

  alter table registro_diario add column tentativas          integer not null default 0;
  alter table registro_diario add column ultima_tentativa_em text;
  alter table registro_diario add column ultimo_erro         text;

  create table if not exists pendencias_orfas (
    id        text primary key not null,
    dono      text not null,
    tabela    text not null,
    payload   text not null,
    criado_em text not null
  );

  create index if not exists idx_pendencias_orfas_dono on pendencias_orfas(dono);

  create index if not exists idx_crise_enxaqueca_synced on crise_enxaqueca(synced);
  create index if not exists idx_registro_crise_synced  on registro_crise(synced);
  create index if not exists idx_registro_diario_synced on registro_diario(synced);
  `,
];

export const SCHEMA_VERSION = MIGRACOES.length;
