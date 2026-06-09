import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, ChevronDown, ChevronUp, Activity, Pill, MapPin, FileText } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { INTENSITY_CONFIG } from '@/types/crisis';
import { CrisisPhase } from '@/hooks/useCrisisCalendar';

// ── Helpers ───────────────────────────────────────────────────────────

function getIntensityColor(intensity: number | null): string {
  if (intensity === null) return Colors.muted;
  return INTENSITY_CONFIG.find((c) => c.value === intensity)?.color ?? Colors.muted;
}

function getIntensityLabel(intensity: number | null): string {
  if (intensity === null) return 'Não registrada';
  return INTENSITY_CONFIG.find((c) => c.value === intensity)?.label ?? `${intensity}/10`;
}

function getIntensityEmoji(intensity: number | null): string {
  if (intensity === null) return '❓';
  return INTENSITY_CONFIG.find((c) => c.value === intensity)?.emoji ?? '😐';
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDuration(start: Date, end: Date | null): string {
  if (!end) return 'Em andamento';
  const diffMs = end.getTime() - start.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours === 0) return `${minutes} minutos`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

function formatNivelIncapacidade(nivel: string | null): string {
  const map: Record<string, string> = { leve: 'Leve', moderado: 'Moderado', severo: 'Severo' };
  return nivel ? (map[nivel] ?? nivel) : '—';
}

// ── Tag ───────────────────────────────────────────────────────────────

function Tag({ label, color, filled = false }: { label: string; color?: string; filled?: boolean }) {
  return (
    <View style={{
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: filled && color ? `${color}20` : '#1E3A52',
      borderWidth: filled && color ? 1 : 0,
      borderColor: filled && color ? `${color}50` : 'transparent',
    }}>
      <Text style={{
        color: filled && color ? color : 'white',
        fontFamily: 'Epilogue_600SemiBold',
        fontSize: 13,
      }}>
        {label}
      </Text>
    </View>
  );
}

// ── PhaseCard ─────────────────────────────────────────────────────────

function PhaseCard({ phase, index, total }: { phase: CrisisPhase; index: number; total: number }) {
  const [expanded, setExpanded] = useState(false);
  const color = getIntensityColor(phase.intensidadeDor);
  const emoji = getIntensityEmoji(phase.intensidadeDor);
  const label = getIntensityLabel(phase.intensidadeDor);
  const hasDetails =
    phase.regiaoDor || phase.lado || phase.sintomas.length > 0 ||
    phase.medicamentos.length > 0 || phase.resumo;

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(300)}>
      <View style={{
        backgroundColor: '#112236',
        borderRadius: 20,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: color,
        overflow: 'hidden',
      }}>
        {/* Cabeçalho da fase */}
        <TouchableOpacity
          onPress={() => hasDetails && setExpanded((v) => !v)}
          activeOpacity={hasDetails ? 0.7 : 1}
          style={{ padding: 18, flexDirection: 'row', alignItems: 'center' }}
        >
          {/* Número da fase */}
          <View style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: `${color}25`,
            alignItems: 'center', justifyContent: 'center',
            marginRight: 14,
          }}>
            <Text style={{ color, fontFamily: 'Epilogue_700Bold', fontSize: 14 }}>{index + 1}</Text>
          </View>

          {/* Info */}
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontFamily: 'Epilogue_700Bold', fontSize: 15 }}>
              {emoji} {phase.intensidadeDor !== null ? `${phase.intensidadeDor}/10` : '—'}
              {'  '}
              <Text style={{ color, fontFamily: 'Epilogue_400Regular', fontSize: 13 }}>{label}</Text>
            </Text>
            {phase.nivelIncapacidade && (
              <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 12, marginTop: 3 }}>
                Incapacidade {formatNivelIncapacidade(phase.nivelIncapacidade)}
              </Text>
            )}
          </View>

          {hasDetails && (
            expanded
              ? <ChevronUp size={16} color={Colors.muted} />
              : <ChevronDown size={16} color={Colors.muted} />
          )}
        </TouchableOpacity>

        {/* Detalhes expandidos */}
        {expanded && (
          <View style={{ paddingHorizontal: 18, paddingBottom: 18, gap: 14 }}>
            <View style={{ height: 1, backgroundColor: '#1E3A52', marginBottom: 2 }} />

            {(phase.regiaoDor || phase.lado) && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <MapPin size={12} color={Colors.muted} />
                  <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_600SemiBold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
                    Localização
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {phase.regiaoDor && <Tag label={phase.regiaoDor} />}
                  {phase.lado && <Tag label={phase.lado} />}
                </View>
              </View>
            )}

            {phase.sintomas.length > 0 && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Activity size={12} color={Colors.muted} />
                  <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_600SemiBold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
                    Sintomas
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {phase.sintomas.map((s) => <Tag key={s} label={s} />)}
                </View>
              </View>
            )}

            {phase.medicamentos.length > 0 && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Pill size={12} color={Colors.accent} />
                  <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_600SemiBold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
                    Medicamentos
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {phase.medicamentos.map((m) => <Tag key={m} label={m} color={Colors.accent} filled />)}
                </View>
              </View>
            )}

            {phase.resumo && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <FileText size={12} color={Colors.muted} />
                  <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_600SemiBold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
                    Resumo IA
                  </Text>
                </View>
                <Text style={{ color: 'white', fontFamily: 'Epilogue_400Regular', fontSize: 13, lineHeight: 20, fontStyle: 'italic' }}>
                  "{phase.resumo}"
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ── CrisisDetailScreen ────────────────────────────────────────────────

export default function CrisisDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; data: string }>();

  const crisis = useMemo(() => {
    try {
      const parsed = JSON.parse(params.data);
      return {
        ...parsed,
        inicioCrise: new Date(parsed.inicioCrise),
        fimCrise: parsed.fimCrise ? new Date(parsed.fimCrise) : null,
        fases: parsed.fases ?? [],
      };
    } catch {
      return null;
    }
  }, [params.data]);

  if (!crisis) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular' }}>Crise não encontrada.</Text>
      </SafeAreaView>
    );
  }

  const maxIntensidade = crisis.intensidadeDor;
  const color = getIntensityColor(maxIntensidade);
  const label = getIntensityLabel(maxIntensidade);
  const emoji = getIntensityEmoji(maxIntensidade);
  const fases: CrisisPhase[] = crisis.fases;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark }}>

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1E3A52',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E3A52', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}
        >
          <ArrowLeft size={18} color="white" />
        </TouchableOpacity>
        <Text style={{ color: 'white', fontFamily: 'Epilogue_700Bold', fontSize: 18, flex: 1 }}>
          Detalhes da Crise
        </Text>
        {fases.length > 0 && (
          <View style={{ backgroundColor: '#1E3A52', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_600SemiBold', fontSize: 12 }}>
              {fases.length} {fases.length === 1 ? 'fase' : 'fases'}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero de intensidade máxima */}
        <Animated.View
          entering={FadeInDown.duration(350)}
          style={{
            backgroundColor: `${color}15`,
            borderRadius: 24,
            padding: 24,
            alignItems: 'center',
            marginBottom: 20,
            borderWidth: 1,
            borderColor: `${color}30`,
          }}
        >
          <Text style={{ fontSize: 52, marginBottom: 8 }}>{emoji}</Text>
          <Text style={{ color, fontFamily: 'Epilogue_700Bold', fontSize: 36 }}>
            {maxIntensidade !== null ? `${maxIntensidade}/10` : '—'}
          </Text>
          <Text style={{ color, fontFamily: 'Epilogue_600SemiBold', fontSize: 15, marginTop: 4 }}>
            {label}
          </Text>
          <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 12, marginTop: 6 }}>
            pico de intensidade
          </Text>
        </Animated.View>

        {/* Tempo */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(300)}
          style={{ backgroundColor: '#112236', borderRadius: 20, padding: 20, marginBottom: 20 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Clock size={14} color={Colors.muted} />
            <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_600SemiBold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
              Tempo
            </Text>
          </View>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 13 }}>Início</Text>
              <Text style={{ color: 'white', fontFamily: 'Epilogue_600SemiBold', fontSize: 13 }}>
                {formatDateTime(crisis.inicioCrise)}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: '#1E3A52' }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 13 }}>Fim</Text>
              <Text style={{ color: crisis.fimCrise ? 'white' : Colors.accent, fontFamily: 'Epilogue_600SemiBold', fontSize: 13 }}>
                {crisis.fimCrise ? formatDateTime(crisis.fimCrise) : 'Em andamento'}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: '#1E3A52' }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 13 }}>Duração total</Text>
              <Text style={{ color: 'white', fontFamily: 'Epilogue_700Bold', fontSize: 13 }}>
                {formatDuration(crisis.inicioCrise, crisis.fimCrise)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Fases */}
        {fases.length > 0 && (
          <Animated.View entering={FadeInDown.delay(160).duration(300)}>
            <Text style={{
              color: 'white',
              fontFamily: 'Epilogue_700Bold',
              fontSize: 16,
              marginBottom: 14,
            }}>
              Fases da crise
            </Text>
            {fases.map((fase, i) => (
              <PhaseCard key={fase.id} phase={fase} index={i} total={fases.length} />
            ))}
          </Animated.View>
        )}

        {fases.length === 0 && (
          <View style={{
            padding: 32, borderWidth: 1.5, borderStyle: 'dashed',
            borderColor: '#1E3A52', borderRadius: 20, alignItems: 'center',
          }}>
            <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 14 }}>
              Nenhuma fase registrada
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
