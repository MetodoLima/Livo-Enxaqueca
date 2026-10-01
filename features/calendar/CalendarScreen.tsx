import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import Card from '@/components/ui/Card';
import ScreenBackground from '@/components/ui/ScreenBackground';
import { useCrisisCalendar } from '@/features/crisis/useCrisisCalendar';
import { useDailyRecordCalendar } from '@/features/daily-record/useDailyRecordCalendar';
import { intensityColor } from '@/lib/format';
import type { CalendarTab, TimelineEntry } from '@/features/calendar/types';
import StuckQueueNotice from '@/features/calendar/components/StuckQueueNotice';
import CrisisListItem from '@/features/calendar/components/CrisisListItem';
import DailyRecordListItem from '@/features/calendar/components/DailyRecordListItem';
import CalendarTabBar from '@/features/calendar/components/CalendarTabBar';
import TimelineItem from '@/features/calendar/components/TimelineItem';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function CalendarScreen() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<CalendarTab>('todos');

  const { crisisByDay, loading: loadingCrises, error: errorCrises } = useCrisisCalendar(year, month);
  const { registroByDay, loading: loadingRegistro, error: errorRegistro } = useDailyRecordCalendar(year, month);

  const loading = loadingCrises || loadingRegistro;
  const error = errorCrises || errorRegistro;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const goToPrevMonth = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDay(null);
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }, [month]);

  const goToNextMonth = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDay(null);
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }, [month]);

  const handleDayPress = useCallback((day: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDay((prev) => (prev === day ? null : day));
    setActiveTab('todos');
  }, []);

  const selectedCrises = selectedDay ? (crisisByDay[selectedDay] ?? []) : [];
  const selectedRegistros = selectedDay ? (registroByDay[selectedDay] ?? []) : [];
  const hasCrises = selectedCrises.length > 0;
  const hasRegistro = selectedRegistros.length > 0;

  const timeline: TimelineEntry[] = [];
  selectedCrises.forEach((c) => timeline.push({ type: 'crise', time: c.inicioCrise, data: c }));
  selectedRegistros.forEach((r) => timeline.push({ type: 'registro', time: new Date(r.createdAt), data: r }));
  timeline.sort((a, b) => a.time.getTime() - b.time.getTime());

  const totalCrises = Object.values(crisisByDay).reduce((acc, arr) => acc + arr.length, 0);
  const criseDays = Object.keys(crisisByDay).length;
  const avgIntensity = (() => {
    const all = Object.values(crisisByDay).flat().map((c) => c.intensidadeDor).filter((i): i is number => i !== null);
    if (all.length === 0) return null;
    return (all.reduce((a, b) => a + b, 0) / all.length).toFixed(1);
  })();

  return (
    <ScreenBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 24, paddingTop: 40 }}>

          <Text style={{ fontSize: 28, color: 'white', fontFamily: 'Epilogue_300Light', marginBottom: 24 }}>
            Seu <Text style={{ fontFamily: 'Epilogue_700Bold' }}>Histórico</Text>
          </Text>

          <StuckQueueNotice />

          <Card style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <TouchableOpacity
                onPress={goToPrevMonth}
                style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E3A52' }}
              >
                <ChevronLeft size={20} color="white" />
              </TouchableOpacity>
              <Text style={{ color: 'white', fontFamily: 'Epilogue_700Bold', fontSize: 16 }}>
                {MONTH_NAMES[month]} {year}
              </Text>
              <TouchableOpacity
                onPress={goToNextMonth}
                style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E3A52' }}
              >
                <ChevronRight size={20} color="white" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              {WEEKDAYS.map((d, i) => (
                <Text key={i} style={{ width: 40, textAlign: 'center', fontSize: 11, color: Colors.muted, fontFamily: 'Epilogue_700Bold' }}>
                  {d}
                </Text>
              ))}
            </View>

            {loading ? (
              <View style={{ height: 180, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={Colors.accent} />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {Array.from({ length: firstWeekday }).map((_, i) => (
                  <View key={`empty-${i}`} style={{ width: 40, height: 40, marginBottom: 4 }} />
                ))}

                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const hasCrisisDay = !!crisisByDay[day]?.length;
                  const hasRegistroDay = !!registroByDay[day]?.length;
                  const crisisCount = crisisByDay[day]?.length ?? 0;
                  const isSelected = selectedDay === day;
                  const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                  const maxIntensity = hasCrisisDay
                    ? Math.max(...(crisisByDay[day] ?? []).map((c) => c.intensidadeDor ?? 0))
                    : null;
                  const crisisColor = maxIntensity !== null ? intensityColor(maxIntensity) : null;

                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => handleDayPress(day)}
                      style={{
                        width: 40, height: 40,
                        alignItems: 'center', justifyContent: 'center',
                        marginBottom: 4, borderRadius: 12,
                        backgroundColor: isSelected
                          ? Colors.accent
                          : hasCrisisDay
                          ? `${crisisColor}25`
                          : 'transparent',
                        borderWidth: isToday && !isSelected ? 1.5 : 0,
                        borderColor: Colors.accent,
                      }}
                    >
                      <Text style={{
                        color: isSelected ? 'white' : hasCrisisDay ? crisisColor ?? 'white' : 'white',
                        fontFamily: isSelected || hasCrisisDay ? 'Epilogue_700Bold' : 'Epilogue_400Regular',
                        fontSize: 14,
                      }}>
                        {day}
                      </Text>

                      {hasCrisisDay && !isSelected && crisisCount === 1 && (
                        <View style={{
                          position: 'absolute', bottom: 3,
                          width: 4, height: 4, borderRadius: 2,
                          backgroundColor: crisisColor ?? Colors.accent,
                        }} />
                      )}

                      {hasCrisisDay && !isSelected && crisisCount > 1 && (
                        <View style={{
                          position: 'absolute', top: 3, right: 3,
                          width: 14, height: 14, borderRadius: 7,
                          backgroundColor: crisisColor ?? Colors.accent,
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Text style={{ color: 'white', fontSize: 8, fontFamily: 'Epilogue_700Bold' }}>
                            {crisisCount}
                          </Text>
                        </View>
                      )}

                      {hasRegistroDay && !isSelected && (
                        <View style={{
                          position: 'absolute', bottom: 3, right: 3,
                          width: 5, height: 5, borderRadius: 2,
                          backgroundColor: Colors.accent, opacity: 0.8,
                        }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1E3A52', flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#EF444430' }} />
                <Text style={{ fontSize: 10, color: Colors.muted, fontFamily: 'Epilogue_400Regular' }}>Crise</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: Colors.accent, opacity: 0.8 }} />
                <Text style={{ fontSize: 10, color: Colors.muted, fontFamily: 'Epilogue_400Regular' }}>Registro</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 3, borderWidth: 1.5, borderColor: Colors.accent }} />
                <Text style={{ fontSize: 10, color: Colors.muted, fontFamily: 'Epilogue_400Regular' }}>Hoje</Text>
              </View>
            </View>
          </Card>

          {!loading && totalCrises > 0 && (
            <Animated.View entering={FadeInUp.duration(300)} style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
              <View style={{ flex: 1, backgroundColor: '#1E3A52', borderRadius: 16, padding: 16, alignItems: 'center' }}>
                <Text style={{ color: 'white', fontFamily: 'Epilogue_700Bold', fontSize: 22 }}>{totalCrises}</Text>
                <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 11, marginTop: 2 }}>
                  {totalCrises === 1 ? 'crise' : 'crises'}
                </Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#1E3A52', borderRadius: 16, padding: 16, alignItems: 'center' }}>
                <Text style={{ color: 'white', fontFamily: 'Epilogue_700Bold', fontSize: 22 }}>{criseDays}</Text>
                <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 11, marginTop: 2 }}>
                  {criseDays === 1 ? 'dia afetado' : 'dias afetados'}
                </Text>
              </View>
              {avgIntensity !== null && (
                <View style={{ flex: 1, backgroundColor: '#1E3A52', borderRadius: 16, padding: 16, alignItems: 'center' }}>
                  <Text style={{ color: intensityColor(Math.round(parseFloat(avgIntensity))), fontFamily: 'Epilogue_700Bold', fontSize: 22 }}>
                    {avgIntensity}
                  </Text>
                  <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 11, marginTop: 2 }}>intensidade média</Text>
                </View>
              )}
            </Animated.View>
          )}

          {error && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, backgroundColor: '#EF444420', borderRadius: 16, marginBottom: 16 }}>
              <AlertCircle size={16} color="#EF4444" />
              <Text style={{ color: '#EF4444', fontFamily: 'Epilogue_400Regular', fontSize: 13 }}>
                Erro ao carregar dados: {error}
              </Text>
            </View>
          )}

          {selectedDay !== null && (
            <Animated.View entering={FadeInUp.duration(250)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ color: 'white', fontFamily: 'Epilogue_700Bold', fontSize: 18 }}>
                  {selectedDay} de {MONTH_NAMES[month]}
                </Text>
                <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 13 }}>
                  {hasCrises && `${selectedCrises.length} crise${selectedCrises.length > 1 ? 's' : ''}`}
                  {hasCrises && hasRegistro && ' · '}
                  {hasRegistro && `${selectedRegistros.length} evento${selectedRegistros.length > 1 ? 's' : ''}`}
                </Text>
              </View>

              {(hasCrises || hasRegistro) && (
                <CalendarTabBar
                  active={activeTab}
                  onChange={setActiveTab}
                  hasCrises={hasCrises}
                  hasRegistro={hasRegistro}
                />
              )}

              {!hasCrises && !hasRegistro ? (
                <View style={{
                  padding: 32, borderWidth: 1.5, borderStyle: 'dashed',
                  borderColor: '#1E3A52', borderRadius: 20, alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 28, marginBottom: 8 }}>✨</Text>
                  <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 14, textAlign: 'center' }}>
                    Nenhum dado neste dia
                  </Text>
                </View>
              ) : activeTab === 'todos' ? (
                timeline.map((entry, i) => (
                  <TimelineItem key={`${entry.type}-${i}`} entry={entry} index={i} />
                ))
              ) : activeTab === 'crises' ? (
                hasCrises ? (
                  selectedCrises.map((crisis, i) => (
                    <CrisisListItem key={crisis.id} crisis={crisis} index={i} />
                  ))
                ) : (
                  <View style={{
                    padding: 24, borderWidth: 1.5, borderStyle: 'dashed',
                    borderColor: '#1E3A52', borderRadius: 20, alignItems: 'center',
                  }}>
                    <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 14 }}>
                      Nenhuma crise neste dia
                    </Text>
                  </View>
                )
              ) : (
                hasRegistro ? (
                  selectedRegistros.map((r, i) => (
                    <DailyRecordListItem key={r.id} registro={r} index={i} />
                  ))
                ) : (
                  <View style={{
                    padding: 24, borderWidth: 1.5, borderStyle: 'dashed',
                    borderColor: '#1E3A52', borderRadius: 20, alignItems: 'center',
                  }}>
                    <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 14 }}>
                      Nenhum evento registrado neste dia
                    </Text>
                  </View>
                )
              )}
            </Animated.View>
          )}

          {!loading && !error && totalCrises === 0 && Object.keys(registroByDay).length === 0 && selectedDay === null && (
            <Animated.View entering={FadeInUp.duration(300)} style={{
              padding: 40, borderWidth: 1.5, borderStyle: 'dashed',
              borderColor: '#1E3A52', borderRadius: 24, alignItems: 'center',
            }}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>🌿</Text>
              <Text style={{ color: 'white', fontFamily: 'Epilogue_700Bold', fontSize: 16, marginBottom: 4 }}>
                Mês sem registros
              </Text>
              <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 13, textAlign: 'center' }}>
                Nenhuma crise ou evento em {MONTH_NAMES[month]}
              </Text>
            </Animated.View>
          )}

        </View>
      </ScrollView>
    </ScreenBackground>
  );
}