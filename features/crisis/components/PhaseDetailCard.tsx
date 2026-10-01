import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp, Activity, Pill, MapPin, FileText } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { intensityColor, intensityEmoji, intensityLabel } from '@/lib/format';
import { CrisisPhase } from '@/features/crisis/useCrisisCalendar';

export default function PhaseDetailCard({ phase, index, total }: { phase: CrisisPhase; index: number; total: number }) {
  const [expanded, setExpanded] = useState(false);
  const color = intensityColor(phase.intensidadeDor);
  const emoji = intensityEmoji(phase.intensidadeDor);
  const label = intensityLabel(phase.intensidadeDor);
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
        <TouchableOpacity
          onPress={() => hasDetails && setExpanded((v) => !v)}
          activeOpacity={hasDetails ? 0.7 : 1}
          style={{ padding: 18, flexDirection: 'row', alignItems: 'center' }}
        >
          <View style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: `${color}25`,
            alignItems: 'center', justifyContent: 'center',
            marginRight: 14,
          }}>
            <Text style={{ color, fontFamily: 'Epilogue_700Bold', fontSize: 14 }}>{index + 1}</Text>
          </View>

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
                  {phase.regiaoDor && <PhaseTag label={phase.regiaoDor} />}
                  {phase.lado && <PhaseTag label={phase.lado} />}
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
                  {phase.sintomas.map((s) => <PhaseTag key={s} label={s} />)}
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
                  {phase.medicamentos.map((m) => <PhaseTag key={m} label={m} color={Colors.accent} filled />)}
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

function PhaseTag({ label, color, filled = false }: { label: string; color?: string; filled?: boolean }) {
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

function formatNivelIncapacidade(nivel: string | null): string {
  const map: Record<string, string> = { leve: 'Leve', moderado: 'Moderado', severo: 'Severo' };
  return nivel ? (map[nivel] ?? nivel) : '—';
}
