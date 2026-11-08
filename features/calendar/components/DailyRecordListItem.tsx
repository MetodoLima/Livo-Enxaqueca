import { ChevronRight, Clock } from 'lucide-react-native';
import { Image, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import { color } from '@/constants/Colors';
import { MOODS } from '@/constants/data';
import type { RegistroCalendarDay } from '@/features/daily-record/useDailyRecordCalendar';
import { formatLitros, formatSleep, moodLabel } from '@/lib/format';

export default function DailyRecordListItem({ registro, index }: { registro: RegistroCalendarDay; index: number }) {
  const router = useRouter();
  const hora = new Date(registro.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const rotina = [
    registro.horasSono !== null && `${formatSleep(registro.horasSono)} sono`,
    registro.mlAgua !== null && `${formatLitros(registro.mlAgua)} água`,
  ]
    .filter(Boolean)
    .join(' · ');
  const primeiraLinhaDoRelato = registro.relato?.trim().split('\n')[0] || null;
  const humor = registro.humor ? MOODS.find((m) => m.id === registro.humor) : undefined;
  const texto = primeiraLinhaDoRelato ?? (registro.humor ? moodLabel(registro.humor) : null) ?? rotina;

  const rotulo = [
    `Evento às ${hora}`,
    registro.humor ? `humor ${moodLabel(registro.humor)}` : '',
    primeiraLinhaDoRelato ?? '',
    rotina,
    !registro.enviado ? 'ainda não enviado, guardado neste aparelho' : '',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(250)}>
      <Card
        padding="sm"
        accessibilityLabel={rotulo}
        onPress={() =>
          router.push({
            pathname: '/daily-record/[id]',
            params: {
              id: String(registro.id),
              data: JSON.stringify(registro),
            },
          })
        }
      >
        <View className="flex-row items-center gap-3">
          <View>
            <Text variant="caption" tone="muted">
              Hora
            </Text>
            <Text variant="heading">{hora}</Text>
          </View>
          {humor ? (
            <Image source={humor.image} className="h-8 w-8" resizeMode="contain" accessibilityIgnoresInvertColors />
          ) : null}
          <Text numberOfLines={2} className="flex-1">
            {texto}
          </Text>
          {!registro.enviado ? <Clock size={20} color={color.attention} /> : null}
          <ChevronRight size={20} color={color.contentMuted} />
        </View>
      </Card>
    </Animated.View>
  );
}
