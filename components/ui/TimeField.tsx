import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Modal, Pressable, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import KeyboardAwareScroll from '@/components/ui/KeyboardAwareScroll';
import Text from '@/components/ui/Text';
import TimeWheel from '@/components/ui/TimeWheel';
import { formatHorario, type Horario } from '@/lib/format';

export interface TimeFieldProps {
  label: string;
  value: Horario | null;
  onChange: (horario: Horario | null) => void;
  initial: Horario;
  className?: string;
}

export default function TimeField({ label, value, onChange, initial, className = '' }: TimeFieldProps) {
  const [aberto, setAberto] = useState(false);
  const [rascunho, setRascunho] = useState<Horario>(value ?? initial);
  const [semMovimento, setSemMovimento] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setSemMovimento)
      .catch(() => {});
  }, []);

  const abrir = () => {
    setRascunho(value ?? initial);
    setAberto(true);
  };

  const fechar = () => setAberto(false);

  return (
    <>
      <Pressable
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
      <Modal
        visible={aberto}
        transparent
        animationType={semMovimento ? 'none' : 'fade'}
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={fechar}
      >
        <SafeAreaProvider>
          <View className="flex-1 bg-scrim">
            <SafeAreaView style={{ flex: 1 }}>
              <KeyboardAwareScroll
                className="flex-1"
                contentContainerClassName="grow justify-center px-gutter py-section"
              >
                <View
                  accessibilityViewIsModal
                  className="rounded-lg border border-line bg-surface p-6"
                >
                  <View className="flex-row items-center justify-between gap-4">
                    <Text variant="title" className="flex-1">
                      {label}
                    </Text>
                    <IconButton icon={X} accessibilityLabel="Fechar" tone="content" filled onPress={fechar} />
                  </View>
                  <TimeWheel size="lg" label={label} value={rascunho} onChange={setRascunho} className="mt-8" />
                  <Button
                    title="Confirmar"
                    onPress={() => {
                      onChange(rascunho);
                      fechar();
                    }}
                    className="mt-8"
                  />
                  {value ? (
                    <Button
                      title="Limpar horário"
                      variant="ghost"
                      onPress={() => {
                        onChange(null);
                        fechar();
                      }}
                      className="mt-2"
                    />
                  ) : null}
                </View>
              </KeyboardAwareScroll>
            </SafeAreaView>
          </View>
        </SafeAreaProvider>
      </Modal>
    </>
  );
}
