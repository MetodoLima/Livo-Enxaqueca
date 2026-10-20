// TEMPORARIO. Remover na etapa 3 (calendario e detalhe), issue "Remove the temporary
// daily record adapter".
// Existe porque a etapa 1 separou registro_diario em registro do dia e registro_momento,
// e o calendario, a lista e o detalhe ainda esperam o formato antigo, com humor, relato,
// sono e agua num item so. Este arquivo converte os dois registros nesse formato para
// essas telas continuarem compilando sem redesenho.
import { duracaoSono, inicioDoDiaLocal, lerHorario, toLocalDateString } from '@/lib/format';
import {
  dailyRecordRepository,
  momentRepository,
  type HumorId,
  type Momento,
  type RegistroDia,
} from '@/repositories';

export interface RegistroCombinado {
  id: string;
  data: string;
  relato: string | null;
  horasSono: number | null;
  mlAgua: number | null;
  humor: HumorId | null;
  createdAt: string;
  enviado: boolean;
}

function doDia(registro: RegistroDia): RegistroCombinado {
  const dormi = lerHorario(registro.dormiAs);
  const acordei = lerHorario(registro.acordeiAs);
  return {
    id: `dia:${registro.data}`,
    data: registro.data,
    relato: null,
    horasSono: dormi && acordei ? duracaoSono(dormi, acordei) : null,
    mlAgua: registro.mlAgua,
    humor: null,
    createdAt: registro.createdAt || inicioDoDiaLocal(registro.data).toISOString(),
    enviado: registro.enviado,
  };
}

function doMomento(momento: Momento): RegistroCombinado {
  return {
    id: momento.id,
    data: toLocalDateString(new Date(momento.registradoEm)),
    relato: momento.relato,
    horasSono: null,
    mlAgua: null,
    humor: momento.humor,
    createdAt: momento.registradoEm,
    enviado: momento.enviado,
  };
}

export async function listarRegistrosCombinados(de: string, ate: string): Promise<RegistroCombinado[]> {
  const [dias, momentos] = await Promise.all([
    dailyRecordRepository.listBetween(de, ate),
    momentRepository.listBetween(de, ate),
  ]);

  const diasComValor = dias.map(doDia).filter((d) => d.horasSono !== null || d.mlAgua !== null);

  return [...diasComValor, ...momentos.map(doMomento)].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}
