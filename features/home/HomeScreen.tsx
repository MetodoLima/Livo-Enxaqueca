import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import IconBadge from '@/components/ui/IconBadge';
import Screen from '@/components/ui/Screen';
import Text from '@/components/ui/Text';
import TextField from '@/components/ui/TextField';
import { color } from '@/constants/Colors';
import { MoodId } from '@/constants/data';
import { useAuth } from '@/contexts/AuthContext';
import { useCrisis } from '@/contexts/CrisisContext';
import { useSync } from '@/contexts/SyncContext';
import MoodSelector from '@/features/daily-record/MoodSelector';
import { useDailyRecord } from '@/features/daily-record/useDailyRecord';
import CrisisCard, { type EstadoDaCrise } from '@/features/home/components/CrisisCard';
import DayTile from '@/features/home/components/DayTile';
import SleepDialog from '@/features/home/components/SleepDialog';
import WaterDialog from '@/features/home/components/WaterDialog';
import { useVoiceToText } from '@/hooks/useVoiceToText';
import {
  duracaoSono,
  falarDuracaoSono,
  formatHorario,
  formatLitros,
  formatSleep,
  lerHorario,
  tempoSemEnxaqueca,
  toLocalDateString,
  type Horario,
} from '@/lib/format';
import { crisisRepository, dailyRecordRepository, momentRepository, type RegistroDia } from '@/repositories';
import { isSttModelDownloaded, STT_MODEL_SIZE_LABEL } from '@/services/onDeviceComplement';
import { useRouter } from 'expo-router';
import { Bell, CalendarDays, Check, Droplets, Mic, Moon, Send, StopCircle, TrendingDown } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Alert, Image, TouchableOpacity, View } from 'react-native';

const VAO_DOS_CARTOES = 12;

function falarLitros(ml: number): string {
  const texto = formatLitros(ml).replace(' L', '');
  return `${texto} ${texto === '1' ? 'litro' : 'litros'}`;
}

function fmtSecs(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { ultimaAtualizacao } = useSync();
  const { hasActiveCrisis } = useCrisis();
  const today = toLocalDateString(new Date());

  const [selectedMood, setSelectedMood] = useState<MoodId | null>(null);
  const [humorHerdado, setHumorHerdado] = useState<MoodId | null>(null);
  const [relato, setRelato] = useState('');
  const limparAposConfirmacao = useRef(false);

  const [registroDia, setRegistroDia] = useState<RegistroDia | null>(null);
  const [aguaAberta, setAguaAberta] = useState(false);
  const [sonoAberto, setSonoAberto] = useState(false);
  const [larguraDaFileira, setLarguraDaFileira] = useState(0);
  const aguaRef = useRef<View>(null);
  const sonoRef = useRef<View>(null);

  const [ultimoFim, setUltimoFim] = useState<Date | null | undefined>(undefined);
  const [crisesThisMonth, setCrisesThisMonth] = useState<number | null>(null);
  const [avgIntensity, setAvgIntensity] = useState<number | null>(null);

  const { saving, saved, naFila, salvar } = useDailyRecord();
  const savedMessage = naFila ? 'Salvo no aparelho' : 'Enviado';

  const {
    available: voiceAvailable,
    isRecording: isRecordingVoice,
    recordSecs,
    isTranscribing,
    downloadProgress,
    error: voiceError,
    startRecording: startVoiceRecording,
    stopAndTranscribe,
  } = useVoiceToText();

  const handleMicPress = async () => {
    if (isRecordingVoice) {
      const transcript = await stopAndTranscribe();
      if (transcript) {
        setRelato((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript));
      }
      return;
    }

    if (!isSttModelDownloaded()) {
      Alert.alert(
        'Baixar modelo de voz?',
        `A transcrição por voz baixa o modelo Whisper (${STT_MODEL_SIZE_LABEL}) na primeira vez que for usada. Isso pode demorar e consumir dados móveis.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Gravar', onPress: () => startVoiceRecording() },
        ],
      );
      return;
    }

    await startVoiceRecording();
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const lastEnd = await crisisRepository.lastEndedAt();
        if (cancelled) return;
        setUltimoFim(lastEnd);

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

  useEffect(() => {
    let cancelled = false;
    momentRepository
      .ultimoDoDia(today)
      .then((ultimo) => {
        if (cancelled) return;
        const herdado = (ultimo?.humor ?? null) as MoodId | null;
        setHumorHerdado(herdado);
        setSelectedMood(herdado);
      })
      .catch(() => {
        if (cancelled) return;
        setHumorHerdado(null);
        setSelectedMood(null);
      });
    return () => { cancelled = true; };
  }, [today]);

  const carregarRegistroDia = useCallback(async () => {
    try {
      const [registro] = await dailyRecordRepository.listBetween(today, today);
      setRegistroDia(registro ?? null);
    } catch {
      setRegistroDia(null);
    }
  }, [today]);

  useEffect(() => {
    carregarRegistroDia();
  }, [carregarRegistroDia, ultimaAtualizacao]);

  useEffect(() => {
    if (!saved) return;
    AccessibilityInfo.announceForAccessibility(
      naFila
        ? 'Momento salvo no aparelho. Ele será enviado quando houver internet.'
        : 'Momento enviado.',
    );
  }, [saved, naFila]);

  useEffect(() => {
    if (saved || !limparAposConfirmacao.current) return;
    limparAposConfirmacao.current = false;
    setRelato('');
  }, [saved]);

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  const temMudanca =
    relato.trim().length > 0 || (selectedMood !== null && selectedMood !== humorHerdado);

  const handleEnviar = async () => {
    const humorEnviado = selectedMood;
    const gravou = await salvar({ humor: humorEnviado, relato: relato.trim() || null });

    if (!gravou) {
      Alert.alert(
        'Não foi possível salvar agora',
        'O que você preencheu continua aqui. Tente de novo.',
      );
      return;
    }

    setHumorHerdado(humorEnviado);
    limparAposConfirmacao.current = true;
  };

  const salvarDia = async (
    patch: Parameters<typeof dailyRecordRepository.salvarDia>[1],
    anuncio: string,
  ) => {
    try {
      const { enviado } = await dailyRecordRepository.salvarDia(today, patch);
      await carregarRegistroDia();
      AccessibilityInfo.announceForAccessibility(
        enviado ? anuncio : `${anuncio} Salvo no aparelho, será enviado quando houver internet.`,
      );
    } catch {
      Alert.alert('Não foi possível salvar agora', 'Tente de novo em instantes.');
    }
  };

  const confirmarAgua = (ml: number | null) => {
    setAguaAberta(false);
    salvarDia({ mlAgua: ml }, ml === null ? 'Água removida.' : 'Água registrada.');
  };

  const confirmarSono = (dormiAs: Horario, acordeiAs: Horario) => {
    setSonoAberto(false);
    salvarDia(
      { sono: { dormiAs: formatHorario(dormiAs), acordeiAs: formatHorario(acordeiAs) } },
      'Sono registrado.',
    );
  };

  const dormiAs = lerHorario(registroDia?.dormiAs ?? null);
  const acordeiAs = lerHorario(registroDia?.acordeiAs ?? null);
  const temSono = dormiAs !== null && acordeiAs !== null;

  const tempo = ultimoFim ? tempoSemEnxaqueca(ultimoFim) : null;
  const estadoDaCrise: EstadoDaCrise = hasActiveCrisis
    ? { tipo: 'em-andamento' }
    : ultimoFim === null
      ? { tipo: 'sem-crise' }
      : tempo
        ? { tipo: 'tempo', tempo }
        : { tipo: 'desconhecido' };
  const mlAgua = registroDia?.mlAgua ?? null;
  const ladoDoCartao = Math.floor((larguraDaFileira - VAO_DOS_CARTOES) / 2);

  return (
    <Screen scroll>
      <View className="mb-0 mt-4 flex-row items-center justify-between gap-4">
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

      <View>
        <View
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
          className="h-36 items-center"
        >
          <Image
            source={require('../../assets/images/LivoHome.png')}
            accessible={false}
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            className="h-40 w-40"
          />
        </View>
        <Card>
          <Text variant="title" className="text-center">
            Como você está agora?
          </Text>

          <View className="mt-4">
            <MoodSelector
              selected={selectedMood}
              onSelect={(mood) => setSelectedMood(mood === selectedMood ? null : mood)}
            />
          </View>

          <TextField
            label="Relato"
            value={relato}
            onChangeText={setRelato}
            placeholder="O que está acontecendo?"
            multiline
            editable={!isRecordingVoice && !isTranscribing}
            hint={
              isRecordingVoice
                ? `Gravando ${fmtSecs(recordSecs)}`
                : isTranscribing
                  ? downloadProgress != null
                    ? `Baixando modelo de voz... ${Math.round(downloadProgress * 100)}%`
                    : 'Transcrevendo áudio...'
                  : undefined
            }
            error={voiceError ?? undefined}
            className="mt-6"
            accessory={
              voiceAvailable ? (
                <TouchableOpacity
                  onPress={handleMicPress}
                  disabled={isTranscribing}
                  accessibilityRole="button"
                  accessibilityLabel={isRecordingVoice ? 'Parar gravação e transcrever relato' : 'Gravar relato por voz'}
                  accessibilityHint={
                    isRecordingVoice ? undefined : 'Grava sua voz e transcreve automaticamente para o campo de relato'
                  }
                  className={`h-10 w-10 items-center justify-center rounded-full ${isRecordingVoice ? 'bg-danger' : 'bg-primary-subtle'}`}
                >
                  {isTranscribing ? (
                    <ActivityIndicator size="small" color={color.primary} />
                  ) : isRecordingVoice ? (
                    <StopCircle size={20} color="white" />
                  ) : (
                    <Mic size={20} color={color.primary} />
                  )}
                </TouchableOpacity>
              ) : (
                <View
                  importantForAccessibility="no-hide-descendants"
                  accessibilityElementsHidden
                  className="h-10 w-10 items-center justify-center rounded-full bg-primary-subtle"
                >
                  <Mic size={20} color={color.primary} />
                </View>
              )
            }
          />

          <Button
            title={saved ? savedMessage : 'Enviar'}
            variant="secondary"
            icon={saved ? Check : Send}
            loading={saving}
            done={saved}
            disabled={!temMudanca}
            accessibilityHint={
              !saved && !temMudanca ? 'Escolha um humor ou escreva um relato para enviar' : undefined
            }
            onPress={handleEnviar}
            className="mt-8"
          />
        </Card>
      </View>

      <Text variant="heading" className="mt-8">
        Como foi seu dia
      </Text>
      <View
        onLayout={(e) => setLarguraDaFileira(e.nativeEvent.layout.width)}
        className="mt-4 flex-row justify-between"
      >
        {larguraDaFileira > 0 ? (
          <>
            <DayTile
              ref={aguaRef}
              title="Água"
              icon={Droplets}
              value={mlAgua !== null ? formatLitros(mlAgua) : null}
              spokenValue={mlAgua !== null ? falarLitros(mlAgua) : null}
              tone="primary"
              side={ladoDoCartao}
              onPress={() => setAguaAberta(true)}
            />
            <DayTile
              ref={sonoRef}
              title="Sono"
              icon={Moon}
              value={temSono ? formatSleep(duracaoSono(dormiAs, acordeiAs)) : null}
              spokenValue={temSono ? falarDuracaoSono(dormiAs, acordeiAs) : null}
              tone="secondary"
              side={ladoDoCartao}
              onPress={() => setSonoAberto(true)}
            />
          </>
        ) : null}
      </View>

      <View className="mt-6">
        <CrisisCard estado={estadoDaCrise} onRegistrar={() => router.push('/record-crisis')} />
      </View>

      <View className="mt-6 flex-row gap-3">
        <Card className="flex-1 items-center">
          <IconBadge icon={CalendarDays} tone="primary" />
          <Text variant="display" className="mt-2">
            {crisesThisMonth ?? '–'}
          </Text>
          <Text variant="caption" weight="semibold" tone="muted" className="text-center">
            Crises no mês
          </Text>
        </Card>
        <Card className="flex-1 items-center">
          <IconBadge icon={TrendingDown} tone="primary" />
          <Text variant="display" className="mt-2">
            {avgIntensity ?? '–'}
          </Text>
          <Text variant="caption" weight="semibold" tone="muted" className="text-center">
            Intensidade média
          </Text>
        </Card>
      </View>

      <WaterDialog
        visible={aguaAberta}
        current={mlAgua}
        onCancel={() => setAguaAberta(false)}
        onConfirm={confirmarAgua}
        returnFocusTo={aguaRef}
      />
      <SleepDialog
        visible={sonoAberto}
        dormiAs={dormiAs}
        acordeiAs={acordeiAs}
        onCancel={() => setSonoAberto(false)}
        onConfirm={confirmarSono}
        returnFocusTo={sonoRef}
      />
    </Screen>
  );
}
