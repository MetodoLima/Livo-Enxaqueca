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
  Search,
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Link } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { HABITS, MoodId } from '@/constants/data';
import MoodSelector from '@/components/MoodSelector';
import Card from '@/components/Card';

export default function HomeScreen() {
  const [selectedMood, setSelectedMood] = useState<MoodId | null>(null);

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 24, paddingTop: 40 }}>

          {/* ── Header ── */}
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-[32px] text-white font-epilogue-light">
                {greeting},
              </Text>
              <Text className="text-[32px] text-white font-epilogue-bold">
                Diego!
              </Text>
            </View>
            <TouchableOpacity className="w-12 h-12 rounded-full bg-white/5 items-center justify-center">
              <Search size={24} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          {/* ── Mood Selector ── */}
          <Animated.View entering={FadeInUp.delay(100)} className="mb-8">
            <Text className="text-[20px] text-white font-epilogue-semi mb-6 text-center">
              Como você está hoje?
            </Text>
            <MoodSelector selected={selectedMood} onSelect={setSelectedMood} />
          </Animated.View>

          {/* ── AI Assistant Card (Mascote) ── */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.mascotContainer}>
            <View style={styles.mascotContent}>
              <Image
                source={require('../../assets/images/IA-Livo.webp')}
                style={styles.mascotImageAbsolute}
                resizeMode="cover"
              />
              
              {/* Top Text */}
              <Text className="text-white text-lg font-epilogue-bold text-center shadow-lg">
                Como posso ajudar?
              </Text>

              {/* Center Mic Button */}
              <TouchableOpacity style={styles.micButton}>
                <Mic size={28} color="white" />
              </TouchableOpacity>

              {/* Bottom Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Pergunte ao Livo..."
                  placeholderTextColor={Colors.muted}
                  style={{ flex: 1, color: 'white', fontFamily: 'Epilogue_400Regular', fontSize: 14 }}
                />
                <TouchableOpacity className="w-8 h-8 rounded-full bg-accent items-center justify-center">
                  <Mic size={14} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {/* ── Migraine Status ── */}
          <Card className="mb-8">
            <Animated.View entering={FadeInUp.delay(300)}>
              <View className="flex-row items-center">
                <View
                  className="w-14 h-14 rounded-full items-center justify-center mr-4"
                  style={{ borderWidth: 4, borderColor: Colors.accent }}
                >
                  <Text className="text-lg text-white font-epilogue-bold">3</Text>
                </View>
                <View>
                  <Text className="text-lg text-white font-epilogue-bold">Sem enxaqueca</Text>
                  <Text className="text-muted text-sm font-epilogue">3 dias consecutivos sem crises</Text>
                </View>
              </View>
              <Link href="/record-crisis" asChild>
                <TouchableOpacity className="mt-6 bg-accent py-4 rounded-2xl flex-row items-center justify-center">
                  <Zap size={18} color="white" fill="white" />
                  <Text className="text-white ml-2 font-epilogue-bold">Registrar Crise</Text>
                </TouchableOpacity>
              </Link>
            </Animated.View>
          </Card>

          {/* ── Stats Grid ── */}
          <View style={styles.statsGridContainer}>
            <Animated.View 
              entering={FadeInUp.delay(400)} 
              style={[styles.statCard, styles.statCardLeft, { backgroundColor: 'rgba(139, 111, 192, 0.08)' }]}
            >
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(139, 111, 192, 0.15)' }]}>
                <Activity size={24} color={Colors.purple} />
              </View>
              <Text style={[styles.statNumber, { color: Colors.purple }]}>2</Text>
              <Text style={[styles.statLabel, { color: Colors.purple }]}>
                Crises Mês
              </Text>
            </Animated.View>
            
            <Animated.View 
              entering={FadeInUp.delay(500)} 
              style={[styles.statCard, { backgroundColor: 'rgba(232, 144, 79, 0.08)' }]}
            >
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(232, 144, 79, 0.15)' }]}>
                <Sparkles size={24} color={Colors.orange} />
              </View>
              <Text style={[styles.statNumber, { color: Colors.orange }]}>5</Text>
              <Text style={[styles.statLabel, { color: Colors.orange }]}>
                Doses Tomadas
              </Text>
            </Animated.View>
          </View>

          {/* ── Daily Habits ── */}
          <View className="mb-8">
            <Animated.View entering={FadeInUp.delay(600)}>
              <Text className="text-lg text-center mb-4 text-white font-epilogue-bold">
                Rotina diária
              </Text>
              <View className="flex-row flex-wrap justify-between">
                {HABITS.map((habit) => (
                  <TouchableOpacity
                    key={habit.label}
                    className="w-[48%] p-4 rounded-[24px] items-center mb-4 border border-slate-700/40"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)' }}
                  >
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mb-2"
                      style={{ backgroundColor: `${habit.color}20` }}
                    >
                      <habit.icon size={20} color={habit.color} />
                    </View>
                    <Text className="text-sm text-white font-epilogue-semi">{habit.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </View>

          {/* ── Insight ── */}
          <Animated.View entering={FadeInUp.delay(700)}>
            <Card>
              <TouchableOpacity className="flex-row items-center">
                <View className="w-14 h-14 bg-accent/10 rounded-2xl items-center justify-center mr-4">
                  <Text className="text-2xl">💡</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-epilogue-semi">Padrão detectado</Text>
                  <Text className="text-muted text-sm font-epilogue">
                    Dormir antes das 23h evitou crises matinais.
                  </Text>
                </View>
                <ChevronRight size={20} color={Colors.muted} />
              </TouchableOpacity>
            </Card>
          </Animated.View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mascotContainer: {
    width: '100%',
    aspectRatio: 1.1,
    borderRadius: 32,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 32,
    backgroundColor: '#112F3D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
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
    opacity: 0.8,
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(37, 183, 187, 0.4)',
    borderWidth: 2,
    borderColor: '#25B7BB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    width: '100%',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingLeft: 16,
    backgroundColor: 'rgba(11, 33, 45, 0.8)',
  },
  statsGridContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    width: '100%',
  },
  statCard: {
    width: '47%',
    aspectRatio: 1,
    padding: 16,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardLeft: {
    marginRight: '6%',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 36,
    fontFamily: 'Epilogue_700Bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontFamily: 'Epilogue_700Bold',
  },
});
