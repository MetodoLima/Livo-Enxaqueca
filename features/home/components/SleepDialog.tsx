import { useEffect, useState, type RefObject } from 'react';
import { View } from 'react-native';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Text from '@/components/ui/Text';
import TimeWheel from '@/components/ui/TimeWheel';
import { duracaoSono, formatSleep, type Horario } from '@/lib/format';

const DORMIR_INICIAL: Horario = { hora: 23, minuto: 0 };
const ACORDAR_INICIAL: Horario = { hora: 7, minuto: 0 };
const DICA = 'Ajuste o horário';

interface SleepDialogProps {
  visible: boolean;
  dormiAs: Horario | null;
  acordeiAs: Horario | null;
  onCancel: () => void;
  onConfirm: (dormiAs: Horario, acordeiAs: Horario) => void;
  returnFocusTo?: RefObject<View | null>;
}

function motivoDesabilitado(mexeuDormir: boolean, mexeuAcordar: boolean): string | undefined {
  if (!mexeuDormir && !mexeuAcordar) return 'Ajuste os horários de dormir e de acordar para confirmar';
  if (!mexeuDormir) return 'Ajuste o horário em que dormiu para confirmar';
  if (!mexeuAcordar) return 'Ajuste o horário em que acordou para confirmar';
  return undefined;
}

export default function SleepDialog({
  visible,
  dormiAs,
  acordeiAs,
  onCancel,
  onConfirm,
  returnFocusTo,
}: SleepDialogProps) {
  const jaTinha = dormiAs !== null && acordeiAs !== null;
  const [dormir, setDormir] = useState<Horario>(dormiAs ?? DORMIR_INICIAL);
  const [acordar, setAcordar] = useState<Horario>(acordeiAs ?? ACORDAR_INICIAL);
  const [mexeuDormir, setMexeuDormir] = useState(jaTinha);
  const [mexeuAcordar, setMexeuAcordar] = useState(jaTinha);

  useEffect(() => {
    if (!visible) return;
    setDormir(dormiAs ?? DORMIR_INICIAL);
    setAcordar(acordeiAs ?? ACORDAR_INICIAL);
    setMexeuDormir(jaTinha);
    setMexeuAcordar(jaTinha);
  }, [visible]);

  const motivo = motivoDesabilitado(mexeuDormir, mexeuAcordar);
  const horas = motivo ? null : duracaoSono(dormir, acordar);
  const suspeito = horas !== null && (horas < 2 || horas > 14);

  return (
    <Dialog
      visible={visible}
      title="Sono"
      onClose={onCancel}
      returnFocusTo={returnFocusTo}
      footer={
        <View className="flex-row flex-wrap gap-3">
          <Button title="Cancelar" variant="ghost" onPress={onCancel} className="flex-grow" />
          <Button
            title="Confirmar"
            disabled={motivo !== undefined}
            accessibilityHint={motivo}
            onPress={() => onConfirm(dormir, acordar)}
            className="flex-grow"
          />
        </View>
      }
    >
      <View className="gap-6">
        <View className="gap-2">
          <Text weight="semibold" importantForAccessibility="no" accessibilityElementsHidden>
            Dormi às
          </Text>
          <TimeWheel
            label="Dormi às"
            value={dormir}
            onChange={setDormir}
            visibleItems={3}
            hint={mexeuDormir ? undefined : DICA}
            onInteraction={() => setMexeuDormir(true)}
          />
          {!mexeuDormir ? (
            <Text variant="caption" tone="muted" importantForAccessibility="no" accessibilityElementsHidden className="text-center">
              {DICA}
            </Text>
          ) : null}
        </View>

        <View className="gap-2">
          <Text weight="semibold" importantForAccessibility="no" accessibilityElementsHidden>
            Acordei às
          </Text>
          <TimeWheel
            label="Acordei às"
            value={acordar}
            onChange={setAcordar}
            visibleItems={3}
            hint={mexeuAcordar ? undefined : DICA}
            onInteraction={() => setMexeuAcordar(true)}
          />
          {!mexeuAcordar ? (
            <Text variant="caption" tone="muted" importantForAccessibility="no" accessibilityElementsHidden className="text-center">
              {DICA}
            </Text>
          ) : null}
        </View>

        {horas !== null ? (
          <View className="gap-1">
            <Text weight="semibold" tone="secondary" accessibilityLiveRegion="polite">
              Você dormiu {formatSleep(horas)}
            </Text>
            {suspeito ? (
              <Text variant="caption" tone="attention">
                Confira os horários: isso dá {formatSleep(horas)} de sono.
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </Dialog>
  );
}
