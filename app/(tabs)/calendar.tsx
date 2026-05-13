import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { ChevronLeft, ChevronRight, Zap, Clock, MapPin, AlertCircle, Pill, Activity } from 'lucide-react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import Card from '@/components/Card';
import { useCrisisCalendar, CrisisDay } from '@/hooks/useCrisisCalendar';
import { INTENSITY_CONFIG } from '@/types/crisis';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// ── Helpers ───────────────────────────────────────────────────────────

function getIntensityColor(intensity: number | null): string {
  if (intensity === null) return Colors.muted;
  return INTENSITY_CONFIG.find((c) => c.value === intensity)?.color ?? Colors.muted;
}

function getIntensityLabel(intensity: number | null): string {
  if (intensity === null) return 'Intensidade não registrada';
  return INTENSITY_CONFIG.find((c) => c.value === intensity)?.label ?? `${intensity}/10`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(start: Date, end: Date | null): string {
  if (!end) return 'Em andamento';
  const diffMs = end.getTime() - start.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

function formatRegiao(regiao: string | null, lado: string | null): string | null {
  const partes = [regiao, lado].filter(Boolean);
  return partes.length > 0 ? partes.join(' · ') : null;
}

function formatNivelIncapacidade(nivel: string | null): string | null {
  const map: Record<string, string> = {
    leve: 'Leve',
    moderado: 'Moderado',
    severo: 'Severo',
  };
  return nivel ? (map[nivel] ?? nivel) : null;
}

// ── CrisisCard ────────────────────────────────────────────────────────

function CrisisCard({ crisis, index }: { crisis: CrisisDay; index: number }) {
  const color = getIntensityColor(crisis.intensidadeDor);
  const label = getIntensityLabel(crisis.intensidadeDor);
  const localizacao = formatRegiao(crisis.regiaoDor, crisis.lado);
  const incapacidade = formatNivelIncapacidade(crisis.nivelIncapacidade);

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(300)}>
      <Card style={{ marginBottom: 12, borderLeftWidth: 3, borderLeftColor: color }}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
            <Text style={{ color: 'white', fontFamily: 'Epilogue_700Bold', fontSize: 15 }}>
              Crise #{index + 1}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1E3A52', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
            <Clock size={11} color={Colors.muted} />
            <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 11 }}>
              {formatTime(crisis.inicioCrise)}
            </Text>
          </View>
        </View>

        {/* Intensidade */}
        {crisis.intensidadeDor !== null && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Zap size={14} color={color} />
            <Text style={{ color, fontFamily: 'Epilogue_600SemiBold', fontSize: 13 }}>
              {crisis.intensidadeDor}/10 — {label}
            </Text>
          </View>
        )}

        {/* Localização */}
        {localizacao && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <MapPin size={13} color={Colors.muted} />
            <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 12 }}>
              {localizacao}
            </Text>
          </View>
        )}

        {/* Duração */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Clock size={13} color={Colors.muted} />
          <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 12 }}>
            Duração: {formatDuration(crisis.inicioCrise, crisis.fimCrise)}
          </Text>
        </View>

        {/* Nível de incapacidade */}
        {incapacidade && (
          <View style={{
            alignSelf: 'flex-start',
            backgroundColor: `${color}20`,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
            marginBottom: 8,
          }}>
            <Text style={{ color, fontFamily: 'Epilogue_600SemiBold', fontSize: 11 }}>
              {incapacidade}
            </Text>
          </View>
        )}

        {/* Sintomas */}
        {crisis.sintomas.length > 0 && (
          <View style={{ marginTop: 4, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Activity size={13} color={Colors.muted} />
              <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_600SemiBold', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Sintomas
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {crisis.sintomas.map((s) => (
                <View key={s} style={{ backgroundColor: '#1E3A52', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color: 'white', fontFamily: 'Epilogue_400Regular', fontSize: 12 }}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Medicamentos */}
        {crisis.medicamentos.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Pill size={13} color={Colors.accent} />
              <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_600SemiBold', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Medicamentos
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {crisis.medicamentos.map((m) => (
                <View key={m} style={{ backgroundColor: `${Colors.accent}20`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: `${Colors.accent}40` }}>
                  <Text style={{ color: Colors.accent, fontFamily: 'Epilogue_600SemiBold', fontSize: 12 }}>{m}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Resumo da IA */}
        {crisis.resumo && (
          <Text style={{
            color: Colors.muted,
            fontFamily: 'Epilogue_400Regular',
            fontSize: 12,
            lineHeight: 18,
            marginTop: 4,
            fontStyle: 'italic',
          }}>
            "{crisis.resumo}"
          </Text>
        )}
      </Card>
    </Animated.View>
  );
}

// ── CalendarScreen ────────────────────────────────────────────────────

export default function CalendarScreen() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { crisisByDay, loading, error } = useCrisisCalendar(year, month);

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
  }, []);

  const selectedCrises = selectedDay ? (crisisByDay[selectedDay] ?? []) : [];

  // Estatísticas do mês
  const totalCrises = Object.values(crisisByDay).reduce((acc, arr) => acc + arr.length, 0);
  const criseDays = Object.keys(crisisByDay).length;
  const avgIntensity = (() => {
    const all = Object.values(crisisByDay)
      .flat()
      .map((c) => c.intensidadeDor)
      .filter((i): i is number => i !== null);
    if (all.length === 0) return null;
    return (all.reduce((a, b) => a + b, 0) / all.length).toFixed(1);
  })();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 24, paddingTop: 40 }}>

          {/* Título */}
          <Text style={{ fontSize: 28, color: 'white', fontFamily: 'Epilogue_300Light', marginBottom: 24 }}>
            Seu <Text style={{ fontFamily: 'Epilogue_700Bold' }}>Histórico</Text>
          </Text>

          {/* Calendário */}
          <Card style={{ marginBottom: 24 }}>

            {/* Navegação mês/ano */}
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

            {/* Dias da semana */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              {WEEKDAYS.map((d, i) => (
                <Text key={i} style={{ width: 40, textAlign: 'center', fontSize: 11, color: Colors.muted, fontFamily: 'Epilogue_700Bold' }}>
                  {d}
                </Text>
              ))}
            </View>

            {/* Grid de dias */}
            {loading ? (
              <View style={{ height: 180, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={Colors.accent} />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>

                {/* Células vazias para alinhar o primeiro dia */}
                {Array.from({ length: firstWeekday }).map((_, i) => (
                  <View key={`empty-${i}`} style={{ width: 40, height: 40, marginBottom: 4 }} />
                ))}

                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const hasCrisis = !!crisisByDay[day]?.length;
                  const crisisCount = crisisByDay[day]?.length ?? 0;
                  const isSelected = selectedDay === day;
                  const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

                  const maxIntensity = hasCrisis
                    ? Math.max(...(crisisByDay[day] ?? []).map((c) => c.intensidadeDor ?? 0))
                    : null;
                  const crisisColor = maxIntensity !== null ? getIntensityColor(maxIntensity) : null;

                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => handleDayPress(day)}
                      style={{
                        width: 40,
                        height: 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 4,
                        borderRadius: 12,
                        backgroundColor: isSelected
                          ? Colors.accent
                          : hasCrisis
                          ? `${crisisColor}25`
                          : 'transparent',
                        borderWidth: isToday && !isSelected ? 1.5 : 0,
                        borderColor: Colors.accent,
                      }}
                    >
                      <Text style={{
                        color: isSelected ? 'white' : hasCrisis ? crisisColor ?? 'white' : 'white',
                        fontFamily: isSelected || hasCrisis ? 'Epilogue_700Bold' : 'Epilogue_400Regular',
                        fontSize: 14,
                      }}>
                        {day}
                      </Text>

                      {/* Badge para múltiplas crises */}
                      {hasCrisis && !isSelected && crisisCount > 1 && (
                        <View style={{
                          position: 'absolute',
                          top: 3,
                          right: 3,
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: crisisColor ?? Colors.accent,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Text style={{ color: 'white', fontSize: 8, fontFamily: 'Epilogue_700Bold' }}>
                            {crisisCount}
                          </Text>
                        </View>
                      )}

                      {/* Ponto para 1 crise */}
                      {hasCrisis && !isSelected && crisisCount === 1 && (
                        <View style={{
                          position: 'absolute',
                          bottom: 3,
                          width: 4,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: crisisColor ?? Colors.accent,
                        }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Legenda */}
            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1E3A52', flexDirection: 'row', gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: '#EF444430' }} />
                <Text style={{ fontSize: 10, color: Colors.muted, fontFamily: 'Epilogue_400Regular' }}>Crise registrada</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 3, borderWidth: 1.5, borderColor: Colors.accent }} />
                <Text style={{ fontSize: 10, color: Colors.muted, fontFamily: 'Epilogue_400Regular' }}>Hoje</Text>
              </View>
            </View>
          </Card>

          {/* Estatísticas do mês */}
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
                  <Text style={{ color: getIntensityColor(Math.round(parseFloat(avgIntensity))), fontFamily: 'Epilogue_700Bold', fontSize: 22 }}>
                    {avgIntensity}
                  </Text>
                  <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 11, marginTop: 2 }}>
                    intensidade média
                  </Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* Erro */}
          {error && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, backgroundColor: '#EF444420', borderRadius: 16, marginBottom: 16 }}>
              <AlertCircle size={16} color="#EF4444" />
              <Text style={{ color: '#EF4444', fontFamily: 'Epilogue_400Regular', fontSize: 13 }}>
                Erro ao carregar crises: {error}
              </Text>
            </View>
          )}

          {/* Detalhes do dia selecionado */}
          {selectedDay !== null && (
            <Animated.View entering={FadeInUp.duration(250)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ color: 'white', fontFamily: 'Epilogue_700Bold', fontSize: 18 }}>
                  {selectedDay} de {MONTH_NAMES[month]}
                </Text>
                {selectedCrises.length > 0 && (
                  <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 13 }}>
                    {selectedCrises.length} {selectedCrises.length === 1 ? 'crise' : 'crises'}
                  </Text>
                )}
              </View>

              {selectedCrises.length === 0 ? (
                <View style={{
                  padding: 32,
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: '#1E3A52',
                  borderRadius: 20,
                  alignItems: 'center',
                }}>
                  <Text style={{ fontSize: 28, marginBottom: 8 }}>✨</Text>
                  <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 14, textAlign: 'center' }}>
                    Nenhuma crise neste dia
                  </Text>
                </View>
              ) : (
                selectedCrises.map((crisis, i) => (
                  <CrisisCard key={crisis.id} crisis={crisis} index={i} />
                ))
              )}
            </Animated.View>
          )}

          {/* Estado vazio do mês */}
          {!loading && !error && totalCrises === 0 && selectedDay === null && (
            <Animated.View entering={FadeInUp.duration(300)} style={{
              padding: 40,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: '#1E3A52',
              borderRadius: 24,
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 36, marginBottom: 12 }}>🌿</Text>
              <Text style={{ color: 'white', fontFamily: 'Epilogue_700Bold', fontSize: 16, marginBottom: 4 }}>
                Mês sem crises
              </Text>
              <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 13, textAlign: 'center' }}>
                Nenhuma crise registrada em {MONTH_NAMES[month]}
              </Text>
            </Animated.View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}