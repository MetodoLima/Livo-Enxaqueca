/**
 * Schema do banco local. Issue #49.
 *
 * Espelha as tres tabelas de dado de paciente que as telas leem. Nao espelha `usuarios`,
 * `perguntas_setup` nem `respostas_setup`: setup acontece uma vez, com conexao, e nao e
 * consultado offline.
 *
 * A replica pertence a UM usuario. Nenhuma tabela aqui guarda `user_id`, porque os
 * contratos de leitura da #48 nao devolvem esse campo e nao ha por que inventar coluna que
 * nao se sabe preencher. O dono fica em `sync_state` e e conferido a cada replicacao; se
 * mudar, a replica e apagada antes de puxar.
 *
 * Duas traducoes que o SQLite obriga:
 *
 * 1. OS ARRAYS VIRAM TEXTO JSON. `sintomas`, `medicamentos`, `medicamentos_livres` e
 *    `fatores` sao `text[]` no Postgres desde a #45. O SQLite nao tem tipo de array, entao
 *    sao guardados como JSON e convertidos na leitura. E o unico ponto em que o formato
 *    local difere do remoto, e e exatamente por isso que os contratos da #48 falam em termos
 *    de dominio: as duas implementacoes chegam no mesmo `Phase`.
 *
 * 2. AS DATAS VIRAM TEXTO ISO. Comparadas por string, o que funciona porque ISO 8601 ordena
 *    lexicograficamente. E isso que permite os filtros de `CrisisFilter` virarem `where`
 *    sem funcao de conversao.
 */

export const SCHEMA_VERSION = 1;

export const SCHEMA = `
pragma journal_mode = WAL;

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

create index if not exists idx_registro_crise_crise_id  on registro_crise(crise_id);
create index if not exists idx_crise_enxaqueca_inicio   on crise_enxaqueca(inicio_crise);
create index if not exists idx_registro_diario_data     on registro_diario(data);
create index if not exists idx_crise_enxaqueca_fim      on crise_enxaqueca(fim_crise);
`;
