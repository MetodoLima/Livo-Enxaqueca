import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { dailyRecordRepository, type DailyRecord } from '@/repositories';
import { useSync } from '@/contexts/SyncContext';

// A tela importa este nome. O formato e o do repositorio, sem nada derivado por cima.
export type RegistroCalendarDay = DailyRecord;

export function useRegistroCalendar(year: number, month: number) {
  const { ultimaAtualizacao } = useSync();
  const [registroByDay, setRegistroByDay] = useState<Record<number, RegistroCalendarDay[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistros = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month + 1, 0).getDate();
      const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const registros = await dailyRecordRepository.listBetween(from, to);

      const map: Record<number, RegistroCalendarDay[]> = {};
      for (const registro of registros) {
        const day = parseInt(registro.data.split('-')[2], 10);
        if (!map[day]) map[day] = [];
        map[day].push(registro);
      }
      setRegistroByDay(map);
    } catch (e: any) {
      setError(e.message ?? 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [year, month, ultimaAtualizacao]);

  useFocusEffect(
    useCallback(() => {
      fetchRegistros();
    }, [fetchRegistros])
  );

  return { registroByDay, loading, error, refetch: fetchRegistros };
}