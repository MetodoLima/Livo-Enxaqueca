import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { User, ChevronRight, Shield, Moon as MoonIcon, Bell as BellIcon, FileText, LogOut } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Card from '@/components/Card';
import { Colors } from '@/constants/Colors';

const menuItems = [
  { icon: Shield, label: 'Dados de saúde', desc: 'Perfil médico e alergias' },
  { icon: MoonIcon, label: 'Preferências', desc: 'Tema, notificações, idioma' },
  { icon: BellIcon, label: 'Lembretes', desc: 'Medicações e hidratação' },
  { icon: FileText, label: 'Exportar dados', desc: 'PDF para seu médico' },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 160, paddingHorizontal: 24, paddingTop: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp} className="mb-8">
          <Text className="text-[28px] text-white font-epilogue-light">
            Seu <Text className="font-epilogue-bold">Perfil</Text>
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100)}>
          <Card className="flex-row items-center mb-8">
            <View className="w-16 h-16 rounded-full bg-accent items-center justify-center mr-4">
              <User size={32} color="white" />
            </View>
            <View>
              <Text className="text-xl text-white font-epilogue-bold">Diego</Text>
              <Text className="text-xs text-muted font-epilogue">Membro desde Mar 2026</Text>
              <Text className="text-xs text-accent mt-1 font-epilogue-bold">Plano Premium ✨</Text>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)} className="gap-3">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              className="flex-row items-center bg-slate-800 p-4 rounded-2xl"
            >
              <View className="w-12 h-12 rounded-xl bg-accent/10 items-center justify-center mr-4">
                <item.icon size={20} color={Colors.accent} />
              </View>
              <View className="flex-1">
                <Text className="text-white font-epilogue-semi">{item.label}</Text>
                <Text className="text-[11px] text-muted font-epilogue">{item.desc}</Text>
              </View>
              <ChevronRight size={18} color={Colors.muted} />
            </TouchableOpacity>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)} className="mt-8 mb-10">
          <TouchableOpacity className="flex-row items-center justify-center gap-2 py-4">
            <LogOut size={20} color="#EF4444" />
            <Text className="text-red-500 font-epilogue-bold">Sair da conta</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
