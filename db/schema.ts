/**
 * Schema do banco local. Issues #49 e #50.
 *
 * Espelha as tres tabelas de dado de paciente que as telas leem. Nao espelha `usuarios`,
 * `perguntas_setup` nem `respostas_setup`: setup acontece uma vez, com conexao, e nao e
 * consultado offline.
 *
 * A replica pertence a UM usuario. Nenhuma tabela aqui guarda `user_id`, porque os
 * contratos de leitura da #48 nao devolvem esse campo e nao ha por que inventar coluna que
 * nao se sabe preencher. O dono fica em `sync_state` e e conferido a cada replicacao e a
 * cada envio.
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

/**
 * Migracoes do banco local, aplicadas por `PRAGMA user_version`. Issue #50.
 *
 * Mesma ideia das migrations do Supabase: lista ordenada, cada passo roda uma vez, nunca se
 * edita um passo ja aplicado. `create table if not exists` nao resolve isso sozinho, porque
 * nao adiciona coluna em tabela que ja existe — e todo aparelho do time ja tem as tabelas da
 * versao 1, criadas pela #49.
 *
 * Para adicionar um passo: acrescente ao fim da lista e nao toque nos anteriores. A posicao
 * no array e a versao: indice 0 leva o banco para a versao 1.
 */
export const MIGRACOES: string[] = [
  // ── v1 · Issue #49 ────────────────────────────────────────────────────────
  // O espelho das tres tabelas de paciente, mais o estado da replicacao.
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

  // ── v2 · Issue #50 ────────────────────────────────────────────────────────
  // Controle de envio. Estas tres colunas existem SO no aparelho: o servidor nao precisa
  // saber quantas vezes tentamos mandar. Sao o que a #51 le para avisar que algo falha ha
  // dias.
  //
  // A quarentena guarda registro nao enviado de um dono que nao e mais o da sessao. A
  // alternativa era apagar, e apagar dado clinico do paciente em silencio nao esta em
  // questao. O `payload` e a linha inteira em JSON, porque a tabela de origem pode ter
  // schema diferente quando ela voltar para a fila.
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
