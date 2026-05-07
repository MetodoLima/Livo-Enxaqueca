import { MigraineRecord } from '@/services/api';

// ── Location options ──────────────────────────────────────────────────
export const LOCATIONS = [
  { id: 'frontal', label: 'Frontal', emoji: '🤯' },
  { id: 'temporal', label: 'Temporal', emoji: '😵' },
  { id: 'occipital', label: 'Nuca', emoji: '😣' },
  { id: 'atras_olhos', label: 'Atrás dos olhos', emoji: '👁️' },
  { id: 'difusa', label: 'Difusa', emoji: '😶‍🌫️' },
] as const;

export type LocationId = (typeof LOCATIONS)[number]['id'];

export const SIDES = [
  { id: 'esquerdo', label: 'Esquerdo' },
  { id: 'direito', label: 'Direito' },
  { id: 'bilateral', label: 'Ambos os lados' },
] as const;

export type SideId = (typeof SIDES)[number]['id'];

// ── Symptom options ───────────────────────────────────────────────────
export const SYMPTOMS = [
  { id: 'nausea', label: 'Náusea', emoji: '🤢' },
  { id: 'fotofobia', label: 'Luz incomoda', emoji: '💡' },
  { id: 'fonofobia', label: 'Som incomoda', emoji: '🔊' },
  { id: 'tontura', label: 'Tontura', emoji: '💫' },
  { id: 'aura', label: 'Aura visual', emoji: '✨' },
  { id: 'vomito', label: 'Vômito', emoji: '🤮' },
] as const;

export type SymptomId = (typeof SYMPTOMS)[number]['id'];

// ── Intensity labels ──────────────────────────────────────────────────
export const INTENSITY_CONFIG = [
  { value: 0, label: 'Sem dor', emoji: '😌', color: '#10B981' },
  { value: 1, label: 'Dói um pouco', emoji: '🙂', color: '#34D399' },
  { value: 2, label: '', emoji: '🙂', color: '#6EE7B7' },
  { value: 3, label: 'Ligeira', emoji: '😐', color: '#A3E635' },
  { value: 4, label: '', emoji: '😐', color: '#FACC15' },
  { value: 5, label: 'Moderada', emoji: '😟', color: '#F59E0B' },
  { value: 6, label: '', emoji: '😟', color: '#F97316' },
  { value: 7, label: 'Severa', emoji: '😣', color: '#EF4444' },
  { value: 8, label: '', emoji: '😣', color: '#DC2626' },
  { value: 9, label: 'Dói ainda mais', emoji: '😫', color: '#B91C1C' },
  { value: 10, label: 'Insuportável', emoji: '🤯', color: '#991B1B' },
] as const;

// ── Quick time presets ────────────────────────────────────────────────
export type TimePreset = 'now' | '1h_ago' | 'custom';
export type EndTimePreset = 'ongoing' | 'now' | 'custom';

// ── AI Complement ─────────────────────────────────────────────────────
export interface AiComplement {
  audioUri: string | null;
  textNote: string | null;
  aiResult: MigraineRecord | null;
}

// ── Full crisis record ────────────────────────────────────────────────
export interface CrisisRecord {
  startTime: Date;
  endTime: Date | null; // null = still ongoing
  intensity: number | null;
  location: LocationId | null;
  side: SideId | null;
  symptoms: SymptomId[];
  aiComplement: AiComplement | null;
}

export function createEmptyCrisis(): CrisisRecord {
  return {
    startTime: new Date(),
    endTime: null,
    intensity: null,
    location: null,
    side: null,
    symptoms: [],
    aiComplement: null,
  };
}

export const TOTAL_STEPS = 5;
