import { Colors } from '@/constants/Colors';
import { crisisRepository } from '@/repositories';
import { useSync } from '@/contexts/SyncContext';
import { elapsedSince } from '@/lib/format';
import { useRouter } from 'expo-router';
import { ChevronDown, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ScreenBackground from '@/components/ui/ScreenBackground';
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated';

export default function CrisisEmptyState() {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const { ultimaAtualizacao } = useSync();
  const [timeSinceLabel, setTimeSinceLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const lastEnd = await crisisRepository.lastEndedAt();
        if (cancelled) return;
        if (lastEnd) {
          const { value, unit } = elapsedSince(lastEnd);
          setTimeSinceLabel(`${value} ${unit}`);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [ultimaAtualizacao]);

  return (
    <ScreenBackground>
      <View style={styles.emptyContainer}>
        <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(100)} style={styles.emptyMascotWrapper}>
          <Image
            source={require('../../../assets/images/LivoMeditar.png')}
            style={styles.emptyMascotImage}
            resizeMode="contain"
            accessibilityLabel="Mascote Livo meditando"
          />
        </Animated.View>

        <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(250)}>
          <Text style={styles.emptyTitle} accessibilityRole="header">Tudo tranquilo!</Text>
          {timeSinceLabel ? (
            <Text style={styles.emptyHighlight}>
              Você está há{' '}
              <Text style={{ color: Colors.accent }}>{timeSinceLabel}</Text>
              {' '}sem crises
            </Text>
          ) : (
            <Text style={styles.emptyHighlight}>
              Nenhuma crise registrada
            </Text>
          )}
          <Text style={styles.emptySub}>
            Continue assim! Caso tenha uma crise, registre aqui para acompanhar seu progresso.
          </Text>
        </Animated.View>

        <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(400)}>
          <TouchableOpacity
            onPress={() => router.push('/record-crisis')}
            style={styles.emptyBtn}
            accessibilityRole="button"
            accessibilityLabel="Registrar uma nova crise"
          >
            <Zap size={18} color="white" fill="white" />
            <Text style={styles.emptyBtnText}>Registrar Crise</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={reduceMotion ? undefined : FadeInUp.delay(550)} style={{ marginTop: 32 }}>
          <Text style={styles.emptyArrowHint}>Ou toque no botão abaixo</Text>
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <ChevronDown size={24} color={Colors.muted} />
          </View>
        </Animated.View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyMascotWrapper: {
    width: 180,
    height: 180,
    marginBottom: 24,
  },
  emptyMascotImage: {
    width: '100%',
    height: '100%',
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: 'Epilogue_700Bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyHighlight: {
    fontSize: 18,
    fontFamily: 'Epilogue_600SemiBold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: 'Epilogue_400Regular',
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    minHeight: 56,
  },
  emptyBtnText: {
    fontSize: 16,
    fontFamily: 'Epilogue_700Bold',
    color: 'white',
  },
  emptyArrowHint: {
    fontSize: 13,
    fontFamily: 'Epilogue_400Regular',
    color: Colors.muted,
    textAlign: 'center',
  },
});
