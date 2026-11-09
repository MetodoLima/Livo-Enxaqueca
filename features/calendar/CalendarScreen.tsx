import { useState, useCallback } from 'react';
import { View, LayoutAnimation, Platform, UIManager } from 'react-native';
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import IconButton from '@/components/ui/IconButton';
import LoadingState from '@/components/ui/LoadingState';
import Notice from '@/components/ui/Notice';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Text from '@/components/ui/Text';
import { useCrisisCalendar } from '@/features/crisis/useCrisisCalendar';
import { useDailyRecordCalendar } from '@/features/daily-record/useDailyRecordCalendar';
import type { CalendarTab, TimelineEntry } from '@/features/calendar/types';
import StuckQueueNotice from '@/features/calendar/components/StuckQueueNotice';
import CrisisListItem from '@/features/calendar/components/CrisisListItem';
import DailyRecordListItem from '@/features/calendar/components/DailyRecordListItem';
import CalendarTabBar from '@/features/calendar/components/CalendarTabBar';
import CalendarDay from '@/features/calendar/components/CalendarDay';
import TimelineItem from '@/features/calendar/components/TimelineItem';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const contar = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`;

function DiaVazio({ texto }: { texto: string }) {
  return (
    <Card padding="sm">
      <Text tone="muted" className="text-center">
        {texto}
      </Text>
    </Card>
  );
}

function Numero({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <View className="flex-1 gap-1" accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <Text variant="title" className="text-center">
        {valor}
      </Text>
      <Text variant="caption" tone="muted" className="text-center">
        {rotulo}
      </Text>
    </View>
  );
}

export default function CalendarScreen() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<CalendarTab>('todos');

  const { crisisByDay, loading: loadingCrises, error: errorCrises } = useCrisisCalendar(year, month);
  const { registroByDay, loading: loadingRegistro, error: errorRegistro } = useDailyRecordCalendar(year, month);

  const loading = loadingCrises || loadingRegistro;
  const error = errorCrises || errorRegistro;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const nomeDoMes = MONTH_NAMES[month].toLowerCase();

  const goToPrevMonth = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDay(null);
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }, [month]);

  const goToNextMonth = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDay(null);
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }, [month]);

  const handleDayPress = useCallback((day: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDay((prev) => (prev === day ? null : day));
    setActiveTab('todos');
  }, []);

  const selectedCrises = selectedDay ? (crisisByDay[selectedDay] ?? []) : [];
  const selectedRegistros = selectedDay ? (registroByDay[selectedDay] ?? []) : [];
  const hasCrises = selectedCrises.length > 0;
  const hasRegistro = selectedRegistros.length > 0;

  const timeline: TimelineEntry[] = [];
  selectedCrises.forEach((c) => timeline.push({ type: 'crise', time: c.inicioCrise, data: c }));
  selectedRegistros.forEach((r) => timeline.push({ type: 'registro', time: new Date(r.createdAt), data: r }));
  timeline.sort((a, b) => a.time.getTime() - b.time.getTime());

  const totalCrises = Object.values(crisisByDay).reduce((acc, arr) => acc + arr.length, 0);
  const criseDays = Object.keys(crisisByDay).length;
  const avgIntensity = (() => {
    const all = Object.values(crisisByDay).flat().map((c) => c.intensidadeDor).filter((i): i is number => i !== null);
    if (all.length === 0) return null;
    return (all.reduce((a, b) => a + b, 0) / all.length).toFixed(1);
  })();

  const celulas: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (celulas.length % 7 !== 0) celulas.push(null);
  const semanas = Array.from({ length: celulas.length / 7 }, (_, i) => celulas.slice(i * 7, i * 7 + 7));

  const resumoDoDia = [
    hasCrises ? contar(selectedCrises.length, 'crise', 'crises') : '',
    hasRegistro ? contar(selectedRegistros.length, 'evento', 'eventos') : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Screen scroll>
      <ScreenHeader title="Histórico" subtitle="Consulte suas crises e eventos registrados em cada dia." />

      <View className="gap-6">
        <StuckQueueNotice />

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <IconButton icon={ChevronLeft} accessibilityLabel="Mês anterior" tone="content" filled onPress={goToPrevMonth} />
            <Text variant="heading" className="flex-1 text-center" accessibilityLiveRegion="polite">
              {MONTH_NAMES[month]} {year}
            </Text>
            <IconButton icon={ChevronRight} accessibilityLabel="Próximo mês" tone="content" filled onPress={goToNextMonth} />
          </View>

          <View className="flex-row" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {WEEKDAYS.map((d, i) => (
              <Text key={i} variant="caption" weight="semibold" tone="muted" className="flex-1 text-center">
                {d}
              </Text>
            ))}
          </View>

          {loading ? (
            <LoadingState label="Carregando o mês…" />
          ) : (
            <View className="gap-1">
              {semanas.map((semana, s) => (
                <View key={s} className="flex-row">
                  {semana.map((day, i) => {
                    if (day === null) return <View key={`vazio-${s}-${i}`} className="min-h-11 flex-1" />;

                    const crises = crisisByDay[day] ?? [];
                    const eventos = registroByDay[day]?.length ?? 0;
                    const dorMaxima = crises.length > 0 ? Math.max(...crises.map((c) => c.intensidadeDor ?? 0)) : null;
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                    const rotulo = [
                      `${day} de ${nomeDoMes}`,
                      crises.length > 0 ? contar(crises.length, 'crise', 'crises') : '',
                      dorMaxima !== null ? `dor máxima ${dorMaxima}` : '',
                      eventos > 0 ? contar(eventos, 'evento', 'eventos') : '',
                      isToday ? 'hoje' : '',
                    ]
                      .filter(Boolean)
                      .join(', ');

                    return (
                      <CalendarDay
                        key={day}
                        day={day}
                        accessibilityLabel={rotulo}
                        crises={crises.length}
                        dorMaxima={dorMaxima}
                        temEvento={eventos > 0}
                        hoje={isToday}
                        selecionado={selectedDay === day}
                        onPress={() => handleDayPress(day)}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          )}

          <View className="flex-row flex-wrap items-center justify-center gap-4 pt-2">
            <View className="flex-row items-center gap-1">
              <View className="h-1.5 w-1.5 rounded-full bg-pain-6" />
              <Text variant="caption" tone="muted">
                Crise (cor = intensidade)
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="h-1.5 w-1.5 bg-secondary" />
              <Text variant="caption" tone="muted">
                Evento
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <View className="h-2.5 w-2.5 rounded-sm border-[1.5px] border-line-strong" />
              <Text variant="caption" tone="muted">
                Hoje
              </Text>
            </View>
          </View>
        </View>

        {error ? (
          <Notice icon={AlertCircle} tone="danger">
            Não foi possível carregar este mês. Verifique a conexão e tente de novo.
          </Notice>
        ) : null}

        {selectedDay !== null ? (
          <View className="gap-3">
            <View className="gap-1">
              <Text variant="heading">
                Detalhes do dia · {selectedDay} de {nomeDoMes}
              </Text>
              {resumoDoDia ? (
                <Text variant="caption" tone="muted">
                  {resumoDoDia}
                </Text>
              ) : null}
            </View>

            {hasCrises || hasRegistro ? <CalendarTabBar active={activeTab} onChange={setActiveTab} /> : null}

            {!hasCrises && !hasRegistro ? (
              <DiaVazio texto="Sem dados neste dia" />
            ) : activeTab === 'todos' ? (
              timeline.map((entry, i) => <TimelineItem key={`${entry.type}-${i}`} entry={entry} index={i} />)
            ) : activeTab === 'crises' ? (
              hasCrises ? (
                selectedCrises.map((crisis, i) => <CrisisListItem key={crisis.id} crisis={crisis} index={i} />)
              ) : (
                <DiaVazio texto="Nenhuma crise neste dia" />
              )
            ) : hasRegistro ? (
              selectedRegistros.map((r, i) => <DailyRecordListItem key={r.id} registro={r} index={i} />)
            ) : (
              <DiaVazio texto="Nenhum evento registrado neste dia" />
            )}
          </View>
        ) : null}

        {!loading && totalCrises > 0 ? (
          <View>
            <Card padding="sm" className="gap-3">
              <Text variant="heading">Resumo do mês</Text>
              <View className="flex-row gap-3">
                <Numero valor={String(totalCrises)} rotulo="Número de crises" />
                <Numero valor={String(criseDays)} rotulo="Número de dias afetados" />
                {avgIntensity !== null ? (
                  <Numero valor={avgIntensity.replace('.', ',')} rotulo="intensidade média das crises" />
                ) : null}
              </View>
            </Card>
          </View>
        ) : null}

        {!loading && !error && totalCrises === 0 && Object.keys(registroByDay).length === 0 && selectedDay === null ? (
          <View>
            <Card padding="sm">
              <EmptyState
                icon={CalendarDays}
                title="Mês sem registros"
                message={`Nenhuma crise ou evento em ${nomeDoMes} de ${year}.`}
              />
            </Card>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
