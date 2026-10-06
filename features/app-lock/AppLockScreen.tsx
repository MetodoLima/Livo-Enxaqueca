import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useAppLock } from '@/features/app-lock/AppLockContext';
import { isValidPin } from '@/features/app-lock/appLockStore';

type AppLockScreenProps = {
  mode?: 'unlock' | 'setup';
  onClose?: () => void;
};

function formatWait(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} s`;
  return `${Math.ceil(seconds / 60)} min`;
}

export default function AppLockScreen({ mode = 'unlock', onClose }: AppLockScreenProps) {
  const {
    config,
    biometricAvailable,
    pinLockedUntil,
    unlockWithPin,
    unlockWithBiometric,
    configure,
  } = useAppLock();
  const [pin, setPin] = useState('');
  const [confirmation, setConfirmation] = useState('');
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

  const pinWaitMs = pinLockedUntil !== null ? pinLockedUntil - now : 0;
  const pinWaiting = mode === 'unlock' && pinWaitMs > 0;

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

  const setupMode = mode === 'setup';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark }}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
        <Text style={{ color: 'white', fontSize: 28, fontWeight: '700', marginBottom: 10 }}>
          {setupMode ? 'Proteger aplicativo' : 'Desbloquear Livo'}
        </Text>
        <Text style={{ color: Colors.muted, fontSize: 15, marginBottom: 28 }}>
          {setupMode
            ? 'Crie um PIN para proteger seus dados neste dispositivo.'
            : 'Use sua biometria ou informe o PIN para continuar.'}
        </Text>

        {setupMode && (
          <TextInput
            value={confirmation}
            onChangeText={setConfirmation}
            placeholder="Confirme o PIN"
            placeholderTextColor={Colors.muted}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
            style={{ color: 'white', backgroundColor: '#112236', borderRadius: 12, padding: 16, marginBottom: 12 }}
          />
        )}
        <TextInput
          autoFocus
          value={pin}
          onChangeText={setPin}
          placeholder={setupMode ? 'PIN de 4 a 6 dígitos' : 'PIN'}
          placeholderTextColor={Colors.muted}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          style={{ color: 'white', backgroundColor: '#112236', borderRadius: 12, padding: 16, marginBottom: 14 }}
        />

        {setupMode && biometricAvailable && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <Text style={{ color: 'white', fontSize: 15 }}>Ativar biometria</Text>
            <Switch value={useBiometric} onValueChange={setUseBiometric} />
          </View>
        )}

        {pinWaiting ? (
          <Text style={{ color: '#EF7777', marginBottom: 14 }}>
            Muitas tentativas erradas. Tente o PIN de novo em {formatWait(pinWaitMs)}.
          </Text>
        ) : (
          error && <Text style={{ color: '#EF7777', marginBottom: 14 }}>{error}</Text>
        )}

        <TouchableOpacity
          onPress={setupMode ? handleSetup : handleUnlock}
          disabled={busy || pinWaiting}
          style={{
            backgroundColor: Colors.accent,
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            opacity: pinWaiting ? 0.5 : 1,
          }}
        >
          {busy ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '700' }}>{setupMode ? 'Salvar PIN' : 'Desbloquear'}</Text>}
        </TouchableOpacity>

        {!setupMode && biometricAvailable && config?.biometricEnabled && (
          <TouchableOpacity
            onPress={async () => {
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
            }}
            disabled={busy}
            style={{ padding: 16, alignItems: 'center', marginTop: 8 }}
          >
            <Text style={{ color: Colors.accent, fontWeight: '700' }}>Usar biometria</Text>
          </TouchableOpacity>
        )}

        {setupMode && onClose && (
          <TouchableOpacity onPress={onClose} style={{ padding: 16, alignItems: 'center', marginTop: 8 }}>
            <Text style={{ color: Colors.muted }}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
