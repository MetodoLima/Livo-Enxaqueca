import { useState, useCallback } from 'react';
import { dailyRecordRepository, type HumorId } from '@/repositories';

export type { HumorId };

export interface RegistroEvento {
  id?: string;
  data: string;
  relato: string | null;
  horasSono: number | null;
  mlAgua: number | null;
  humor: HumorId | null;
}

export function useDailyRecord(data: string) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [naFila, setNaFila] = useState(false);

  const salvar = useCallback(async (patch: Omit<RegistroEvento, 'id' | 'data'>): Promise<boolean> => {
    setSaving(true);
    setSaved(false);
    setNaFila(false);
    try {
      const { enviado } = await dailyRecordRepository.save({
        data,
        relato: patch.relato,
        horasSono: patch.horasSono,
        mlAgua: patch.mlAgua,
        humor: patch.humor,
      });

      setNaFila(!enviado);
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
