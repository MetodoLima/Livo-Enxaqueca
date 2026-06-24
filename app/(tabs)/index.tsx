import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {
  Mic,
  Zap,
  ChevronRight,
  Activity,
  TrendingDown,
  Bell,
  Moon,
  Droplets,
  Send,
  Check,
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Link } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { MoodId } from '@/constants/data';
import MoodSelector from '@/components/MoodSelector';
import { useAuth } from '@/contexts/AuthContext';
import ScreenBackground from '@/components/ScreenBackground';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRegistroEvento } from '@/hooks/useRegistroEvento';
import { supabase } from '@/lib/supabase';

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatSono(h: number): string {
  if (h === 0) return '0h';
  const horas = Math.floor(h);
  const min = h % 1 !== 0 ? '30min' : '';
  return min ? `${horas}h ${min}` : `${horas}h`;
}

function formatAgua(ml: number): string {
  if (ml === 0) return '0ml';
  if (ml >= 1000) return `${(ml / 1000).toFixed(1).replace('.0', '')}L`;
  return `${ml}ml`;
}

// ── Helper: format time since last crisis ──────────────────────────────
function formatTimeSinceHome(lastDate: Date): { number: string; label: string } {
  const now = new Date();
  const diffMs = now.getTime() - lastDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return { number: String(diffMins), label: `minuto${diffMins !== 1 ? 's' : ''} sem crises` };
  if (diffHours < 24) return { number: String(diffHours), label: `hora${diffHours !== 1 ? 's' : ''} sem crises` };
  return { number: String(diffDays), label: `dia${diffDays !== 1 ? 's' : ''} sem crises` };
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<MoodId | null>(null);
  const [relato, setRelato] = useState('');
  const [sonoLocal, setSonoLocal] = useState(0);
  const [aguaLocal, setAguaLocal] = useState(0);

  // ── Home stats ──────────────────────────────────────────────────────
  const [streakInfo, setStreakInfo] = useState<{ number: string; label: string } | null>(null);
  const [crisesThisMonth, setCrisesThisMonth] = useState<number | null>(null);
  const [avgIntensity, setAvgIntensity] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user || cancelled) return;

        // Last crisis end time
        const { data: lastCrisis } = await supabase
          .from('crise_enxaqueca')
          .select('fim_crise')
          .not('fim_crise', 'is', null)
          .order('fim_crise', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!cancelled && lastCrisis?.fim_crise) {
          setStreakInfo(formatTimeSinceHome(new Date(lastCrisis.fim_crise)));
        }

        // Crises this month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const { count } = await supabase
          .from('crise_enxaqueca')
          .select('id', { count: 'exact', head: true })
          .gte('inicio_crise', monthStart);
        if (!cancelled) setCrisesThisMonth(count ?? 0);

        // Average intensity (all-time via registro_crise)
        const { data: intensidades } = await supabase
          .from('registro_crise')
          .select('intensidade_dor')
          .not('intensidade_dor', 'is', null);
        if (!cancelled && intensidades && intensidades.length > 0) {
          const vals = intensidades.map((r: any) => r.intensidade_dor as number);
          setAvgIntensity(Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const today = toDateString(new Date());
  const { saving, saved, salvar } = useRegistroEvento(today);

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  const handleRegistrar = () => {
    salvar({
      relato: relato.trim() || null,
      horasSono: sonoLocal > 0 ? sonoLocal : null,
      mlAgua: aguaLocal > 0 ? aguaLocal : null,
      humor: selectedMood,
    });
    setRelato('');
    setSonoLocal(0);
    setAguaLocal(0);
    setSelectedMood(null);
  };

  const temAlgumDado =
    relato.trim().length > 0 ||
    sonoLocal > 0 ||
    aguaLocal > 0 ||
    selectedMood !== null;

  return (
    <ScreenBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>

          {/* ── Header ── */}
          <View className="flex-row justify-between items-center" style={{ marginBottom: 28 }}>
            <View>
              <Text className="text-[28px] text-white/60 font-epilogue-light">
                {greeting},
              </Text>
              <Text className="text-[30px] text-white font-epilogue-bold" style={{ marginTop: -2 }}>
                {user?.user_metadata?.name ? `${user.user_metadata.name}!` : 'Visitante!'}
              </Text>
            </View>
            <TouchableOpacity style={styles.headerBtn}>
              <Bell size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          {/* ── Mood Selector ── */}
          <Animated.View entering={FadeInUp.delay(100)} style={{ marginBottom: 28 }}>
            <Text style={styles.sectionLabel}>Como você está hoje?</Text>
            <MoodSelector
              selected={selectedMood}
              onSelect={(mood) => setSelectedMood(mood === selectedMood ? null : mood)}
            />
          </Animated.View>

          {/* ── Mascote + Registro (bloco conectado) ── */}
          <Animated.View entering={FadeInUp.delay(200)} style={{ marginBottom: 20 }}>

            {/* Card do mascote — topo */}
            <View style={styles.mascotContainer}>
              <Image
                source={require('../../assets/images/IA-Livo.webp')}
                style={styles.mascotImageAbsolute}
                resizeMode="cover"
              />
              <View style={styles.mascotContent}>
                <Text className="text-white text-2xl font-epilogue-bold text-center shadow-lg">
                  Registre um evento
                </Text>
                <TouchableOpacity style={styles.micButton}>
                  <Mic size={28} color="white" />
                </TouchableOpacity>
                <View style={styles.inputContainer}>
                  <TextInput
                    value={relato}
                    onChangeText={setRelato}
                    placeholder="O que aconteceu hoje?"
                    placeholderTextColor={Colors.muted}
                    multiline
                    style={{
                      flex: 1,
                      color: 'white',
                      fontFamily: 'Epilogue_400Regular',
                      fontSize: 14,
                      maxHeight: 80,
                    }}
                  />
                </View>
              </View>
            </View>

            {/* Card de rotina — base, conectado visualmente */}
            <View style={styles.rotinaCard}>
              <BlurView
                intensity={40}
                tint="dark"
                style={[
                  StyleSheet.absoluteFillObject,
                  { borderRadius: 28, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
                ]}
              />
              <LinearGradient
                colors={['rgba(20, 60, 81, 0.92)', 'rgba(37, 183, 187, 0.18)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  StyleSheet.absoluteFillObject,
                  { borderRadius: 28, borderTopLeftRadius: 0, borderTopRightRadius: 0 },
                ]}
              />

              <View style={{ position: 'relative' }}>
                {/* Divisor com label */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerLabel}>rotina de hoje</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Sono */}
                <View style={styles.sliderBlock}>
                  <View style={styles.sliderHeader}>
                    <View style={styles.sliderIconRow}>
                      <Moon size={16} color={Colors.purple ?? '#8B6FC0'} />
                      <Text style={styles.sliderLabel}>Sono</Text>
                    </View>
                    <Text style={[styles.sliderValue, { color: sonoLocal > 0 ? (Colors.purple ?? '#8B6FC0') : Colors.muted }]}>
                      {sonoLocal > 0 ? formatSono(sonoLocal) : 'Não registrado'}
                    </Text>
                  </View>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={0}
                    maximumValue={16}
                    step={0.5}
                    value={sonoLocal}
                    onValueChange={(v) => setSonoLocal(Math.round(v * 2) / 2)}
                    minimumTrackTintColor={Colors.purple ?? '#8B6FC0'}
                    maximumTrackTintColor="rgba(255,255,255,0.1)"
                    thumbTintColor={Colors.purple ?? '#8B6FC0'}
                  />
                  <View style={styles.sliderTicks}>
                    {['0h', '4h', '8h', '12h', '16h+'].map(t => (
                      <Text key={t} style={styles.sliderTick}>{t}</Text>
                    ))}
                  </View>
                </View>

                {/* Água */}
                <View style={styles.sliderBlock}>
                  <View style={styles.sliderHeader}>
                    <View style={styles.sliderIconRow}>
                      <Droplets size={16} color={Colors.accent} />
                      <Text style={styles.sliderLabel}>Água</Text>
                    </View>
                    <Text style={[styles.sliderValue, { color: aguaLocal > 0 ? Colors.accent : Colors.muted }]}>
                      {aguaLocal > 0 ? formatAgua(aguaLocal) : 'Não registrado'}
                    </Text>
                  </View>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={0}
                    maximumValue={4000}
                    step={100}
                    value={aguaLocal}
                    onValueChange={(v) => setAguaLocal(Math.round(v / 100) * 100)}
                    minimumTrackTintColor={Colors.accent}
                    maximumTrackTintColor="rgba(255,255,255,0.1)"
                    thumbTintColor={Colors.accent}
                  />
                  <View style={styles.sliderTicks}>
                    {['0', '1L', '2L', '3L', '4L+'].map(t => (
                      <Text key={t} style={styles.sliderTick}>{t}</Text>
                    ))}
                  </View>
                </View>

                {/* Botão registrar */}
                <TouchableOpacity
                  onPress={handleRegistrar}
                  disabled={!temAlgumDado || saving}
                  style={[
                    styles.registrarBtn,
                    {
                      backgroundColor: saved
                        ? '#10B981'
                        : temAlgumDado
                        ? Colors.accent
                        : 'rgba(37, 183, 187, 0.2)',
                      opacity: !temAlgumDado && !saving ? 0.5 : 1,
                    },
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : saved ? (
                    <>
                      <Check size={18} color="white" />
                      <Text style={styles.registrarBtnText}>Registrado!</Text>
                    </>
                  ) : (
                    <>
                      <Send size={18} color="white" />
                      <Text style={styles.registrarBtnText}>Registrar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* ── Widget: Migraine Status ── */}
          <Animated.View entering={FadeInUp.delay(300)}>
            <View style={styles.widget}>
              <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
              <LinearGradient
                colors={['rgba(37, 183, 187, 0.75)', 'rgba(20, 60, 81, 0.4)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.widgetContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.streakCircle}>
                    <Text style={styles.streakNumber}>{streakInfo?.number ?? '–'}</Text>
                  </View>
                  <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text style={styles.widgetHeading}>Sem enxaqueca</Text>
                    <Text style={styles.widgetSubtext}>
                      {streakInfo ? streakInfo.label : 'Nenhuma crise registrada'}
                    </Text>
                  </View>
                </View>
                <Link href="/record-crisis" asChild>
                  <TouchableOpacity style={styles.accentButton}>
                    <Zap size={18} color="white" fill="white" />
                    <Text style={styles.accentButtonText}>Registrar Crise</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </Animated.View>

          {/* ── Widget: Stats Grid ── */}
          <View style={styles.statsGridContainer}>
            <Animated.View entering={FadeInUp.delay(400)} style={[styles.statWidget, styles.statCardLeft]}>
              <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]} />
              <LinearGradient
                colors={['rgba(139, 163, 167, 0.75)', 'rgba(20, 60, 81, 0.4)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.statWidgetContent}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                  <Activity size={22} color="white" />
                </View>
                <Text style={[styles.statNumber, { color: 'white' }]}>{crisesThisMonth ?? '–'}</Text>
                <Text style={[styles.statLabel, { color: 'white' }]}>Crises Mês</Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(500)} style={styles.statWidget}>
              <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 24 }]} />
              <LinearGradient
                colors={['rgba(20, 60, 81, 0.85)', 'rgba(37, 183, 187, 0.3)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.statWidgetContent}>
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                  <TrendingDown size={22} color="white" />
                </View>
                <Text style={[styles.statNumber, { color: 'white' }]}>{avgIntensity ?? '–'}</Text>
                <Text style={[styles.statLabel, { color: 'white' }]}>Intensidade Média</Text>
              </View>
            </Animated.View>
          </View>

          {/* ── Widget: Insight ── */}
          <Animated.View entering={FadeInUp.delay(600)} style={{ marginBottom: 20 }}>
            <View style={styles.widget}>
              <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]} />
              <LinearGradient
                colors={['rgba(37, 183, 187, 0.75)', 'rgba(139, 163, 167, 0.25)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.widgetContent}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.insightIcon}>
                    <Text style={{ fontSize: 22 }}>💡</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.widgetHeading}>Padrão detectado</Text>
                    <Text style={styles.widgetSubtext}>
                      Dormir antes das 23h evitou crises matinais.
                    </Text>
                  </View>
                  <ChevronRight size={18} color={Colors.muted} />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  headerBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 20, color: 'rgba(255, 255, 255, 0.95)',
    fontFamily: 'Epilogue_600SemiBold', textAlign: 'center',
    marginTop: 24, marginBottom: 20,
  },
  mascotContainer: {
    width: '100%', aspectRatio: 1.1, borderRadius: 28,
    borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
    overflow: 'hidden', backgroundColor: 'rgba(17, 47, 61, 0.9)',
    borderWidth: 1, borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  mascotImageAbsolute: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: '100%', height: '100%', opacity: 0.7,
  },
  mascotContent: {
    flex: 1, padding: 20, paddingTop: 36,
    justifyContent: 'space-between', alignItems: 'center',
  },
  micButton: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(37, 183, 187, 0.35)',
    borderWidth: 1.5, borderColor: 'rgba(37, 183, 187, 0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  inputContainer: {
    width: '100%', borderRadius: 20, flexDirection: 'row',
    alignItems: 'center', padding: 8, paddingLeft: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  rotinaCard: {
    borderRadius: 28, borderTopLeftRadius: 0, borderTopRightRadius: 0,
    overflow: 'hidden', padding: 20, paddingTop: 16,
    borderWidth: 1.5, borderTopWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  dividerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20,
  },
  dividerLine: {
    flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerLabel: {
    color: Colors.muted, fontFamily: 'Epilogue_600SemiBold',
    fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase',
  },
  sliderBlock: { marginBottom: 16 },
  sliderHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  sliderIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sliderLabel: { color: 'white', fontFamily: 'Epilogue_600SemiBold', fontSize: 14 },
  sliderValue: { fontFamily: 'Epilogue_700Bold', fontSize: 14 },
  sliderTicks: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 4, marginTop: -4,
  },
  sliderTick: { color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 10 },
  registrarBtn: {
    marginTop: 8, borderRadius: 16, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  registrarBtnText: { color: 'white', fontFamily: 'Epilogue_700Bold', fontSize: 15 },
  widget: {
    borderRadius: 28, overflow: 'hidden', marginBottom: 20,
    borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  widgetContent: { padding: 24 },
  widgetHeading: { fontSize: 17, color: '#FFFFFF', fontFamily: 'Epilogue_700Bold' },
  widgetSubtext: {
    fontSize: 13, color: Colors.muted,
    fontFamily: 'Epilogue_400Regular', marginTop: 3,
  },
  streakCircle: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 3, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  streakNumber: { fontSize: 20, color: '#FFFFFF', fontFamily: 'Epilogue_700Bold' },
  accentButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.accent, paddingVertical: 14,
    borderRadius: 16, marginTop: 18,
  },
  accentButtonText: {
    color: '#FFFFFF', fontFamily: 'Epilogue_700Bold', fontSize: 15, marginLeft: 8,
  },
  statsGridContainer: { flexDirection: 'row', marginBottom: 20, width: '100%' },
  statWidget: {
    flex: 1, aspectRatio: 1, borderRadius: 24,
    borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.15)', overflow: 'hidden',
  },
  statCardLeft: { marginRight: 12 },
  statWidgetContent: {
    flex: 1, padding: 16, alignItems: 'center', justifyContent: 'center',
  },
  statIconContainer: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statNumber: { fontSize: 34, fontFamily: 'Epilogue_700Bold', marginBottom: 2 },
  statLabel: {
    fontSize: 10, textAlign: 'center', textTransform: 'uppercase',
    letterSpacing: 1.5, fontFamily: 'Epilogue_700Bold',
  },
  insightIcon: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: 'rgba(37, 183, 187, 0.1)',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
});