import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Moon, Droplets, FileText, Smile } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

// ── Helpers ───────────────────────────────────────────────────────────

const HUMOR_LABEL: Record<string, string> = {
  terrible: 'Péssimo', bad: 'Ruim', 'so-so': 'Regular', okay: 'Bem', great: 'Ótimo',
};
const HUMOR_EMOJI: Record<string, string> = {
  terrible: '😣', bad: '😕', 'so-so': '😐', okay: '🙂', great: '😄',
};
const HUMOR_COLOR: Record<string, string> = {
  terrible: '#EF4444', bad: '#F97316', 'so-so': '#EAB308', okay: '#22C55E', great: '#10B981',
};

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatSono(h: number): string {
  const horas = Math.floor(h);
  const min = h % 1 !== 0 ? '30min' : '';
  return min ? `${horas}h ${min}` : `${horas}h`;
}

function formatAgua(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(1).replace('.0', '')}L`;
  return `${ml}ml`;
}

// ── Section ───────────────────────────────────────────────────────────

function Section({ icon, label, children, delay = 0 }: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(300)}
      style={{ backgroundColor: '#112236', borderRadius: 20, padding: 20, marginBottom: 12 }}
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

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 13 }}>{label}</Text>
      <Text style={{ color: valueColor ?? 'white', fontFamily: 'Epilogue_600SemiBold', fontSize: 13 }}>{value}</Text>
    </View>
  );
}

// ── RegistroDetailScreen ──────────────────────────────────────────────

export default function RegistroDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; data: string }>();

  const registro = useMemo(() => {
    try {
      return JSON.parse(params.data);
    } catch {
      return null;
    }
  }, [params.data]);

  if (!registro) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular' }}>Registro não encontrado.</Text>
      </SafeAreaView>
    );
  }

  const humor = registro.humor as string | null;
  const humorColor = humor ? HUMOR_COLOR[humor] : Colors.accent;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark }}>

      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: '#1E3A52',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#1E3A52', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}
        >
          <ArrowLeft size={18} color="white" />
        </TouchableOpacity>
        <Text style={{ color: 'white', fontFamily: 'Epilogue_700Bold', fontSize: 18, flex: 1 }}>
          Detalhes do Evento
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero de humor */}
        {humor && (
          <Animated.View
            entering={FadeInDown.duration(350)}
            style={{
              backgroundColor: `${humorColor}15`,
              borderRadius: 24, padding: 24,
              alignItems: 'center', marginBottom: 20,
              borderWidth: 1, borderColor: `${humorColor}30`,
            }}
          >
            <Text style={{ fontSize: 52, marginBottom: 8 }}>{HUMOR_EMOJI[humor]}</Text>
            <Text style={{ color: humorColor, fontFamily: 'Epilogue_700Bold', fontSize: 24 }}>
              {HUMOR_LABEL[humor]}
            </Text>
            <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 13, marginTop: 6 }}>
              {formatDateTime(registro.createdAt)}
            </Text>
          </Animated.View>
        )}

        {/* Sem humor — mostra só a data */}
        {!humor && (
          <Animated.View
            entering={FadeInDown.duration(350)}
            style={{
              backgroundColor: `${Colors.accent}15`,
              borderRadius: 24, padding: 24,
              alignItems: 'center', marginBottom: 20,
              borderWidth: 1, borderColor: `${Colors.accent}30`,
            }}
          >
            <Text style={{ fontSize: 52, marginBottom: 8 }}>📋</Text>
            <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 13, marginTop: 6 }}>
              {formatDateTime(registro.createdAt)}
            </Text>
          </Animated.View>
        )}

        {/* Sono + Água */}
        {(registro.horasSono !== null || registro.mlAgua !== null) && (
          <Section icon={<Moon size={14} color={Colors.muted} />} label="Rotina" delay={80}>
            <View style={{ gap: 10 }}>
              {registro.horasSono !== null && (
                <Row
                  label="Sono"
                  value={formatSono(registro.horasSono)}
                  valueColor={Colors.purple ?? '#8B6FC0'}
                />
              )}
              {registro.horasSono !== null && registro.mlAgua !== null && (
                <View style={{ height: 1, backgroundColor: '#1E3A52' }} />
              )}
              {registro.mlAgua !== null && (
                <Row
                  label="Água"
                  value={formatAgua(registro.mlAgua)}
                  valueColor={Colors.accent}
                />
              )}
            </View>
          </Section>
        )}

        {/* Relato */}
        {registro.relato && (
          <Section icon={<FileText size={14} color={Colors.muted} />} label="Relato" delay={160}>
            <Text style={{
              color: 'white', fontFamily: 'Epilogue_400Regular',
              fontSize: 14, lineHeight: 22, fontStyle: 'italic',
            }}>
              "{registro.relato}"
            </Text>
          </Section>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}