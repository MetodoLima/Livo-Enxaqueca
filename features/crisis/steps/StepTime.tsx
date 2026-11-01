import { Clock, TriangleAlert } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Chip from '@/components/ui/Chip';
import DateField from '@/components/ui/DateField';
import Notice from '@/components/ui/Notice';
import Text from '@/components/ui/Text';
import TimeField from '@/components/ui/TimeField';
import { color } from '@/constants/Colors';
import type { Horario } from '@/lib/format';
import type { CrisisRecord, EndTimePreset, TimePreset } from '@/types/crisis';

const AVISO_FIM_ANTES = 'Atenção: a hora de fim está antes da hora de início.';
const AVISO_INICIO_FUTURO = 'O início da crise não pode ficar no futuro. Ajuste a data ou a hora.';
const AVISO_FIM_FUTURO = 'O fim da crise não pode ficar no futuro. Ajuste a data ou a hora.';

const START_PRESETS: { key: TimePreset; label: string }[] = [
  { key: 'now', label: 'Agora mesmo' },
  { key: '1h_ago', label: 'Há 1 hora' },
  { key: 'custom', label: 'Outro' },
];

const END_PRESETS: { key: EndTimePreset; label: string }[] = [
  { key: 'ongoing', label: 'Ainda em curso' },
  { key: 'now', label: 'Agora mesmo' },
  { key: 'custom', label: 'Outro' },
];

export interface ProblemasDoHorario {
  inicioNoFuturo: boolean;
  fimNoFuturo: boolean;
  fimAntesDoInicio: boolean;
}

export function problemasDoHorario(data: CrisisRecord, agora: Date = new Date()): ProblemasDoHorario {
  return {
    inicioNoFuturo: data.startTime.getTime() > agora.getTime(),
    fimNoFuturo: data.endTime !== null && data.endTime.getTime() > agora.getTime(),
    fimAntesDoInicio: data.endTime !== null && data.endTime < data.startTime,
  };
}

function subtractHours(date: Date, hours: number): Date {
  const d = new Date(date);
  d.setHours(d.getHours() - hours);
  return d;
}

function horarioDe(date: Date): Horario {
  return { hora: date.getHours(), minuto: date.getMinutes() };
}

function comHorario(date: Date, { hora, minuto }: Horario): Date {
  const d = new Date(date);
  d.setHours(hora, minuto, 0, 0);
  return d;
}

interface StepTimeProps {
  data: CrisisRecord;
  onChange: (patch: Partial<CrisisRecord>) => void;
  onNext: () => void;
}

interface SecaoProps {
  titulo: string;
  iconColor: string;
  destaque?: boolean;
  children: ReactNode;
}

function Secao({ titulo, iconColor, destaque = false, children }: SecaoProps) {
  return (
    <View className={`gap-4 rounded-lg border bg-surface p-4 ${destaque ? 'border-attention' : 'border-line'}`}>
      <View className="flex-row items-center gap-2">
        <Clock size={20} color={iconColor} />
        <Text variant="caption" weight="semibold" tone="muted" className="flex-1 uppercase">
          {titulo}
        </Text>
      </View>
      {children}
    </View>
  );
}

export default function StepTime({ data, onChange }: StepTimeProps) {
  const [startPreset, setStartPreset] = useState<TimePreset>('now');
  const [endPreset, setEndPreset] = useState<EndTimePreset>(data.endTime ? 'custom' : 'ongoing');
  const [larguraDaFileira, setLarguraDaFileira] = useState(0);

  const larguraDoCampo = larguraDaFileira > 0 ? (larguraDaFileira - 12) / 2 : undefined;

  const avisar = (proximo: CrisisRecord) => {
    const problemas = problemasDoHorario(proximo);
    if (problemas.inicioNoFuturo) AccessibilityInfo.announceForAccessibility(AVISO_INICIO_FUTURO);
    else if (problemas.fimNoFuturo) AccessibilityInfo.announceForAccessibility(AVISO_FIM_FUTURO);
    else if (problemas.fimAntesDoInicio) AccessibilityInfo.announceForAccessibility(AVISO_FIM_ANTES);
  };

  const mudarInicio = (startTime: Date) => {
    setStartPreset('custom');
    onChange({ startTime });
    avisar({ ...data, startTime });
  };

  const mudarFim = (endTime: Date) => {
    setEndPreset('custom');
    onChange({ endTime });
    avisar({ ...data, endTime });
  };

  const handleStartPreset = (preset: TimePreset) => {
    setStartPreset(preset);
    if (preset === 'now') {
      onChange({ startTime: new Date() });
    } else if (preset === '1h_ago') {
      onChange({ startTime: subtractHours(new Date(), 1) });
    }
  };

  const handleEndPreset = (preset: EndTimePreset) => {
    setEndPreset(preset);
    if (preset === 'ongoing') {
      onChange({ endTime: null });
    } else if (preset === 'now') {
      onChange({ endTime: new Date() });
    } else if (!data.endTime) {
      onChange({ endTime: new Date() });
    }
  };

  const problemas = problemasDoHorario(data);

  const campos = (
    rotuloHora: string,
    rotuloData: string,
    valor: Date,
    mudar: (date: Date) => void,
  ) => (
    <View
      className="flex-row gap-3"
      onLayout={(e) => setLarguraDaFileira(e.nativeEvent.layout.width)}
    >
      <View style={{ width: larguraDoCampo }}>
        <TimeField
          label={rotuloHora}
          title="Selecionar horário"
          value={horarioDe(valor)}
          initial={horarioDe(valor)}
          clearable={false}
          onChange={(horario) => {
            if (horario) mudar(comHorario(valor, horario));
          }}
        />
      </View>
      <View style={{ width: larguraDoCampo }}>
        <DateField label={rotuloData} title="Selecionar data" value={valor} onChange={mudar} />
      </View>
    </View>
  );

  return (
    <View className="gap-6">
      <Text variant="title">Horário da crise</Text>

      <Secao titulo="Hora de início" iconColor={color.primary}>
        <View className="flex-row flex-wrap gap-2">
          {START_PRESETS.map(({ key, label }) => (
            <Chip
              key={key}
              label={label}
              tone="primary"
              selected={startPreset === key}
              onPress={() => handleStartPreset(key)}
            />
          ))}
        </View>
        {campos('Hora de início', 'Data de início', data.startTime, mudarInicio)}
      </Secao>

      <Secao titulo="Hora de fim" iconColor={color.attention} destaque={data.endTime === null}>
        {data.endTime ? (
          campos('Hora de fim', 'Data de fim', data.endTime, mudarFim)
        ) : (
          <Text weight="semibold" tone="attention" accessibilityLabel="Crise ainda em andamento">
            • Ainda em curso
          </Text>
        )}
        <View className="flex-row flex-wrap gap-2">
          {END_PRESETS.map(({ key, label }) => (
            <Chip
              key={key}
              label={label}
              tone="primary"
              selected={endPreset === key}
              onPress={() => handleEndPreset(key)}
            />
          ))}
        </View>
      </Secao>

      {problemas.inicioNoFuturo ? <Notice icon={TriangleAlert} tone="attention">{AVISO_INICIO_FUTURO}</Notice> : null}
      {problemas.fimNoFuturo ? <Notice icon={TriangleAlert} tone="attention">{AVISO_FIM_FUTURO}</Notice> : null}
      {problemas.fimAntesDoInicio ? <Notice icon={TriangleAlert} tone="attention">{AVISO_FIM_ANTES}</Notice> : null}
    </View>
  );
}
