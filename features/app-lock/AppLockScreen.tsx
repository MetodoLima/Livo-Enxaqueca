import React, { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CircleAlert, Shield } from 'lucide-react-native';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import IconBadge from '@/components/ui/IconBadge';
import Notice from '@/components/ui/Notice';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Text from '@/components/ui/Text';
import TextField from '@/components/ui/TextField';
import { color } from '@/constants/Colors';
import { useAppLock } from '@/features/app-lock/AppLockContext';
import { isValidPin } from '@/features/app-lock/appLockStore';

type AppLockScreenProps = {
  mode?: 'unlock' | 'setup' | 'manage';
  onClose?: () => void;
};

function formatWait(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} s`;
  return `${Math.ceil(seconds / 60)} min`;
}

const TRILHO = { false: color.surfaceRaised, true: color.primaryStrong };

function Interruptor({
  titulo,
  descricao,
  value,
  onValueChange,
  disabled,
}: {
  titulo: string;
  descricao: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Card padding="sm">
      <View className="min-h-12 flex-row items-center gap-4">
        <View className="flex-1 gap-1">
          <Text weight="semibold">{titulo}</Text>
          <Text variant="caption" tone="muted">
            {descricao}
          </Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={TRILHO}
          thumbColor={color.content}
          ios_backgroundColor={color.surfaceRaised}
          accessibilityLabel={titulo}
          accessibilityHint={descricao}
        />
      </View>
    </Card>
  );
}

export default function AppLockScreen({ mode = 'unlock', onClose }: AppLockScreenProps) {
  const {
    config,
    biometricAvailable,
    pinLockedUntil,
    unlockWithPin,
    unlockWithBiometric,
    configure,
    setBiometric,
    setEnabled,
    enableWithPin,
  } = useAppLock();
  const [pin, setPin] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [reactivationPin, setReactivationPin] = useState('');
  const [reactivationMode, setReactivationMode] = useState(false);
  const [useBiometric, setUseBiometric] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (pinLockedUntil === null) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [pinLockedUntil]);

  const setupMode = mode === 'setup';
  const manageMode = mode === 'manage';
  const securityEnabled = config?.enabled ?? false;
  const pinWaitMs = pinLockedUntil !== null ? pinLockedUntil - now : 0;
  const pinWaiting = (mode === 'unlock' || reactivationMode) && pinWaitMs > 0;

  useEffect(() => {
    if (mode !== 'unlock' || !config?.biometricEnabled || !biometricAvailable) return;

    void (async () => {
      setBusy(true);
      try {
        await unlockWithBiometric();
      } finally {
        setBusy(false);
      }
    })();
  }, [mode, config?.biometricEnabled, biometricAvailable, unlockWithBiometric]);

  const handleUnlock = async () => {
    setError(null);
    setBusy(true);
    try {
      const unlocked = await unlockWithPin(pin);
      if (!unlocked) setError('PIN inválido.');
      else setPin('');
    } catch {
      setError('Não foi possível validar o PIN.');
    } finally {
      setBusy(false);
    }
  };

  const handleSetup = async () => {
    setError(null);
    if (!isValidPin(pin)) {
      setError('O PIN deve conter de 4 a 6 dígitos.');
      return;
    }
    if (pin !== confirmation) {
      setError('A confirmação do PIN não confere.');
      return;
    }

    setBusy(true);
    try {
      await configure(pin, useBiometric);
      setPin('');
      setConfirmation('');
      onClose?.();
    } catch {
      setError('Não foi possível salvar o AppLock.');
    } finally {
      setBusy(false);
    }
  };

  const handleBiometricChange = async (enabled: boolean) => {
    setError(null);
    setBusy(true);
    try {
      await setBiometric(enabled);
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : 'Não foi possível alterar a biometria.');
    } finally {
      setBusy(false);
    }
  };

  const handleSecurityChange = async (enabled: boolean) => {
    setError(null);
    if (!enabled) {
      setBusy(true);
      try {
        await setEnabled(false);
        setReactivationPin('');
        setReactivationMode(false);
      } catch {
        setError('Não foi possível desativar a segurança do aplicativo.');
      } finally {
        setBusy(false);
      }
      return;
    }

    setReactivationMode(true);
  };

  const handleReactivate = async () => {
    setError(null);
    setBusy(true);
    try {
      const enabled = await enableWithPin(reactivationPin);
      if (!enabled) {
        setError(pinWaiting ? 'Aguarde antes de tentar novamente.' : 'PIN inválido.');
        return;
      }
      setReactivationPin('');
      setReactivationMode(false);
    } catch {
      setError('Não foi possível reativar a segurança do aplicativo.');
    } finally {
      setBusy(false);
    }
  };

  const handleBiometricUnlock = async () => {
    setBusy(true);
    setError(null);
    try {
      const unlocked = await unlockWithBiometric();
      if (!unlocked) setError('A biometria não desbloqueou o aplicativo.');
    } catch {
      setError('Não foi possível usar a biometria.');
    } finally {
      setBusy(false);
    }
  };

  const aviso = pinWaiting
    ? `Muitas tentativas erradas. Tente o PIN de novo em ${formatWait(pinWaitMs)}.`
    : error;
  const dicaDeEspera = pinWaiting ? 'Aguarde o fim do tempo de espera para tentar de novo' : undefined;

  if (manageMode) {
    return (
      <SafeAreaProvider>
        <Screen scroll>
          <ScreenHeader title="Segurança do aplicativo" onBack={onClose} />
          <View className="gap-4">
            <Interruptor
              titulo="Segurança do aplicativo"
              descricao={securityEnabled ? 'Protege o acesso ao Livo com um PIN.' : 'O AppLock está desativado.'}
              value={securityEnabled}
              onValueChange={handleSecurityChange}
              disabled={busy}
            />

            {securityEnabled ? (
              <Card padding="sm">
                <View className="flex-row items-center gap-3">
                  <IconBadge icon={Shield} />
                  <View className="flex-1 gap-1">
                    <Text weight="semibold">PIN</Text>
                    <Text variant="caption" tone="muted">
                      Ativo e sempre disponível como fallback.
                    </Text>
                  </View>
                  <Chip label="Ativo" tone="success" />
                </View>
              </Card>
            ) : null}

            {!securityEnabled && reactivationMode ? (
              <Card padding="sm" className="gap-4">
                <View className="flex-row items-center gap-3">
                  <IconBadge icon={Shield} />
                  <Text weight="semibold" className="flex-1">
                    Confirme o PIN para reativar
                  </Text>
                </View>
                <TextField
                  label="PIN atual"
                  autoFocus
                  value={reactivationPin}
                  onChangeText={setReactivationPin}
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={6}
                />
                <Button
                  title="Reativar segurança"
                  icon={Shield}
                  onPress={handleReactivate}
                  loading={busy}
                  disabled={pinWaiting}
                  accessibilityHint={dicaDeEspera}
                />
              </Card>
            ) : null}

            {securityEnabled ? (
              <Interruptor
                titulo="Biometria"
                descricao={
                  biometricAvailable
                    ? 'Use a biometria para desbloquear mais rapidamente.'
                    : 'Nenhuma biometria cadastrada neste dispositivo.'
                }
                value={config?.biometricEnabled ?? false}
                onValueChange={handleBiometricChange}
                disabled={busy || (!biometricAvailable && !config?.biometricEnabled)}
              />
            ) : null}

            {aviso ? (
              <Notice icon={CircleAlert} tone="danger">
                {aviso}
              </Notice>
            ) : null}
          </View>
        </Screen>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Screen scroll className="justify-center">
        <Text variant="title">{setupMode ? 'Proteger aplicativo' : 'Desbloquear Livo'}</Text>
        <Text tone="muted" className="mb-6 mt-2">
          {setupMode
            ? 'Crie um PIN para proteger seus dados neste dispositivo.'
            : 'Use sua biometria ou informe o PIN para continuar.'}
        </Text>

        <View className="gap-4">
          {setupMode ? (
            <TextField
              label="Confirme o PIN"
              value={confirmation}
              onChangeText={setConfirmation}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
            />
          ) : null}
          <TextField
            label="PIN"
            autoFocus
            value={pin}
            onChangeText={setPin}
            placeholder={setupMode ? '4 a 6 dígitos' : undefined}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
          />

          {setupMode && biometricAvailable ? (
            <View className="min-h-12 flex-row items-center justify-between gap-4">
              <Text className="flex-1">Ativar biometria</Text>
              <Switch
                value={useBiometric}
                onValueChange={setUseBiometric}
                trackColor={TRILHO}
                thumbColor={color.content}
                ios_backgroundColor={color.surfaceRaised}
                accessibilityLabel="Ativar biometria"
              />
            </View>
          ) : null}

          {aviso ? (
            <Notice icon={CircleAlert} tone="danger">
              {aviso}
            </Notice>
          ) : null}

          <Button
            title={setupMode ? 'Salvar PIN' : 'Desbloquear'}
            onPress={setupMode ? handleSetup : handleUnlock}
            loading={busy}
            disabled={pinWaiting}
            accessibilityHint={dicaDeEspera}
          />

          {!setupMode && biometricAvailable && config?.biometricEnabled ? (
            <Button
              title="Usar biometria"
              variant="ghost"
              onPress={handleBiometricUnlock}
              disabled={busy}
              accessibilityHint={busy ? 'Aguarde a verificação em andamento' : undefined}
            />
          ) : null}

          {setupMode && onClose ? <Button title="Cancelar" variant="ghost" onPress={onClose} /> : null}
        </View>
      </Screen>
    </SafeAreaProvider>
  );
}
