import { abrirBancoDoUsuario, restaurarQuarentena, usuarioAtual } from '@/db/owner';
import { getSyncValue, setSyncValue } from '@/db/syncState';
import { crisisRepository as remoteCrisisRepository } from '@/repositories/remote/crisisRepository';
import { dailyRecordRepository as remoteDailyRecordRepository } from '@/repositories/remote/dailyRecordRepository';
import { momentRepository as remoteMomentRepository } from '@/repositories/remote/momentRepository';
import { userRepository } from '@/repositories/remote/userRepository';
import { notificarDadosLocais } from './notify';

const DATA_MINIMA = '0001-01-01';
const DATA_MAXIMA = '9999-12-31';

export type PullResult = { replicou: boolean; motivo?: 'sem-perfil' };

export async function pullFromServer(): Promise<PullResult> {
  const { db, dono } = await abrirBancoDoUsuario();

  const usuarioId = await userRepository.currentUsuarioId();
  if (usuarioId === null) {
    return { replicou: false, motivo: 'sem-perfil' };
  }

  const [crises, registros, momentos] = await Promise.all([
    remoteCrisisRepository.list(),
    remoteDailyRecordRepository.listBetween(DATA_MINIMA, DATA_MAXIMA),
    remoteMomentRepository.listAll(),
  ]);

  await db.withTransactionAsync(async () => {
    if (usuarioAtual() !== dono || (await getSyncValue('owner', db)) !== dono) {
      throw new Error('O dono do banco local mudou durante a replicacao.');
    }

    await restaurarQuarentena(db, String(usuarioId));

    await db.runAsync('delete from registro_crise where synced = 1');
    await db.runAsync('delete from crise_enxaqueca where synced = 1');
    await db.runAsync('delete from registro_diario where synced = 1');
    await db.runAsync('delete from registro_momento where synced = 1');

    const agora = new Date().toISOString();

    for (const crise of crises) {
      await db.runAsync(
        `insert or ignore into crise_enxaqueca (id, inicio_crise, fim_crise, updated_at, synced)
         values (?, ?, ?, ?, 1)`,
        [
          crise.id,
          crise.inicioCrise ? crise.inicioCrise.toISOString() : null,
          crise.fimCrise ? crise.fimCrise.toISOString() : null,
          agora,
        ],
      );

      for (const fase of crise.fases) {
        await db.runAsync(
          `insert or ignore into registro_crise
             (id, crise_id, intensidade_dor, regiao_dor, lado, nivel_incapacidade, resumo,
              sintomas, medicamentos, medicamentos_livres, fatores, updated_at, synced)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            fase.id,
            crise.id,
            fase.intensidadeDor,
            fase.regiaoDor,
            fase.lado,
            fase.nivelIncapacidade,
            fase.resumo,
            JSON.stringify(fase.sintomas),
            JSON.stringify(fase.medicamentos),
            JSON.stringify(fase.medicamentosLivres),
            JSON.stringify(fase.fatores),
            agora,
          ],
        );
      }
    }

    for (const registro of registros) {
      await db.runAsync(
        `insert or ignore into registro_diario
           (data, dormi_as, acordei_as, ml_agua, created_at, updated_at, synced)
         values (?, ?, ?, ?, ?, ?, 1)`,
        [
          registro.data,
          registro.dormiAs,
          registro.acordeiAs,
          registro.mlAgua,
          registro.createdAt || null,
          agora,
        ],
      );
    }

    for (const momento of momentos) {
      await db.runAsync(
        `insert or ignore into registro_momento
           (id, registrado_em, humor, relato, updated_at, synced)
         values (?, ?, ?, ?, ?, 1)`,
        [momento.id, momento.registradoEm, momento.humor, momento.relato, agora],
      );
    }
  });

  await setSyncValue('lastPulledAt', new Date().toISOString(), db);

  notificarDadosLocais();

  return { replicou: true };
}
