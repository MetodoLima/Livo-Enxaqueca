import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Text from '@/components/ui/Text';
import TimeWheel from '@/components/ui/TimeWheel';
import { formatHorario, type Horario } from '@/lib/format';

export interface TimeFieldProps {
  label: string;
  value: Horario | null;
  onChange: (horario: Horario | null) => void;
  initial: Horario;
  title?: string;
  clearable?: boolean;
  className?: string;
}

export default function TimeField({
  label,
  value,
  onChange,
  initial,
  title,
  clearable = true,
  className = '',
}: TimeFieldProps) {
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<Horario>(value ?? initial);
  const campoRef = useRef<View>(null);

  const abrir = () => {
    setRascunho(value ?? initial);
    setAberto(true);
  };

  const fechar = () => setAberto(false);

  return (
    <>
      <Pressable
        ref={campoRef}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value ? formatHorario(value) : 'não informado'}`}
        accessibilityHint="Abre o seletor de horário"
        onPress={abrir}
        className={`min-h-16 justify-center gap-1 rounded-md border border-line-strong bg-surface-raised px-4 py-3 active:opacity-80 ${className}`}
      >
        <Text variant="caption" tone="muted">
          {label}
        </Text>
        <Text variant="heading" tone={value ? 'content' : 'muted'}>
          {value ? formatHorario(value) : '--:--'}
        </Text>
      </Pressable>
      <Dialog
        visible={aberto}
        title={title ?? label}
        onClose={fechar}
        returnFocusTo={campoRef}
        footer={
          <View className="gap-2">
            <View className="flex-row flex-wrap gap-3">
              <Button title="Cancelar" variant="ghost" onPress={fechar} className="flex-grow" />
              <Button
                title="Confirmar"
                onPress={() => {
                  onChange(rascunho);
                  fechar();
                }}
                className="flex-grow"
              />
            </View>
            {clearable && value ? (
              <Button
                title="Limpar horário"
                variant="ghost"
                onPress={() => {
                  onChange(null);
                  fechar();
                }}
              />
            ) : null}
          </View>
        }
      >
        <TimeWheel size="lg" label={label} value={rascunho} onChange={setRascunho} />
      </Dialog>
    </>
  );
}
