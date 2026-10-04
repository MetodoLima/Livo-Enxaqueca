import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { Activity, Bell, Check, Droplets, Mic, Moon, Send, TrendingDown, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Alert, Image, View } from 'react-native';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import IconBadge from '@/components/ui/IconBadge';
import Screen from '@/components/ui/Screen';
import SectionDivider from '@/components/ui/SectionDivider';
import Text from '@/components/ui/Text';
import TextField from '@/components/ui/TextField';
import { color } from '@/constants/Colors';
import { MoodId } from '@/constants/data';
import { useAuth } from '@/contexts/AuthContext';
import { useSync } from '@/contexts/SyncContext';
import MoodSelector from '@/features/daily-record/MoodSelector';
import { useDailyRecord } from '@/features/daily-record/useDailyRecord';
import { elapsedSince, formatSleep, formatWater, toLocalDateString } from '@/lib/format';
import { crisisRepository } from '@/repositories';

const SLEEP_TICKS = ['0h', '4h', '8h', '12h', '16h+'];
const WATER_TICKS = ['0', '1L', '2L', '3L', '4L+'];

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<MoodId | null>(null);
  const [relato, setRelato] = useState('');
  const [sonoLocal, setSonoLocal] = useState(0);
  const [aguaLocal, setAguaLocal] = useState(0);

  const { ultimaAtualizacao } = useSync();
  const [streakInfo, setStreakInfo] = useState<{ number: string; label: string } | null>(null);
  const [crisesThisMonth, setCrisesThisMonth] = useState<number | null>(null);
  const [avgIntensity, setAvgIntensity] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const lastEnd = await crisisRepository.lastEndedAt();
        if (cancelled) return;
        if (lastEnd) {
          const { value, unit } = elapsedSince(lastEnd);
          setStreakInfo({ number: String(value), label: `${unit} sem crises` });
        }

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const count = await crisisRepository.countSince(monthStart);
        if (!cancelled) setCrisesThisMonth(count);

        const intensidades = await crisisRepository.intensities();
        if (!cancelled && intensidades.length > 0) {
          const soma = intensidades.reduce((a, b) => a + b, 0);
          setAvgIntensity(Math.round((soma / intensidades.length) * 10) / 10);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [ultimaAtualizacao]);

  const today = toLocalDateString(new Date());
  const { saving, saved, naFila, salvar } = useDailyRecord(today);
  const savedMessage = naFila ? 'Salvo no aparelho' : 'Registrado!';

  useEffect(() => {
    if (saved) AccessibilityInfo.announceForAccessibility(savedMessage);
  }, [saved, savedMessage]);

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  const handleRegistrar = async () => {
    const gravou = await salvar({
      relato: relato.trim() || null,
      horasSono: sonoLocal > 0 ? sonoLocal : null,
      mlAgua: aguaLocal > 0 ? aguaLocal : null,
      humor: selectedMood,
    });

    if (!gravou) {
      Alert.alert(
        'Não foi possível salvar agora',
        'O que você preencheu continua aqui. Tente de novo quando tiver internet.',
      );
      return;
    }

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
    <Screen scroll>
      <View className="mb-8 mt-4 flex-row items-center justify-between gap-4">
        <View className="flex-1">
          <Text variant="heading" weight="regular" tone="muted" accessibilityRole="text">
            {greeting},
          </Text>
          <Text variant="title">
            {user?.user_metadata?.name ? `${user.user_metadata.name}!` : 'Visitante!'}
          </Text>
        </View>
        <View
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          className="h-12 w-12 items-center justify-center rounded-full bg-surface-raised"
        >
          <Bell size={22} color={color.contentMuted} />
        </View>
      </View>

      <Text variant="heading" className="mb-4 text-center">
        Como você está hoje?
      </Text>
      <MoodSelector
        selected={selectedMood}
        onSelect={(mood) => setSelectedMood(mood === selectedMood ? null : mood)}
      />

      <Card className="mt-8">
        <Image
          source={require('../../assets/images/IA-Livo.webp')}
          className="h-48 w-full rounded-md"
          resizeMode="cover"
          accessible={false}
          accessibilityIgnoresInvertColors
        />
        <Text variant="title" className="mt-4 text-center">
          Registre um evento
        </Text>
        <View className="mt-4 items-center">
          <View
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
            className="h-20 w-20 items-center justify-center rounded-full border border-primary bg-primary-subtle"
          >
            <Mic size={28} color={color.primary} />
          </View>
        </View>
        <TextField
          label="Relato"
          value={relato}
          onChangeText={setRelato}
          placeholder="O que aconteceu hoje?"
          multiline
          className="mt-4"
        />

        <SectionDivider label="Rotina de hoje" className="mb-4 mt-6" />

        <View className="mb-4">
          <View className="mb-1 flex-row items-center justify-between gap-3">
            <View className="flex-row items-center gap-2">
              <Moon size={18} color={color.secondary} />
              <Text weight="semibold">Sono</Text>
            </View>
            <Text weight="semibold" tone={sonoLocal > 0 ? 'secondary' : 'muted'}>
              {sonoLocal > 0 ? formatSleep(sonoLocal) : 'Não registrado'}
            </Text>
          </View>
          <Slider
            accessibilityLabel="Horas de sono"
            style={{ width: '100%', height: 48 }}
            minimumValue={0}
            maximumValue={16}
            step={0.5}
            value={sonoLocal}
            onValueChange={(v) => setSonoLocal(Math.round(v * 2) / 2)}
            minimumTrackTintColor={color.secondary}
            maximumTrackTintColor={color.line}
            thumbTintColor={color.secondary}
          />
          <View className="flex-row justify-between px-1">
            {SLEEP_TICKS.map((t) => (
              <Text key={t} variant="caption" tone="muted">
                {t}
              </Text>
            ))}
          </View>
        </View>

        <View className="mb-4">
          <View className="mb-1 flex-row items-center justify-between gap-3">
            <View className="flex-row items-center gap-2">
              <Droplets size={18} color={color.primary} />
              <Text weight="semibold">Água</Text>
            </View>
            <Text weight="semibold" tone={aguaLocal > 0 ? 'primary' : 'muted'}>
              {aguaLocal > 0 ? formatWater(aguaLocal) : 'Não registrado'}
            </Text>
          </View>
          <Slider
            accessibilityLabel="Água bebida"
            style={{ width: '100%', height: 48 }}
            minimumValue={0}
            maximumValue={4000}
            step={100}
            value={aguaLocal}
            onValueChange={(v) => setAguaLocal(Math.round(v / 100) * 100)}
            minimumTrackTintColor={color.primary}
            maximumTrackTintColor={color.line}
            thumbTintColor={color.primary}
          />
          <View className="flex-row justify-between px-1">
            {WATER_TICKS.map((t) => (
              <Text key={t} variant="caption" tone="muted">
                {t}
              </Text>
            ))}
          </View>
        </View>

        <Button
          title="Registrar"
          variant="secondary"
          icon={Send}
          loading={saving}
          disabled={!temAlgumDado}
          onPress={handleRegistrar}
          className="mt-2"
        />
        {saved ? (
          <View className="mt-3 flex-row items-center justify-center gap-2">
            <Check size={18} color={color.success} />
            <Text weight="semibold" tone="success">
              {savedMessage}
            </Text>
          </View>
        ) : null}
      </Card>

      <Card className="mt-6">
        <View className="flex-row items-center gap-4">
          <View className="min-h-14 min-w-14 items-center justify-center rounded-full border-2 border-primary px-2">
            <Text variant="heading" weight="bold">
              {streakInfo?.number ?? '–'}
            </Text>
          </View>
          <View className="flex-1">
            <Text variant="heading">Sem enxaqueca</Text>
            <Text variant="caption" tone="muted" className="mt-1">
              {streakInfo ? streakInfo.label : 'Nenhuma crise registrada'}
            </Text>
          </View>
        </View>
        <Button
          title="Registrar Crise"
          icon={Zap}
          onPress={() => router.push('/record-crisis')}
          className="mt-4"
        />
      </Card>

      <View className="mt-6 flex-row gap-3">
        <Card className="flex-1 items-center">
          <IconBadge icon={Activity} tone="primary" />
          <Text variant="display" className="mt-2">
            {crisesThisMonth ?? '–'}
          </Text>
          <Text variant="caption" weight="semibold" tone="muted" className="text-center">
            Crises Mês
          </Text>
        </Card>
        <Card className="flex-1 items-center">
          <IconBadge icon={TrendingDown} tone="primary" />
          <Text variant="display" className="mt-2">
            {avgIntensity ?? '–'}
          </Text>
          <Text variant="caption" weight="semibold" tone="muted" className="text-center">
            Intensidade Média
          </Text>
        </Card>
      </View>
    </Screen>
  );
}
