import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight as ArrowRight, Clock } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { CrisisDay } from '@/features/crisis/useCrisisCalendar';
import { formatDuration, formatTime, intensityColor, intensityLabel } from '@/lib/format';

export default function CrisisListItem({ crisis, index }: { crisis: CrisisDay; index: number }) {
  const router = useRouter();
  const color = intensityColor(crisis.intensidadeDor);
  const label = intensityLabel(crisis.intensidadeDor);
  const duration = formatDuration(crisis.inicioCrise, crisis.fimCrise);

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(250)}>
      <TouchableOpacity
        onPress={() => router.push({
          pathname: '/crisis/[id]',
          params: {
            id: String(crisis.id),
            data: JSON.stringify({
              ...crisis,
              inicioCrise: crisis.inicioCrise.toISOString(),
              fimCrise: crisis.fimCrise ? crisis.fimCrise.toISOString() : null,
            }),
          },
        })}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: '#112236', borderRadius: 16,
          marginBottom: 10, padding: 16,
          borderLeftWidth: 3, borderLeftColor: color,
        }}
      >
        <View style={{ marginRight: 14 }}>
          <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 11 }}>INÍCIO</Text>
          <Text style={{ color: 'white', fontFamily: 'Epilogue_700Bold', fontSize: 15, marginTop: 2 }}>
            {formatTime(crisis.inicioCrise)}
          </Text>
        </View>
        <View style={{ width: 1, height: 36, backgroundColor: '#1E3A52', marginRight: 14 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color, fontFamily: 'Epilogue_700Bold', fontSize: 14 }}>
            {crisis.intensidadeDor !== null ? `${crisis.intensidadeDor}/10` : '—'}{' '}
            <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 12 }}>{label}</Text>
          </Text>
          <Text style={{ color: Colors.muted, fontFamily: 'Epilogue_400Regular', fontSize: 12, marginTop: 3 }}>
            {duration}
            {crisis.sintomas.length > 0 && ` · ${crisis.sintomas.length} sintoma${crisis.sintomas.length > 1 ? 's' : ''}`}
          </Text>
        </View>
        {!crisis.enviado && (
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
