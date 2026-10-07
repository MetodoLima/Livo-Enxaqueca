import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock } from 'lucide-react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import {
  formatDateTime,
  formatDuration,
  intensityColor,
  intensityEmoji,
  intensityLabel,
} from '@/lib/format';
import { CrisisPhase } from '@/features/crisis/useCrisisCalendar';
import PhaseDetailCard from '@/features/crisis/components/PhaseDetailCard';

export default function CrisisDetailScreen() {
  const reduceMotion = useReducedMotion();
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
  const color = intensityColor(maxIntensidade);
  const label = intensityLabel(maxIntensidade);
  const emoji = intensityEmoji(maxIntensidade);
  const fases: CrisisPhase[] = crisis.fases;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark }}>

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
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E3A52', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <ArrowLeft size={18} color="white" />
        </TouchableOpacity>
        <Text
          style={{ color: 'white', fontFamily: 'Epilogue_700Bold', fontSize: 18, flex: 1 }}
          accessibilityRole="header"
        >
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
        <Animated.View
          entering={reduceMotion ? undefined : FadeInDown.duration(350)}
          style={{
            backgroundColor: `${color}15`,
            borderRadius: 24,
            padding: 24,
            alignItems: 'center',
            marginBottom: 20,
            borderWidth: 1,
            borderColor: `${color}30`,
          }}
          accessible={true}
          accessibilityLabel={`Pico de intensidade: ${maxIntensidade !== null ? `${maxIntensidade} de 10, ${label}` : 'não registrado'}`}
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

        <Animated.View
          entering={reduceMotion ? undefined : FadeInDown.delay(80).duration(300)}
          style={{ backgroundColor: '#112236', borderRadius: 20, padding: 20, marginBottom: 20 }}
          accessible={true}
          accessibilityLabel={`Início: ${formatDateTime(crisis.inicioCrise)}. Fim: ${crisis.fimCrise ? formatDateTime(crisis.fimCrise) : 'Em andamento'}. Duração: ${formatDuration(crisis.inicioCrise, crisis.fimCrise)}`}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Clock size={14} color={Colors.muted} />
            <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_600SemiBold', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>
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

        {fases.length > 0 && (
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(160).duration(300)}>
            <Text style={{
              color: 'white',
              fontFamily: 'Epilogue_700Bold',
              fontSize: 16,
              marginBottom: 14,
            }}>
              Fases da crise
            </Text>
            {fases.map((fase, i) => (
              <PhaseDetailCard key={fase.id} phase={fase} index={i} total={fases.length} />
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
