import { useState, useCallback } from 'react';
import { formatHorario, type Horario } from '@/lib/format';
import { dailyRecordRepository, momentRepository, type HumorId, type SaveOutcome } from '@/repositories';

export type { HumorId };

export interface RegistroEvento {
  relato: string | null;
  humor: HumorId | null;
  dormiAs: Horario | null;
  acordeiAs: Horario | null;
  mlAgua: number | null;
}

export function useDailyRecord(data: string) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [naFila, setNaFila] = useState(false);

  const salvar = useCallback(async (registro: RegistroEvento): Promise<boolean> => {
    setSaving(true);
    setSaved(false);
    setNaFila(false);
    try {
      const resultados: SaveOutcome[] = [];

      if (registro.humor !== null || registro.relato?.trim()) {
        resultados.push(await momentRepository.registrar({ humor: registro.humor, relato: registro.relato }));
      }

      const temSono = registro.dormiAs !== null && registro.acordeiAs !== null;
      if (temSono || registro.mlAgua !== null) {
        resultados.push(
          await dailyRecordRepository.salvarDia(data, {
            ...(temSono
              ? { sono: { dormiAs: formatHorario(registro.dormiAs!), acordeiAs: formatHorario(registro.acordeiAs!) } }
              : {}),
            ...(registro.mlAgua !== null ? { mlAgua: registro.mlAgua } : {}),
          }),
        );
      }

      setNaFila(resultados.some((r) => !r.enviado));
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setNaFila(false);
      }, 3000);
      return true;
    } catch (err) {
      console.error('Erro ao salvar registro:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [data]);

  return { saving, saved, naFila, salvar };
}
