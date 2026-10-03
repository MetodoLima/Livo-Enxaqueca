import Card from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { tagStyles } from '@/features/crisis/components/tagStyles';
import {
  INTENSITY_CONFIG,
  LOCATIONS,
  MEDICATIONS,
  SIDES,
  SYMPTOMS,
  type CrisisRecord,
} from '@/types/crisis';
import { ChevronDown, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PastPhaseCard({
  phase,
  index,
  onDelete,
}: {
  phase: CrisisRecord;
  index: number;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const confirmDelete = useCallback(() => {
    Alert.alert(
      'Remover fase?',
      `A Fase ${index + 1} será removida do registro.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: onDelete },
      ],
    );
  }, [index, onDelete]);

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const intensityConfig = phase.intensity !== null ? INTENSITY_CONFIG[phase.intensity] : null;
  const locationData = LOCATIONS.find((l) => l.id === phase.location);
  const sideData = SIDES.find((s) => s.id === phase.side);
  const symptomNames = phase.symptoms
    .map((id) => SYMPTOMS.find((s) => s.id === id))
    .filter(Boolean);
  const medicationNames = phase.medications
    .map((id) => MEDICATIONS.find((m) => m.id === id))
    .filter(Boolean);

  const timeRange = `${fmtTime(phase.startTime)} – ${
    phase.endTime ? fmtTime(phase.endTime) : 'Em andamento'
  }`;

  const collapsedDetail = [
    locationData ? `${locationData.emoji} ${locationData.label}` : null,
    sideData?.label,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card className="mb-3">
      <TouchableOpacity
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <View style={{ flex: 1 }}>
          <Text style={phaseStyles.label}>Fase {index + 1}</Text>
          <Text style={phaseStyles.timeRange}>{timeRange}</Text>
          {collapsedDetail ? (
            <Text style={phaseStyles.collapsedDetail}>{collapsedDetail}</Text>
          ) : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 12 }}>
          {intensityConfig && (
            <Text style={[phaseStyles.intensityBadge, { color: intensityConfig.color }]}>
              {phase.intensity}/10
            </Text>
          )}
          <ChevronDown
            size={18}
            color={Colors.muted}
            style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={phaseStyles.body}>
          {intensityConfig && (
            <View style={phaseStyles.row}>
              <Text style={phaseStyles.rowLabel}>Intensidade</Text>
              <Text style={[phaseStyles.rowValue, { color: intensityConfig.color }]}>
                {phase.intensity}/10 · {intensityConfig.label}
              </Text>
            </View>
          )}
          {(locationData || sideData) && (
            <View style={{ flexDirection: 'row', gap: 32, marginBottom: 10 }}>
              {locationData && (
                <View>
                  <Text style={phaseStyles.rowLabel}>Localização</Text>
                  <Text style={phaseStyles.rowValue}>
                    {locationData.emoji} {locationData.label}
                  </Text>
                </View>
              )}
              {sideData && (
                <View>
                  <Text style={phaseStyles.rowLabel}>Lado</Text>
                  <Text style={phaseStyles.rowValue}>{sideData.label}</Text>
                </View>
              )}
            </View>
          )}
          {symptomNames.length > 0 && (
            <View style={{ marginBottom: 10 }}>
              <Text style={[phaseStyles.rowLabel, { marginBottom: 6 }]}>Sintomas</Text>
              <View style={tagStyles.tagRow}>
                {symptomNames.map(
                  (s) =>
                    s && (
                      <View key={s.id} style={tagStyles.tag}>
                        <Text style={tagStyles.tagEmoji}>{s.emoji}</Text>
                        <Text style={tagStyles.tagText}>{s.label}</Text>
                      </View>
                    ),
                )}
              </View>
            </View>
          )}
          {(medicationNames.length > 0 || phase.customMedications.length > 0) && (
            <View style={{ marginBottom: 14 }}>
              <Text style={[phaseStyles.rowLabel, { marginBottom: 6 }]}>Medicamentos</Text>
              <View style={tagStyles.tagRow}>
                {medicationNames.map(
                  (m) =>
                    m && (
                      <View key={m.id} style={[tagStyles.tag, { backgroundColor: `${Colors.accent}15` }]}>
                        <Text style={tagStyles.tagEmoji}>{m.emoji}</Text>
                        <Text style={[tagStyles.tagText, { color: Colors.accent }]}>{m.label}</Text>
                      </View>
                    ),
                )}
                {phase.customMedications.map((name) => (
                  <View key={name} style={[tagStyles.tag, { backgroundColor: `${Colors.accent}15` }]}>
                    <Text style={tagStyles.tagEmoji}>💊</Text>
                    <Text style={[tagStyles.tagText, { color: Colors.accent }]}>{name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity onPress={confirmDelete} style={phaseStyles.deleteBtn}>
            <Trash2 size={14} color="#EF4444" />
            <Text style={phaseStyles.deleteBtnText}>Remover esta fase</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}

const phaseStyles = StyleSheet.create({
  label: {
    fontSize: 10,
    fontFamily: 'Epilogue_700Bold',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  timeRange: {
    fontSize: 15,
    fontFamily: 'Epilogue_600SemiBold',
    color: 'white',
  },
  collapsedDetail: {
    fontSize: 12,
    fontFamily: 'Epilogue_400Regular',
    color: Colors.muted,
    marginTop: 3,
  },
  intensityBadge: {
    fontSize: 13,
    fontFamily: 'Epilogue_700Bold',
  },
  body: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 14,
  },
  row: {
    marginBottom: 10,
  },
  rowLabel: {
    fontSize: 10,
    fontFamily: 'Epilogue_700Bold',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  rowValue: {
    fontSize: 14,
    fontFamily: 'Epilogue_600SemiBold',
    color: 'white',
    marginTop: 2,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  deleteBtnText: {
    fontSize: 12,
    fontFamily: 'Epilogue_600SemiBold',
    color: '#EF4444',
  },
});
