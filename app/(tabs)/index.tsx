import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import {
  Mic,
  Zap,
  ChevronRight,
  Activity,
  Sparkles,
  Bell,
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Link } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { HABITS, MoodId } from '@/constants/data';
import MoodSelector from '@/components/MoodSelector';
import { useAuth } from '@/contexts/AuthContext';
import ScreenBackground from '@/components/ScreenBackground';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<MoodId | null>(null);

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';

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
            <Text style={styles.sectionLabel}>
              Como você está hoje?
            </Text>
            <MoodSelector selected={selectedMood} onSelect={setSelectedMood} />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200)} style={styles.mascotContainer}>
            <Image
              source={require('../../assets/images/IA-Livo.webp')}
              style={styles.mascotImageAbsolute}
              resizeMode="cover"
            />
            <View style={styles.mascotContent}>
              
              <Text className="text-white text-lg font-epilogue-bold text-center shadow-lg">
                Como posso ajudar?
              </Text>

              <TouchableOpacity style={styles.micButton}>
                <Mic size={28} color="white" />
              </TouchableOpacity>

              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Pergunte ao Livo..."
                  placeholderTextColor={Colors.muted}
                  style={{ flex: 1, color: 'white', fontFamily: 'Epilogue_400Regular', fontSize: 14 }}
                />
                <TouchableOpacity style={styles.inputMicBtn}>
                  <Mic size={14} color="white" />
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
                    <Text style={styles.streakNumber}>3</Text>
                  </View>
                  <View style={{ marginLeft: 16, flex: 1 }}>
                    <Text style={styles.widgetHeading}>Sem enxaqueca</Text>
                    <Text style={styles.widgetSubtext}>3 dias consecutivos sem crises</Text>
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
                <Text style={[styles.statNumber, { color: 'white' }]}>2</Text>
                <Text style={[styles.statLabel, { color: 'white' }]}>
                  Crises Mês
                </Text>
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
                  <Sparkles size={22} color="white" />
                </View>
                <Text style={[styles.statNumber, { color: 'white' }]}>5</Text>
                <Text style={[styles.statLabel, { color: 'white' }]}>
                  Doses Tomadas
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* ── Daily Habits ── */}
          <Animated.View entering={FadeInUp.delay(600)} style={{ marginBottom: 20 }}>
            <Text style={styles.sectionLabel}>
              Rotina diária
            </Text>
            <View style={styles.habitsGrid}>
              {HABITS.map((habit) => (
                <TouchableOpacity
                  key={habit.label}
                  style={[styles.habitItem, { backgroundColor: `${habit.color}25` }]}
                  activeOpacity={0.7}
                >
                  <View style={[styles.habitIcon, { backgroundColor: `${habit.color}30` }]}>
                    <habit.icon size={22} color={habit.color} />
                  </View>
                  <Text style={styles.habitLabel}>{habit.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* ── Widget: Insight ── */}
          <Animated.View entering={FadeInUp.delay(700)}>
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
  /* ── iOS Widget Base ── */
  widget: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  widgetContent: {
    padding: 24,
  },
  widgetTitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.95)',
    fontFamily: 'Epilogue_600SemiBold',
    textAlign: 'center',
    marginBottom: 24,
  },
  widgetHeading: {
    fontSize: 17,
    color: '#FFFFFF',
    fontFamily: 'Epilogue_700Bold',
  },
  widgetSubtext: {
    fontSize: 13,
    color: Colors.muted,
    fontFamily: 'Epilogue_400Regular',
    marginTop: 3,
  },

  /* ── Header ── */
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.95)',
    fontFamily: 'Epilogue_600SemiBold',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 20,
  },

  /* ── Mascot Widget ── */
  mascotContainer: {
    width: '100%',
    aspectRatio: 1.1,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: 'rgba(17, 47, 61, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  mascotContent: {
    flex: 1,
    padding: 20,
    paddingTop: 36,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  mascotImageAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(37, 183, 187, 0.35)',
    borderWidth: 1.5,
    borderColor: 'rgba(37, 183, 187, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    width: '100%',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingLeft: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  inputMicBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Migraine Status ── */
  streakCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakNumber: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Epilogue_700Bold',
  },
  accentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 18,
  },
  accentButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Epilogue_700Bold',
    fontSize: 15,
    marginLeft: 8,
  },

  /* ── Stats Grid ── */
  statsGridContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    width: '100%',
  },
  statWidget: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  statCardLeft: {
    marginRight: 12,
  },
  statWidgetContent: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 34,
    fontFamily: 'Epilogue_700Bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontFamily: 'Epilogue_700Bold',
  },

  /* ── Habits ── */
  habitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  habitItem: {
    width: '48%',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 22,
    alignItems: 'center',
    marginBottom: 16,
  },
  habitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  habitLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Epilogue_600SemiBold',
  },

  /* ── Insight ── */
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(37, 183, 187, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
});
