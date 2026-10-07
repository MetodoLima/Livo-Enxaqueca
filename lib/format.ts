import { Colors } from '@/constants/Colors';
import { INTENSITY_CONFIG } from '@/types/crisis';

export function toLocalDateString(date: Date): string {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(start: Date, end: Date | null): string {
  if (!end) return 'Em andamento';
  const diffMs = end.getTime() - start.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

export type Elapsed = { value: number; unit: string };

export function elapsedSince(date: Date, now: Date = new Date()): Elapsed {
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (mins < 60) return { value: mins, unit: mins === 1 ? 'minuto' : 'minutos' };
  if (hours < 24) return { value: hours, unit: hours === 1 ? 'hora' : 'horas' };
  return { value: days, unit: days === 1 ? 'dia' : 'dias' };
}

export function formatSleep(hours: number): string {
  return `${(Math.round(hours * 10) / 10).toString().replace('.', ',')} h`;
}

export type Horario = { hora: number; minuto: number };

export function formatHorario({ hora, minuto }: Horario): string {
  return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
}

export function duracaoSono(dormir: Horario, acordar: Horario): number {
  let minutos = acordar.hora * 60 + acordar.minuto - (dormir.hora * 60 + dormir.minuto);
  if (minutos < 0) minutos += 24 * 60;
  return Math.round(minutos / 6) / 10;
}

export function formatWater(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(1).replace('.0', '')}L`;
  return `${ml}ml`;
}

export function intensityColor(intensity: number | null): string {
  if (intensity === null) return Colors.muted;
  return INTENSITY_CONFIG.find((c) => c.value === intensity)?.color ?? Colors.muted;
}

export function intensityLabel(intensity: number | null): string {
  if (intensity === null) return 'Não registrada';
  return INTENSITY_CONFIG.find((c) => c.value === intensity)?.label ?? `${intensity}/10`;
}

export function intensityEmoji(intensity: number | null): string {
  if (intensity === null) return '❓';
  return INTENSITY_CONFIG.find((c) => c.value === intensity)?.emoji ?? '😐';
}

const MOOD_LABEL: Record<string, string> = {
  terrible: 'Péssimo',
  bad: 'Ruim',
  'so-so': 'Regular',
  okay: 'Bem',
  great: 'Ótimo',
};

const MOOD_EMOJI: Record<string, string> = {
  terrible: '😣',
  bad: '😕',
  'so-so': '😐',
  okay: '🙂',
  great: '😄',
};

export function moodLabel(mood: string): string {
  return MOOD_LABEL[mood] ?? mood;
}

export function moodEmoji(mood: string): string {
  return MOOD_EMOJI[mood] ?? '';
}
