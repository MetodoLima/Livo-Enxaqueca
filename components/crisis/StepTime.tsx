import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { Clock, ChevronUp, ChevronDown, Calendar } from 'lucide-react-native';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import StepFooter from './StepFooter';
import type { CrisisRecord, TimePreset, EndTimePreset } from '@/types/crisis';

interface StepTimeProps {
  data: CrisisRecord;
  onChange: (patch: Partial<CrisisRecord>) => void;
  onNext: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function subtractHours(date: Date, hours: number): Date {
  const d = new Date(date);
  d.setHours(d.getHours() - hours);
  return d;
}

// ── Inline Time Picker ────────────────────────────────────────────────
function TimePicker({
  value,
  onConfirm,
  onCancel,
}: {
  value: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}) {
  const [hour, setHour] = useState(value.getHours());
  const [minute, setMinute] = useState(value.getMinutes());

  const nudge = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    current: number,
    max: number,
    dir: 1 | -1,
  ) => {
    setter((current + dir + max) % max);
  };

  const handleConfirm = () => {
    const d = new Date(value);
    d.setHours(hour, minute, 0, 0);
    onConfirm(d);
  };

  return (
    <View style={pickerStyles.container}>
      <Text style={pickerStyles.title}>Selecionar horário</Text>

      <View style={pickerStyles.row}>
        {/* Hour */}
        <View style={pickerStyles.column}>
          <TouchableOpacity
            onPress={() => nudge(setHour, hour, 24, 1)}
            style={pickerStyles.arrowBtn}
          >
            <ChevronUp size={28} color={Colors.muted} />
          </TouchableOpacity>
          <View style={pickerStyles.valueBox}>
            <Text style={pickerStyles.valueText}>
              {String(hour).padStart(2, '0')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => nudge(setHour, hour, 24, -1)}
            style={pickerStyles.arrowBtn}
          >
            <ChevronDown size={28} color={Colors.muted} />
          </TouchableOpacity>
          <Text style={pickerStyles.label}>Hora</Text>
        </View>

        <Text style={pickerStyles.separator}>:</Text>

        {/* Minute */}
        <View style={pickerStyles.column}>
          <TouchableOpacity
            onPress={() => nudge(setMinute, minute, 60, 1)}
            style={pickerStyles.arrowBtn}
          >
            <ChevronUp size={28} color={Colors.muted} />
          </TouchableOpacity>
          <View style={pickerStyles.valueBox}>
            <Text style={pickerStyles.valueText}>
              {String(minute).padStart(2, '0')}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => nudge(setMinute, minute, 60, -1)}
            style={pickerStyles.arrowBtn}
          >
            <ChevronDown size={28} color={Colors.muted} />
          </TouchableOpacity>
          <Text style={pickerStyles.label}>Minuto</Text>
        </View>
      </View>

      <View style={pickerStyles.actions}>
        <TouchableOpacity onPress={onCancel} style={pickerStyles.cancelBtn}>
          <Text style={pickerStyles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleConfirm} style={pickerStyles.confirmBtn}>
          <Text style={pickerStyles.confirmText}>Confirmar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Inline Date Picker ────────────────────────────────────────────────
function DatePicker({
  value,
  onConfirm,
  onCancel,
}: {
  value: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}) {
  const [day, setDay] = React.useState(value.getDate());
  const [month, setMonth] = React.useState(value.getMonth()); // 0-indexed
  const [year, setYear] = React.useState(value.getFullYear());

  const MONTHS = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const nudgeDay = (dir: 1 | -1) => {
    setDay((d) => {
      const next = d + dir;
      if (next < 1) return daysInMonth;
      if (next > daysInMonth) return 1;
      return next;
    });
  };

  const nudgeMonth = (dir: 1 | -1) => {
    setMonth((m) => (m + dir + 12) % 12);
  };

  const nudgeYear = (dir: 1 | -1) => {
    setYear((y) => y + dir);
  };

  const handleConfirm = () => {
    const d = new Date(value);
    d.setFullYear(year, month, day);
    onConfirm(d);
  };

  return (
    <View style={pickerStyles.container}>
      <Text style={pickerStyles.title}>Selecionar data</Text>

      <View style={pickerStyles.row}>
        {/* Day */}
        <View style={pickerStyles.column}>
          <TouchableOpacity onPress={() => nudgeDay(1)} style={pickerStyles.arrowBtn}>
            <ChevronUp size={28} color={Colors.muted} />
          </TouchableOpacity>
          <View style={pickerStyles.valueBox}>
            <Text style={pickerStyles.valueText}>
              {String(day).padStart(2, '0')}
            </Text>
          </View>
          <TouchableOpacity onPress={() => nudgeDay(-1)} style={pickerStyles.arrowBtn}>
            <ChevronDown size={28} color={Colors.muted} />
          </TouchableOpacity>
          <Text style={pickerStyles.label}>Dia</Text>
        </View>

        <Text style={pickerStyles.separator}>/</Text>

        {/* Month */}
        <View style={pickerStyles.column}>
          <TouchableOpacity onPress={() => nudgeMonth(1)} style={pickerStyles.arrowBtn}>
            <ChevronUp size={28} color={Colors.muted} />
          </TouchableOpacity>
          <View style={[pickerStyles.valueBox, { width: 88 }]}>
            <Text style={[pickerStyles.valueText, { fontSize: 22 }]}>
              {MONTHS[month]}
            </Text>
          </View>
          <TouchableOpacity onPress={() => nudgeMonth(-1)} style={pickerStyles.arrowBtn}>
            <ChevronDown size={28} color={Colors.muted} />
          </TouchableOpacity>
          <Text style={pickerStyles.label}>Mês</Text>
        </View>

        <Text style={pickerStyles.separator}>/</Text>

        {/* Year */}
        <View style={pickerStyles.column}>
          <TouchableOpacity onPress={() => nudgeYear(1)} style={pickerStyles.arrowBtn}>
            <ChevronUp size={28} color={Colors.muted} />
          </TouchableOpacity>
          <View style={pickerStyles.valueBox}>
            <Text style={[pickerStyles.valueText, { fontSize: 24 }]}>
              {year}
            </Text>
          </View>
          <TouchableOpacity onPress={() => nudgeYear(-1)} style={pickerStyles.arrowBtn}>
            <ChevronDown size={28} color={Colors.muted} />
          </TouchableOpacity>
          <Text style={pickerStyles.label}>Ano</Text>
        </View>
      </View>

      <View style={pickerStyles.actions}>
        <TouchableOpacity onPress={onCancel} style={pickerStyles.cancelBtn}>
          <Text style={pickerStyles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleConfirm} style={pickerStyles.confirmBtn}>
          <Text style={pickerStyles.confirmText}>Confirmar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  container: {
    backgroundColor: '#0D2137',
    borderRadius: 24,
    padding: 28,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#1E3A52',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Epilogue_700Bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  column: {
    alignItems: 'center',
  },
  arrowBtn: {
    padding: 8,
  },
  valueBox: {
    width: 80,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#112236',
    borderWidth: 1.5,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 36,
    fontFamily: 'Epilogue_700Bold',
    color: 'white',
  },
  separator: {
    fontSize: 36,
    fontFamily: 'Epilogue_700Bold',
    color: Colors.muted,
    marginBottom: 28,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E3A52',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.muted,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 15,
    fontFamily: 'Epilogue_700Bold',
    color: 'white',
  },
});

// ── Main Step ─────────────────────────────────────────────────────────
type PickerTarget = 'start' | 'end' | null;
type PickerMode = 'time' | 'date';

export default function StepTime({ data, onChange, onNext }: StepTimeProps) {
  const [startPreset, setStartPreset] = useState<TimePreset>('now');
  const [endPreset, setEndPreset] = useState<EndTimePreset>('ongoing');
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [pickerMode, setPickerMode] = useState<PickerMode>('time');

  const handleStartPreset = (preset: TimePreset) => {
    setStartPreset(preset);
    if (preset === 'now') {
      onChange({ startTime: new Date() });
    } else if (preset === '1h_ago') {
      onChange({ startTime: subtractHours(new Date(), 1) });
    } else if (preset === 'custom') {
      setPickerMode('time');
      setPickerTarget('start');
    }
  };

  const handleEndPreset = (preset: EndTimePreset) => {
    setEndPreset(preset);
    if (preset === 'ongoing') {
      onChange({ endTime: null });
    } else if (preset === 'now') {
      onChange({ endTime: new Date() });
    } else if (preset === 'custom') {
      setPickerMode('time');
      setPickerTarget('end');
    }
  };

  const handlePickerConfirm = (date: Date) => {
    if (pickerTarget === 'start') {
      onChange({ startTime: date });
    } else if (pickerTarget === 'end') {
      onChange({ endTime: date });
    }
    setPickerTarget(null);
  };

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.duration(400)} style={styles.content}>
        <Text style={styles.title}>Horário da crise</Text>

        {/* ── Start time ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={18} color={Colors.accent} />
            <Text style={styles.sectionLabel}>Hora de início</Text>
          </View>

          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={styles.dateTimeCard}
              onPress={() => { setPickerMode('date'); setPickerTarget('start'); }}
              activeOpacity={0.7}
            >
              <View style={styles.dateTimeCardHeader}>
                <Calendar size={16} color={Colors.accent} />
                <Text style={styles.dateTimeCardLabel}>Data</Text>
              </View>
              <Text style={styles.dateTimeCardValue}>{formatDate(data.startTime)}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateTimeCard}
              onPress={() => { setPickerMode('time'); setPickerTarget('start'); }}
              activeOpacity={0.7}
            >
              <View style={styles.dateTimeCardHeader}>
                <Clock size={16} color={Colors.accent} />
                <Text style={styles.dateTimeCardLabel}>Hora</Text>
              </View>
              <Text style={styles.dateTimeCardValue}>{formatTime(data.startTime)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.presetRow}>
            {([
              { key: 'now' as TimePreset, label: 'Agora mesmo' },
              { key: '1h_ago' as TimePreset, label: 'Há 1 hora' },
            ]).map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => handleStartPreset(key)}
                style={[
                  styles.presetBtn,
                  startPreset === key && styles.presetBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.presetText,
                    startPreset === key && styles.presetTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── End time ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={18} color={Colors.orange} />
            <Text style={styles.sectionLabel}>Hora de fim</Text>
          </View>

          {data.endTime ? (
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[styles.dateTimeCard, styles.dateTimeCardOrange]}
                onPress={() => { setPickerMode('date'); setPickerTarget('end'); }}
                activeOpacity={0.7}
              >
                <View style={styles.dateTimeCardHeader}>
                  <Calendar size={16} color={Colors.orange} />
                  <Text style={[styles.dateTimeCardLabel, { color: Colors.orange }]}>Data</Text>
                </View>
                <Text style={styles.dateTimeCardValue}>{formatDate(data.endTime)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateTimeCard, styles.dateTimeCardOrange]}
                onPress={() => { setPickerMode('time'); setPickerTarget('end'); }}
                activeOpacity={0.7}
              >
                <View style={styles.dateTimeCardHeader}>
                  <Clock size={16} color={Colors.orange} />
                  <Text style={[styles.dateTimeCardLabel, { color: Colors.orange }]}>Hora</Text>
                </View>
                <Text style={styles.dateTimeCardValue}>{formatTime(data.endTime)}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.ongoingBadge}>
              <View style={styles.ongoingDot} />
              <Text style={styles.ongoingText}>Ainda em curso</Text>
            </View>
          )}

          <View style={styles.presetRow}>
            {([
              { key: 'ongoing' as EndTimePreset, label: 'Ainda em curso' },
              { key: 'now' as EndTimePreset, label: 'Agora mesmo' },
            ]).map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => handleEndPreset(key)}
                style={[
                  styles.presetBtn,
                  endPreset === key && styles.presetBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.presetText,
                    endPreset === key && styles.presetTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>

      <StepFooter onNext={onNext} />

      {/* ── Time picker modal ── */}
      <Modal
        visible={pickerTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerTarget(null)}
      >
        <View style={styles.modalOverlay}>
          {pickerMode === 'time' ? (
            <TimePicker
              value={
                pickerTarget === 'end' && data.endTime
                  ? data.endTime
                  : data.startTime
              }
              onConfirm={handlePickerConfirm}
              onCancel={() => setPickerTarget(null)}
            />
          ) : (
            <DatePicker
              value={
                pickerTarget === 'end' && data.endTime
                  ? data.endTime
                  : data.startTime
              }
              onConfirm={handlePickerConfirm}
              onCancel={() => setPickerTarget(null)}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Epilogue_700Bold',
    color: 'white',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Epilogue_400Regular',
    color: Colors.muted,
    marginBottom: 32,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(139,163,167,0.1)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timeDisplay: {
    marginBottom: 16,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateTimeCard: {
    flex: 1,
    backgroundColor: '#112236',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: `${Colors.accent}40`,
    padding: 14,
  },
  dateTimeCardOrange: {
    borderColor: `${Colors.orange}40`,
  },
  dateTimeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dateTimeCardLabel: {
    fontSize: 11,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  dateTimeCardValue: {
    fontSize: 20,
    fontFamily: 'Epilogue_700Bold',
    color: 'white',
  },
  timeDate: {
    fontSize: 13,
    fontFamily: 'Epilogue_400Regular',
    color: Colors.muted,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 28,
    fontFamily: 'Epilogue_700Bold',
    color: 'white',
  },
  ongoingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  ongoingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.orange,
  },
  ongoingText: {
    fontSize: 18,
    fontFamily: 'Epilogue_700Bold',
    color: Colors.orange,
  },
  presetsLabel: {
    fontSize: 12,
    fontFamily: 'Epilogue_400Regular',
    color: Colors.muted,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#112236',
    borderWidth: 1,
    borderColor: '#1E3A52',
  },
  presetBtnActive: {
    backgroundColor: `${Colors.accent}20`,
    borderColor: Colors.accent,
  },
  presetText: {
    fontSize: 14,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.muted,
  },
  presetTextActive: {
    color: Colors.accent,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
