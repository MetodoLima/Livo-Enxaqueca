import { MigraineRecord, MigraineStructured, SintomasAssociados } from '@/services/api';

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

export const TOTAL_STEPS = 5;

export function mergeAiResultIntoCrisis(
  current: CrisisRecord,
  structured: MigraineStructured,
): Partial<CrisisRecord> {
  const patch: Partial<CrisisRecord> = {};

  if (structured.intensidade_dor !== null) {
    patch.intensity = structured.intensidade_dor;
  }

  // Só sobrescreve localização se a IA retornou algo (preserva 'atras_olhos' se a IA não mudou)
  if (structured.localizacao !== null) {
    patch.location = structured.localizacao as LocationId;
  }

  if (structured.lado !== null) {
    patch.side = structured.lado as SideId;
  }

  // União: mantém sintomas do questionário + adiciona os que a IA detectou no áudio
  const s = structured.sintomas_associados;
  const aiSymptoms: SymptomId[] = [];
  if (s.nausea)    aiSymptoms.push('nausea');
  if (s.vomito)    aiSymptoms.push('vomito');
  if (s.fotofobia) aiSymptoms.push('fotofobia');
  if (s.fonofobia) aiSymptoms.push('fonofobia');
  if (s.aura)      aiSymptoms.push('aura');
  if (s.tontura)   aiSymptoms.push('tontura');
  patch.symptoms = Array.from(new Set([...current.symptoms, ...aiSymptoms]));

  return patch;
}

export function crisisToMigraineStructured(crisis: CrisisRecord): MigraineStructured {
  const sintomas: SintomasAssociados = {
    nausea: crisis.symptoms.includes('nausea'),
    vomito: crisis.symptoms.includes('vomito'),
    fotofobia: crisis.symptoms.includes('fotofobia'),
    fonofobia: crisis.symptoms.includes('fonofobia'),
    aura: crisis.symptoms.includes('aura'),
    tontura: crisis.symptoms.includes('tontura'),
    outros: [],
  };

  // 'atras_olhos' não existe no schema do backend — mapeamos para null
  const localizacao =
    crisis.location === 'atras_olhos' || crisis.location === null
      ? null
      : (crisis.location as MigraineStructured['localizacao']);

  let nivel_incapacidade: MigraineStructured['nivel_incapacidade'] = null;
  if (crisis.intensity !== null) {
    if (crisis.intensity <= 3) nivel_incapacidade = 'leve';
    else if (crisis.intensity <= 6) nivel_incapacidade = 'moderado';
    else nivel_incapacidade = 'severo';
  }

  return {
    intensidade_dor: crisis.intensity,
    localizacao,
    lado: crisis.side ?? null,
    qualidade_dor: [],
    sintomas_associados: sintomas,
    inicio_estimado: null,
    medicamentos_tomados: [],
    fatores_desencadeantes: [],
    nivel_incapacidade,
    resumo: null,
  };
}
