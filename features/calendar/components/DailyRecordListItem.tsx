import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight as ArrowRight, Clock } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { RegistroCalendarDay } from '@/features/daily-record/useDailyRecordCalendar';
import { formatLitros, formatSleep, moodEmoji, moodLabel } from '@/lib/format';

export default function DailyRecordListItem({ registro, index }: { registro: RegistroCalendarDay; index: number }) {
  const router = useRouter();
  const hora = new Date(registro.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const rotina = [
    registro.horasSono !== null && `${formatSleep(registro.horasSono)} sono`,
    registro.mlAgua !== null && `${formatLitros(registro.mlAgua)} água`,
  ].filter(Boolean).join(' · ');
  const primeiraLinhaDoRelato = registro.relato?.trim().split('\n')[0] || null;

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(250)}>
      <TouchableOpacity
        onPress={() => router.push({
          pathname: '/daily-record/[id]',
          params: {
            id: String(registro.id),
            data: JSON.stringify(registro),
          },
        })}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: '#112236', borderRadius: 16,
          marginBottom: 10, padding: 16,
          borderLeftWidth: 3, borderLeftColor: Colors.accent,
        }}
      >
        <View style={{ marginRight: 14 }}>
          <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 11 }}>HORA</Text>
          <Text style={{ color: 'white', fontFamily: 'Epilogue_700Bold', fontSize: 15, marginTop: 2 }}>
            {hora}
          </Text>
        </View>

        <View style={{ width: 1, height: 36, backgroundColor: '#1E3A52', marginRight: 14 }} />

        <View style={{ flex: 1 }}>
          {registro.humor ? (
            <Text style={{ color: 'white', fontFamily: 'Epilogue_700Bold', fontSize: 14 }}>
              {moodEmoji(registro.humor)}{' '}
              <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 12 }}>
                {moodLabel(registro.humor)}
              </Text>
            </Text>
          ) : primeiraLinhaDoRelato ? (
            <Text numberOfLines={1} style={{ color: 'white', fontFamily: 'Epilogue_400Regular', fontSize: 14 }}>
              {primeiraLinhaDoRelato}
            </Text>
          ) : null}
          {rotina ? (
            <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 12, marginTop: registro.humor || primeiraLinhaDoRelato ? 3 : 0 }}>
              {rotina}
            </Text>
          ) : null}
        </View>

        {!registro.enviado && (
          <Clock
            size={14}
            color={Colors.muted}
            style={{ marginRight: 8 }}
            accessibilityLabel="Ainda não enviado, guardado neste aparelho"
          />
        )}
        <ArrowRight size={16} color={Colors.muted} />
      </TouchableOpacity>
    </Animated.View>
  );
}
