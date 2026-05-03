import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import {
  INTENSITY_CONFIG,
  LOCATIONS,
  SIDES,
  SYMPTOMS,
  type CrisisRecord,
  type LocationId,
  type SideId,
  type SymptomId,
} from '@/types/crisis';

interface EditModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function EditModal({ visible, onClose, title, children }: EditModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={ms.overlay}>
        <View style={ms.sheet}>
          <View style={ms.header}>
            <Text style={ms.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X size={22} color={Colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const ms = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0D2137',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: '#1E3A52',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 18, fontFamily: 'Epilogue_700Bold', color: 'white' },
});

// ── Intensity Editor ──────────────────────────────────────────────────
export function IntensityEditor({
  visible, onClose, value, onChange,
}: {
  visible: boolean; onClose: () => void;
  value: number | null; onChange: (v: number) => void;
}) {
  return (
    <EditModal visible={visible} onClose={onClose} title="Intensidade da dor">
      {[...INTENSITY_CONFIG].reverse().map((item) => {
        const active = value === item.value;
        return (
          <TouchableOpacity
            key={item.value}
            onPress={() => { onChange(item.value); onClose(); }}
            style={[es.row, active && { backgroundColor: `${item.color}18` }]}
          >
            <View style={[es.bar, { backgroundColor: item.color }]} />
            <Text style={[es.num, active && { color: item.color }]}>{item.value}</Text>
            <Text style={es.emoji}>{item.emoji}</Text>
            {item.label ? <Text style={[es.label, active && { color: 'white' }]}>{item.label.toUpperCase()}</Text> : null}
          </TouchableOpacity>
        );
      })}
    </EditModal>
  );
}

// ── Location Editor ───────────────────────────────────────────────────
export function LocationEditor({
  visible, onClose, location, side, onChange,
}: {
  visible: boolean; onClose: () => void;
  location: LocationId | null; side: SideId | null;
  onChange: (patch: Partial<CrisisRecord>) => void;
}) {
  return (
    <EditModal visible={visible} onClose={onClose} title="Localização da dor">
      <View style={es.grid}>
        {LOCATIONS.map((loc) => {
          const active = location === loc.id;
          return (
            <TouchableOpacity
              key={loc.id}
              onPress={() => onChange({ location: active ? null : loc.id })}
              style={[es.gridItem, active && es.gridItemActive]}
            >
              <Text style={{ fontSize: 24 }}>{loc.emoji}</Text>
              <Text style={[es.gridLabel, active && { color: Colors.accent }]}>{loc.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={[es.sectionTitle, { marginTop: 20 }]}>Qual lado?</Text>
      <View style={es.sideRow}>
        {SIDES.map((s) => {
          const active = side === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              onPress={() => { onChange({ side: active ? null : s.id }); }}
              style={[es.sideBtn, active && es.sideBtnActive]}
            >
              <Text style={[es.sideLabel, active && { color: Colors.accent }]}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity onPress={onClose} style={es.doneBtn}>
        <Text style={es.doneBtnText}>Confirmar</Text>
      </TouchableOpacity>
    </EditModal>
  );
}

// ── Symptoms Editor ───────────────────────────────────────────────────
export function SymptomsEditor({
  visible, onClose, symptoms, onChange,
}: {
  visible: boolean; onClose: () => void;
  symptoms: SymptomId[];
  onChange: (symptoms: SymptomId[]) => void;
}) {
  const toggle = (id: SymptomId) => {
    onChange(symptoms.includes(id) ? symptoms.filter((s) => s !== id) : [...symptoms, id]);
  };
  return (
    <EditModal visible={visible} onClose={onClose} title="Sintomas associados">
      <View style={es.grid}>
        {SYMPTOMS.map((sym) => {
          const active = symptoms.includes(sym.id);
          return (
            <TouchableOpacity
              key={sym.id}
              onPress={() => toggle(sym.id)}
              style={[es.gridItem, active && es.gridItemActivePurple]}
            >
              <Text style={{ fontSize: 24 }}>{sym.emoji}</Text>
              <Text style={[es.gridLabel, active && { color: Colors.purple }]}>{sym.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity onPress={onClose} style={es.doneBtn}>
        <Text style={es.doneBtnText}>Confirmar</Text>
      </TouchableOpacity>
    </EditModal>
  );
}

const es = StyleSheet.create({
  // Intensity rows
  row: { flexDirection: 'row', alignItems: 'center', height: 42, borderRadius: 8 },
  bar: { width: 6, height: '100%', borderRadius: 3 },
  num: { width: 36, textAlign: 'center', fontSize: 16, fontFamily: 'Epilogue_700Bold', color: Colors.muted },
  emoji: { fontSize: 24, marginRight: 12 },
  label: { fontSize: 11, fontFamily: 'Epilogue_700Bold', color: Colors.muted, letterSpacing: 1, flex: 1 },
  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  gridItem: {
    width: '30%', aspectRatio: 1.1, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1.5, borderColor: '#1E3A52',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  gridItemActive: { backgroundColor: `${Colors.accent}15`, borderColor: Colors.accent },
  gridItemActivePurple: { backgroundColor: `${Colors.purple}15`, borderColor: Colors.purple },
  gridLabel: { fontSize: 11, fontFamily: 'Epilogue_600SemiBold', color: Colors.muted, textAlign: 'center' },
  // Side
  sectionTitle: { fontSize: 15, fontFamily: 'Epilogue_600SemiBold', color: 'white', marginBottom: 10, textAlign: 'center' },
  sideRow: { flexDirection: 'row', gap: 10 },
  sideBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#112236', borderWidth: 1.5, borderColor: '#1E3A52', alignItems: 'center',
  },
  sideBtnActive: { backgroundColor: `${Colors.accent}15`, borderColor: Colors.accent },
  sideLabel: { fontSize: 14, fontFamily: 'Epilogue_600SemiBold', color: Colors.muted },
  // Done
  doneBtn: {
    marginTop: 24, backgroundColor: Colors.accent,
    paddingVertical: 16, borderRadius: 14, alignItems: 'center',
  },
  doneBtnText: { fontSize: 16, fontFamily: 'Epilogue_700Bold', color: 'white' },
});
