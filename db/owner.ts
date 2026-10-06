import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from './index';
import { getSyncValue, setSyncValue } from './syncState';

let usuarioDaSessao: string | null = null;
let donoConfirmado: string | null = null;
let trocaEmAndamento: Promise<void> | null = null;

export class SemSessaoLocal extends Error {
  readonly codigo = 'sem-sessao-local';

  constructor() {
    super('Nenhuma sessao ativa para ler ou gravar os dados do aparelho.');
  }
}

export function definirUsuarioDaSessao(usuario: string | null): void {
  usuarioDaSessao = usuario;
}

export function usuarioAtual(): string | null {
  return usuarioDaSessao;
}

export async function abrirBancoDoUsuario(): Promise<{ db: SQLiteDatabase; dono: string }> {
  const usuario = usuarioDaSessao;
  if (!usuario) throw new SemSessaoLocal();

  const db = await getDb();

  while (donoConfirmado !== usuario) {
    if (!trocaEmAndamento) {
      trocaEmAndamento = assumirBanco(db, usuario)
        .then(() => {
          donoConfirmado = usuario;
        })
        .finally(() => {
          trocaEmAndamento = null;
        });
    }
    await trocaEmAndamento;
  }

  return { db, dono: usuario };
}

export async function bancoDoUsuario(): Promise<SQLiteDatabase> {
  return (await abrirBancoDoUsuario()).db;
}

async function assumirBanco(db: SQLiteDatabase, usuario: string): Promise<void> {
  const donoAtual = await getSyncValue('owner', db);
  if (donoAtual === usuario) return;

  await db.withTransactionAsync(async () => {
    if (donoAtual !== null) {
      await quarentenar(db, donoAtual);
      await db.execAsync(
        `delete from registro_crise;
         delete from crise_enxaqueca;
         delete from registro_diario;
         delete from sync_state where key = 'lastPulledAt';`,
      );
    }
    await setSyncValue('owner', usuario, db);
    await restaurarQuarentena(db, usuario);
  });
}

async function quarentenar(db: SQLiteDatabase, dono: string): Promise<void> {
  const agora = new Date().toISOString();

  const crises = await db.getAllAsync<Record<string, unknown>>(
    'select * from crise_enxaqueca where synced = 0',
  );

  for (const crise of crises) {
    const fases = await db.getAllAsync<Record<string, unknown>>(
      'select * from registro_crise where crise_id = ?',
      [crise.id as string],
    );
    await db.runAsync(
      `insert or replace into pendencias_orfas (id, dono, tabela, payload, criado_em)
       values (?, ?, 'crise_enxaqueca', ?, ?)`,
      [crise.id as string, dono, JSON.stringify({ crise, fases }), agora],
    );
  }

  const registros = await db.getAllAsync<Record<string, unknown>>(
    'select * from registro_diario where synced = 0',
  );

  for (const registro of registros) {
    await db.runAsync(
      `insert or replace into pendencias_orfas (id, dono, tabela, payload, criado_em)
       values (?, ?, 'registro_diario', ?, ?)`,
      [registro.id as string, dono, JSON.stringify(registro), agora],
    );
  }
}

export async function restaurarQuarentena(db: SQLiteDatabase, dono: string): Promise<void> {
  const orfas = await db.getAllAsync<{ id: string; tabela: string; payload: string }>(
    'select id, tabela, payload from pendencias_orfas where dono = ?',
    [dono],
  );

  for (const orfa of orfas) {
    let dados: { crise?: Record<string, unknown>; fases?: Record<string, unknown>[] } & Record<string, unknown>;
    try {
      dados = JSON.parse(orfa.payload);
    } catch {
      continue;
    }

    if (orfa.tabela === 'crise_enxaqueca') {
      if (!dados.crise) continue;
      await inserirLinha(db, 'crise_enxaqueca', dados.crise);
      for (const fase of dados.fases ?? []) {
        await inserirLinha(db, 'registro_crise', fase);
      }
    } else {
      await inserirLinha(db, 'registro_diario', dados);
    }

    await db.runAsync('delete from pendencias_orfas where id = ? and dono = ?', [
      orfa.id,
      dono,
    ]);
  }
}

type TabelaRestauravel = 'crise_enxaqueca' | 'registro_crise' | 'registro_diario';

const COLUNA_VALIDA = /^[a-z_]+$/;

async function inserirLinha(
  db: SQLiteDatabase,
  tabela: TabelaRestauravel,
  linha: Record<string, unknown>,
): Promise<void> {
  const colunas = Object.keys(linha).filter((c) => COLUNA_VALIDA.test(c));
  if (colunas.length === 0) return;

  const marcadores = colunas.map(() => '?').join(', ');
  await db.runAsync(
    `insert or ignore into ${tabela} (${colunas.join(', ')}) values (${marcadores})`,
    colunas.map((c) => linha[c] as string | number | null),
  );
}
