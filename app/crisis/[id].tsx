import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Zap, MapPin, Clock, Activity, Pill, FileText } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { INTENSITY_CONFIG } from '@/types/crisis';

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

// ── Seção reutilizável ────────────────────────────────────────────────

function Section({ icon, label, children, delay = 0 }: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(300)}
      style={{
        backgroundColor: '#112236',
        borderRadius: 20,
        padding: 20,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        {icon}
        <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_600SemiBold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
          {label}
        </Text>
      </View>
      {children}
    </Animated.View>
  );
}

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

  const color = getIntensityColor(crisis.intensidadeDor);
  const label = getIntensityLabel(crisis.intensidadeDor);
  const emoji = getIntensityEmoji(crisis.intensidadeDor);

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
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero de intensidade */}
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
            {crisis.intensidadeDor !== null ? `${crisis.intensidadeDor}/10` : '—'}
          </Text>
          <Text style={{ color, fontFamily: 'Epilogue_600SemiBold', fontSize: 15, marginTop: 4 }}>
            {label}
          </Text>
          {crisis.nivelIncapacidade && (
            <View style={{ marginTop: 12, backgroundColor: `${color}20`, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }}>
              <Text style={{ color, fontFamily: 'Epilogue_600SemiBold', fontSize: 12 }}>
                Incapacidade {formatNivelIncapacidade(crisis.nivelIncapacidade)}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Tempo */}
        <Section icon={<Clock size={14} color={Colors.muted} />} label="Tempo" delay={80}>
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
        </Section>

        {/* Localização */}
        {(crisis.regiaoDor || crisis.lado) && (
          <Section icon={<MapPin size={14} color={Colors.muted} />} label="Localização" delay={160}>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {crisis.regiaoDor && <Tag label={crisis.regiaoDor} />}
              {crisis.lado && <Tag label={crisis.lado} />}
            </View>
          </Section>
        )}

        {/* Sintomas */}
        {crisis.sintomas?.length > 0 && (
          <Section icon={<Activity size={14} color={Colors.muted} />} label="Sintomas" delay={240}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {crisis.sintomas.map((s: string) => (
                <Tag key={s} label={s} />
              ))}
            </View>
          </Section>
        )}

        {/* Medicamentos */}
        {crisis.medicamentos?.length > 0 && (
          <Section icon={<Pill size={14} color={Colors.accent} />} label="Medicamentos" delay={320}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {crisis.medicamentos.map((m: string) => (
                <Tag key={m} label={m} color={Colors.accent} filled />
              ))}
            </View>
          </Section>
        )}

        {/* Resumo da IA */}
        {crisis.resumo && (
          <Section icon={<FileText size={14} color={Colors.muted} />} label="Resumo" delay={400}>
            <Text style={{
              color: 'white',
              fontFamily: 'Epilogue_400Regular',
              fontSize: 14,
              lineHeight: 22,
              fontStyle: 'italic',
            }}>
              "{crisis.resumo}"
            </Text>
          </Section>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}