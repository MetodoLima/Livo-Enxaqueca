import { useState, useCallback } from 'react';
import { dailyRecordRepository, type HumorId } from '@/repositories';

// O tipo nasceu aqui e varios arquivos ainda o importam deste caminho.
export type { HumorId };

export interface RegistroEvento {
  /** Uuid gerado no aparelho desde a #44. Era bigint do banco antes disso. */
  id?: string;
  data: string;
  relato: string | null;
  horasSono: number | null;
  mlAgua: number | null;
  humor: HumorId | null;
}

export function useRegistroEvento(data: string) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // Gravou no aparelho mas ainda nao subiu. A tela mostra isso em vez de so "Registrado!",
  // para nao afirmar que o dado esta no servidor quando nao esta. Issue #50.
  const [naFila, setNaFila] = useState(false);

  const salvar = useCallback(async (patch: Omit<RegistroEvento, 'id' | 'data'>) => {
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
    } catch (err) {
      console.error('Erro ao salvar registro:', err);
    } finally {
      setSaving(false);
    }
  }, [data]);

  return { saving, saved, naFila, salvar };
}
