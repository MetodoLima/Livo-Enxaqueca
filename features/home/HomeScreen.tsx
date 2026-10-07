import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import IconBadge from '@/components/ui/IconBadge';
import LoadingState from '@/components/ui/LoadingState';
import Screen from '@/components/ui/Screen';
import Text from '@/components/ui/Text';
import TextField from '@/components/ui/TextField';
import TimeField from '@/components/ui/TimeField';
import { color } from '@/constants/Colors';
import { MoodId } from '@/constants/data';
import { useAuth } from '@/contexts/AuthContext';
import { useSync } from '@/contexts/SyncContext';
import MoodSelector from '@/features/daily-record/MoodSelector';
import { useDailyRecord } from '@/features/daily-record/useDailyRecord';
import {
  duracaoSono,
  elapsedSince,
  formatSleep,
  formatWater,
  moodLabel,
  toLocalDateString,
  type Horario,
} from '@/lib/format';
import { crisisRepository, dailyRecordRepository, type DailyRecord } from '@/repositories';
import { useRouter } from 'expo-router';
import { Bell, CalendarDays, Check, Droplets, FileText, Mic, Moon, Plus, Send, Smile, TrendingDown } from 'lucide-react-native';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Alert, Image, View } from 'react-native';

const FAIXAS_AGUA = [
  { label: 'Até 1 L', ml: 500 },
  { label: '1 a 2 L', ml: 1500 },
  { label: '2 a 3 L', ml: 2500 },
  { label: '3 a 4 L', ml: 3500 },
  { label: 'Mais de 4 L', ml: 4000 },
] as const;

const DORMIR_INICIAL: Horario = { hora: 23, minuto: 0 };
const ACORDAR_INICIAL: Horario = { hora: 7, minuto: 0 };

type Resumo = Pick<DailyRecord, 'humor' | 'horasSono' | 'mlAgua' | 'relato'>;

function resumir(registros: DailyRecord[]): Resumo {
  const resumo: Resumo = { humor: null, horasSono: null, mlAgua: null, relato: null };
  for (const r of registros) {
    if (r.humor !== null) resumo.humor = r.humor;
    if (r.horasSono !== null) resumo.horasSono = r.horasSono;
    if (r.mlAgua !== null) resumo.mlAgua = r.mlAgua;
    if (r.relato) resumo.relato = r.relato;
  }
  return resumo;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<MoodId | null>(null);
  const [relato, setRelato] = useState('');
  const [dormir, setDormir] = useState<Horario | null>(null);
  const [acordar, setAcordar] = useState<Horario | null>(null);
  const [faixaAgua, setFaixaAgua] = useState<number | null>(null);
  const [registrosHoje, setRegistrosHoje] = useState<DailyRecord[] | null>(null);
  const [acrescentando, setAcrescentando] = useState(false);

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
  const savedMessage = naFila ? 'Salvo no aparelho' : 'Enviado';
  const [aguardandoResumo, setAguardandoResumo] = useState(false);

  const carregarRegistrosHoje = useCallback(async () => {
    try {
      setRegistrosHoje(await dailyRecordRepository.listBetween(today, today));
    } catch {
      setRegistrosHoje([]);
    }
  }, [today]);

  useEffect(() => {
    carregarRegistrosHoje();
  }, [carregarRegistrosHoje, ultimaAtualizacao]);

  useEffect(() => {
    if (saved) AccessibilityInfo.announceForAccessibility(savedMessage);
  }, [saved, savedMessage]);

  useEffect(() => {
    if (!aguardandoResumo || saved) return;
    limparFormulario();
    setAcrescentando(false);
    setAguardandoResumo(false);
  }, [aguardandoResumo, saved]);

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  const horasSono = dormir && acordar ? duracaoSono(dormir, acordar) : null;
  const sonoSuspeito = horasSono !== null && (horasSono < 2 || horasSono > 14);

  const limparFormulario = () => {
    setRelato('');
    setDormir(null);
    setAcordar(null);
    setFaixaAgua(null);
    setSelectedMood(null);
  };

  const handleEnviar = async () => {
    const gravou = await salvar({
      relato: relato.trim() || null,
      horasSono,
      mlAgua: faixaAgua,
      humor: selectedMood,
    });

    if (!gravou) {
      Alert.alert(
        'Não foi possível salvar agora',
        'O que você preencheu continua aqui. Tente de novo quando tiver internet.',
      );
      return;
    }

    setAguardandoResumo(true);
    await carregarRegistrosHoje();
  };

  const temAlgumDado =
    relato.trim().length > 0 ||
    horasSono !== null ||
    faixaAgua !== null ||
    selectedMood !== null;

  const jaRegistrou = (registrosHoje?.length ?? 0) > 0;
  const mostrarResumo = jaRegistrou && !acrescentando && !aguardandoResumo;
  const resumo = registrosHoje ? resumir(registrosHoje) : null;

  return (
    <Screen scroll>
      <View className="mb-0.5 mt-4 flex-row items-center justify-between gap-4">
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
            Como foi seu dia
          </Text>

          {registrosHoje === null ? (
            <LoadingState />
          ) : mostrarResumo && resumo ? (
            <View className="mt-6 gap-4">
              {resumo.humor ? (
                <LinhaResumo icon={<Smile size={18} color={color.primary} />} label="Humor" valor={moodLabel(resumo.humor)} />
              ) : null}
              {resumo.horasSono !== null ? (
                <LinhaResumo icon={<Moon size={18} color={color.secondary} />} label="Sono" valor={formatSleep(resumo.horasSono)} />
              ) : null}
              {resumo.mlAgua !== null ? (
                <LinhaResumo icon={<Droplets size={18} color={color.primary} />} label="Água" valor={formatWater(resumo.mlAgua)} />
              ) : null}
              {resumo.relato ? (
                <View className="gap-1">
                  <View className="flex-row items-center gap-2">
                    <FileText size={18} color={color.contentMuted} />
                    <Text weight="semibold">Relato</Text>
                  </View>
                  <Text tone="muted" numberOfLines={3}>
                    {resumo.relato}
                  </Text>
                </View>
              ) : null}
              <Button
                title="Acrescentar"
                variant="secondary"
                icon={Plus}
                onPress={() => setAcrescentando(true)}
                className="mt-2"
              />
            </View>
          ) : (
            <>
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
                placeholder="O que aconteceu hoje?"
                multiline
                className="mt-6"
                accessory={
                  <View
                    importantForAccessibility="no-hide-descendants"
                    accessibilityElementsHidden
                    className="h-10 w-10 items-center justify-center rounded-full bg-primary-subtle"
                  >
                    <Mic size={20} color={color.primary} />
                  </View>
                }
              />

              <View className="mt-6 gap-3">
                <View className="flex-row items-center gap-2">
                  <Moon size={18} color={color.secondary} />
                  <Text weight="semibold">Sono</Text>
                </View>
                <View className="flex-row gap-3">
                  <TimeField label="Dormi às" value={dormir} onChange={setDormir} initial={DORMIR_INICIAL} className="flex-1" />
                  <TimeField label="Acordei às" value={acordar} onChange={setAcordar} initial={ACORDAR_INICIAL} className="flex-1" />
                </View>
                {horasSono !== null ? (
                  <Text weight="semibold" tone="secondary">
                    Você dormiu {formatSleep(horasSono)}
                  </Text>
                ) : null}
                {sonoSuspeito && horasSono !== null ? (
                  <Text variant="caption" tone="attention">
                    Confira os horários: isso dá {formatSleep(horasSono)} de sono.
                  </Text>
                ) : null}
              </View>

              <View className="mt-6 gap-3">
                <View className="flex-row items-center gap-2">
                  <Droplets size={18} color={color.primary} />
                  <Text weight="semibold">Água</Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {FAIXAS_AGUA.map((faixa) => (
                    <Chip
                      key={faixa.ml}
                      label={faixa.label}
                      tone="primary"
                      selected={faixaAgua === faixa.ml}
                      onPress={() => setFaixaAgua(faixaAgua === faixa.ml ? null : faixa.ml)}
                    />
                  ))}
                </View>
              </View>

              <Button
                title={saved ? savedMessage : 'Enviar'}
                variant="secondary"
                icon={saved ? Check : Send}
                loading={saving}
                done={saved}
                disabled={!temAlgumDado}
                onPress={handleEnviar}
                className="mt-8"
              />
              {jaRegistrou && !aguardandoResumo ? (
                <Button
                  title="Cancelar"
                  variant="ghost"
                  size="md"
                  onPress={() => {
                    limparFormulario();
                    setAcrescentando(false);
                  }}
                  className="mt-2"
                />
              ) : null}
            </>
          )}
        </Card>
      </View>

      <Card className="mt-6">
        <View className="flex-row flex-wrap items-baseline gap-2">
          <Text variant="display">{streakInfo?.number ?? '–'}</Text>
          <Text variant="caption" tone="muted">
            {streakInfo ? streakInfo.label : 'Nenhuma crise registrada'}
          </Text>
        </View>
        <Button
          title="Registrar Crise"
          onPress={() => router.push('/record-crisis')}
          className="mt-4"
        />
      </Card>

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
    </Screen>
  );
}

interface LinhaResumoProps {
  icon: ReactNode;
  label: string;
  valor: string;
}

function LinhaResumo({ icon, label, valor }: LinhaResumoProps) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <View className="flex-row items-center gap-2">
        {icon}
        <Text weight="semibold">{label}</Text>
      </View>
      <Text tone="muted">{valor}</Text>
    </View>
  );
}
