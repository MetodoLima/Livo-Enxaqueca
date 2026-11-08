import type { ReactNode, RefObject } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import IntensityScale from '@/features/crisis/components/IntensityScale';
import LocationPicker from '@/features/crisis/components/LocationPicker';
import MedicationPicker from '@/features/crisis/components/MedicationPicker';
import SymptomPicker from '@/features/crisis/components/SymptomPicker';
import type { CrisisRecord, LocationId, MedicationId, SideId, SymptomId } from '@/types/crisis';

const ALTURA_DA_ESCALA = 11 * 48;
const FRACAO_DA_TELA = 0.55;

interface EditorBaseProps {
  visible: boolean;
  onClose: () => void;
  returnFocusTo?: RefObject<View | null>;
}

interface EditSheetProps extends EditorBaseProps {
  title: string;
  confirmLabel: string;
  children: ReactNode;
}

function EditSheet({ visible, onClose, returnFocusTo, title, confirmLabel, children }: EditSheetProps) {
  return (
    <Dialog
      visible={visible}
      title={title}
      onClose={onClose}
      returnFocusTo={returnFocusTo}
      posicao="base"
      botaoFechar
      footer={<Button title="Confirmar" accessibilityLabel={confirmLabel} onPress={onClose} />}
    >
      {children}
    </Dialog>
  );
}

interface IntensityEditorProps extends EditorBaseProps {
  value: number | null;
  onChange: (value: number) => void;
}

export function IntensityEditor({ value, onChange, ...base }: IntensityEditorProps) {
  const { height } = useWindowDimensions();
  const altura = Math.min(ALTURA_DA_ESCALA, height * FRACAO_DA_TELA);

  return (
    <EditSheet {...base} title="Intensidade da dor" confirmLabel="Confirmar intensidade">
      <IntensityScale value={value} onChange={onChange} style={{ height: altura }} />
    </EditSheet>
  );
}

interface LocationEditorProps extends EditorBaseProps {
  location: LocationId | null;
  side: SideId | null;
  onChange: (patch: Partial<CrisisRecord>) => void;
}

export function LocationEditor({ location, side, onChange, ...base }: LocationEditorProps) {
  return (
    <EditSheet {...base} title="Localização da dor" confirmLabel="Confirmar localização">
      <LocationPicker location={location} side={side} onChange={onChange} />
    </EditSheet>
  );
}

interface SymptomsEditorProps extends EditorBaseProps {
  symptoms: SymptomId[];
  onChange: (symptoms: SymptomId[]) => void;
}

export function SymptomsEditor({ symptoms, onChange, ...base }: SymptomsEditorProps) {
  return (
    <EditSheet {...base} title="Sintomas associados" confirmLabel="Confirmar sintomas">
      <SymptomPicker symptoms={symptoms} onChange={onChange} />
    </EditSheet>
  );
}

interface MedicationsEditorProps extends EditorBaseProps {
  medications: MedicationId[];
  customMedications: string[];
  onChange: (patch: Partial<CrisisRecord>) => void;
}

export function MedicationsEditor({ medications, customMedications, onChange, ...base }: MedicationsEditorProps) {
  return (
    <EditSheet {...base} title="Medicamentos" confirmLabel="Confirmar medicamentos">
      <MedicationPicker medications={medications} customMedications={customMedications} onChange={onChange} />
    </EditSheet>
  );
}
