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

// ── Medication options ────────────────────────────────────────────────
export const MEDICATIONS = [
  { id: 'sumatriptano', label: 'Sumatriptano', emoji: '🧬' },
  { id: 'dipirona', label: 'Dipirona', emoji: '💧' },
  { id: 'paracetamol', label: 'Paracetamol', emoji: '💊' },
  { id: 'ibuprofeno', label: 'Ibuprofeno', emoji: '🔴' },
  { id: 'naproxeno', label: 'Naproxeno', emoji: '🟠' },
  { id: 'nimesulida', label: 'Nimesulida', emoji: '🟡' },
  { id: 'nenhum', label: 'Nenhum', emoji: '✋' },
] as const;

export type MedicationId = (typeof MEDICATIONS)[number]['id'];

// ── Intensity labels ──────────────────────────────────────────────────
export const INTENSITY_CONFIG = [
  { value: 0,  label: 'Sem dor',        sublabel: 'Nenhuma dor',              emoji: '😌', color: '#10B981' },
  { value: 1,  label: 'Dói um pouco',   sublabel: 'Quase imperceptível',      emoji: '🙂', color: '#34D399' },
  { value: 2,  label: 'Leve',           sublabel: 'Consigo ignorar',          emoji: '🙂', color: '#6EE7B7' },
  { value: 3,  label: 'Ligeira',        sublabel: 'Presente mas tolerável',   emoji: '😐', color: '#A3E635' },
  { value: 4,  label: 'Incômoda',       sublabel: 'Dificulta concentração',   emoji: '😐', color: '#FACC15' },
  { value: 5,  label: 'Moderada',       sublabel: 'Atrapalha as atividades',  emoji: '😟', color: '#F59E0B' },
  { value: 6,  label: 'Forte',          sublabel: 'Difícil de ignorar',       emoji: '😟', color: '#F97316' },
  { value: 7,  label: 'Severa',         sublabel: 'Preciso parar o que faço', emoji: '😣', color: '#EF4444' },
  { value: 8,  label: 'Muito intensa',  sublabel: 'Quase incapacitante',      emoji: '😣', color: '#DC2626' },
  { value: 9,  label: 'Excruciante',    sublabel: 'Impossível funcionar',     emoji: '😫', color: '#B91C1C' },
  { value: 10, label: 'Insuportável',   sublabel: 'A pior dor possível',      emoji: '🤯', color: '#991B1B' },
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
  endTime: Date | null;
  intensity: number | null;
  location: LocationId | null;
  side: SideId | null;
  symptoms: SymptomId[];
  medications: MedicationId[];
  customMedications: string[];
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
    medications: [],
    customMedications: [],
    aiComplement: null,
  };
}

export const TOTAL_STEPS = 6;