import { useState, useCallback } from 'react';
import { momentRepository, type HumorId } from '@/repositories';

export type { HumorId };

export interface NovoMomentoDaTela {
  humor: HumorId | null;
  relato: string | null;
}

export function useDailyRecord() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [naFila, setNaFila] = useState(false);

  const salvar = useCallback(async (momento: NovoMomentoDaTela): Promise<boolean> => {
    setSaving(true);
    setSaved(false);
    setNaFila(false);
    try {
      const { enviado } = await momentRepository.registrar(momento);
      setNaFila(!enviado);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setNaFila(false);
      }, 3000);
      return true;
    } catch (err) {
      console.error('Erro ao salvar momento:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { saving, saved, naFila, salvar };
}
