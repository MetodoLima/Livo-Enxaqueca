import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import IconButton from '@/components/ui/IconButton';
import Text from '@/components/ui/Text';

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const pad = (n: number) => String(n).padStart(2, '0');

function diasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes + 1, 0).getDate();
}

function falarData(data: Date): string {
  return `${data.getDate()} de ${MESES[data.getMonth()]} de ${data.getFullYear()}`;
}

interface Partes {
  dia: number;
  mes: number;
  ano: number;
}

function partesDe(data: Date): Partes {
  return { dia: data.getDate(), mes: data.getMonth(), ano: data.getFullYear() };
}

function ajustar({ dia, mes, ano }: Partes): Partes {
  return { dia: Math.min(dia, diasNoMes(ano, mes)), mes, ano };
}

interface ColunaProps {
  rotulo: string;
  texto: string;
  falado: string;
  onMudar: (passo: 1 | -1) => void;
}

function ColunaDaData({ rotulo, texto, falado, onMudar }: ColunaProps) {
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={rotulo}
      accessibilityValue={{ text: falado }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') onMudar(1);
        if (e.nativeEvent.actionName === 'decrement') onMudar(-1);
      }}
      className="items-center gap-1"
    >
      <IconButton
        icon={ChevronUp}
        accessibilityLabel={`Aumentar ${rotulo.toLowerCase()}`}
        importantForAccessibility="no"
        accessibilityElementsHidden
        onPress={() => onMudar(1)}
      />
      <View className="min-h-14 min-w-16 items-center justify-center rounded-md border border-line-strong bg-surface-raised px-3">
        <Text variant="title">{texto}</Text>
      </View>
      <IconButton
        icon={ChevronDown}
        accessibilityLabel={`Diminuir ${rotulo.toLowerCase()}`}
        importantForAccessibility="no"
        accessibilityElementsHidden
        onPress={() => onMudar(-1)}
      />
      <Text variant="caption" weight="semibold" tone="muted">
        {rotulo}
      </Text>
    </View>
  );
}

export interface DateFieldProps {
  label: string;
  value: Date;
  onChange: (data: Date) => void;
  title?: string;
  className?: string;
}

export default function DateField({ label, value, onChange, title, className = '' }: DateFieldProps) {
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<Partes>(partesDe(value));
  const campoRef = useRef<View>(null);

  const abrir = () => {
    setRascunho(partesDe(value));
    setAberto(true);
  };

  const fechar = () => setAberto(false);

  const mudarDia = (passo: 1 | -1) =>
    setRascunho((atual) => {
      const total = diasNoMes(atual.ano, atual.mes);
      return { ...atual, dia: ((atual.dia - 1 + passo + total) % total) + 1 };
    });

  const mudarMes = (passo: 1 | -1) =>
    setRascunho((atual) => ajustar({ ...atual, mes: (atual.mes + passo + 12) % 12 }));

  const mudarAno = (passo: 1 | -1) => setRascunho((atual) => ajustar({ ...atual, ano: atual.ano + passo }));

  const confirmar = () => {
    const nova = new Date(value);
    nova.setFullYear(rascunho.ano, rascunho.mes, rascunho.dia);
    onChange(nova);
    fechar();
  };

  return (
    <>
      <Pressable
        ref={campoRef}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${falarData(value)}`}
        accessibilityHint="Abre o seletor de data"
        onPress={abrir}
        className={`min-h-16 justify-center gap-1 rounded-md border border-line-strong bg-surface-raised px-4 py-3 active:opacity-80 ${className}`}
      >
        <Text variant="caption" tone="muted">
          {label}
        </Text>
        <Text variant="heading">
          {pad(value.getDate())}/{pad(value.getMonth() + 1)}
        </Text>
      </Pressable>
      <Dialog
        visible={aberto}
        title={title ?? label}
        onClose={fechar}
        returnFocusTo={campoRef}
        footer={
          <View className="flex-row flex-wrap gap-3">
            <Button title="Cancelar" variant="ghost" onPress={fechar} className="flex-grow" />
            <Button title="Confirmar" onPress={confirmar} className="flex-grow" />
          </View>
        }
      >
        <View className="flex-row flex-wrap items-start justify-center gap-3">
          <ColunaDaData
            rotulo="Dia"
            texto={pad(rascunho.dia)}
            falado={String(rascunho.dia)}
            onMudar={mudarDia}
          />
          <ColunaDaData
            rotulo="Mês"
            texto={MESES_CURTOS[rascunho.mes]}
            falado={MESES[rascunho.mes]}
            onMudar={mudarMes}
          />
          <ColunaDaData
            rotulo="Ano"
            texto={String(rascunho.ano)}
            falado={String(rascunho.ano)}
            onMudar={mudarAno}
          />
        </View>
      </Dialog>
    </>
  );
}
