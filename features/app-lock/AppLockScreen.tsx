import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/Colors';
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark }}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 28 }}>
        <Text style={{ color: 'white', fontSize: 28, fontWeight: '700', marginBottom: 10 }}>
          {setupMode ? 'Proteger aplicativo' : manageMode ? 'Segurança do Livo' : 'Desbloquear Livo'}
        </Text>
        <Text style={{ color: Colors.muted, fontSize: 15, marginBottom: 28 }}>
          {setupMode
            ? 'Crie um PIN para proteger seus dados neste dispositivo.'
            : manageMode
              ? 'Controle a proteção local do Livo sem alterar sua sessão da conta.'
            : 'Use sua biometria ou informe o PIN para continuar.'}
        </Text>

        {manageMode && (
          <View style={{ marginBottom: 22 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={{ color: 'white', fontSize: 16 }}>Segurança do aplicativo</Text>
                <Text style={{ color: Colors.muted, fontSize: 13, marginTop: 4 }}>
                  {securityEnabled ? 'Protege o acesso ao Livo com um PIN.' : 'O AppLock está desativado.'}
                </Text>
              </View>
              <Switch value={securityEnabled} onValueChange={handleSecurityChange} disabled={busy} />
            </View>
          </View>
        )}

        {manageMode && securityEnabled && (
          <View style={{ marginBottom: 18 }}>
            <Text style={{ color: 'white', fontSize: 16 }}>PIN</Text>
            <Text style={{ color: Colors.muted, fontSize: 13, marginTop: 4 }}>
              Ativo e sempre disponível como fallback.
            </Text>
          </View>
        )}

        {manageMode && !securityEnabled && reactivationMode && (
          <View style={{ marginBottom: 18 }}>
            <Text style={{ color: 'white', fontSize: 16, marginBottom: 10 }}>Confirme o PIN para reativar</Text>
            <TextInput
              autoFocus
              value={reactivationPin}
              onChangeText={setReactivationPin}
              placeholder="PIN atual"
              placeholderTextColor={Colors.muted}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              style={{ color: 'white', backgroundColor: '#112236', borderRadius: 12, padding: 16, marginBottom: 12 }}
            />
            <TouchableOpacity
              onPress={handleReactivate}
              disabled={busy || pinWaiting}
              style={{ backgroundColor: Colors.accent, borderRadius: 12, padding: 16, alignItems: 'center', opacity: pinWaiting ? 0.5 : 1 }}
            >
              {busy ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '700' }}>Reativar segurança</Text>}
            </TouchableOpacity>
          </View>
        )}

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
        {!manageMode && <TextInput
          autoFocus
          value={pin}
          onChangeText={setPin}
          placeholder={setupMode ? 'PIN de 4 a 6 dígitos' : 'PIN'}
          placeholderTextColor={Colors.muted}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          style={{ color: 'white', backgroundColor: '#112236', borderRadius: 12, padding: 16, marginBottom: 14 }}
        />}

        {setupMode && biometricAvailable && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <Text style={{ color: 'white', fontSize: 15 }}>Ativar biometria</Text>
            <Switch value={useBiometric} onValueChange={setUseBiometric} />
          </View>
        )}

        {manageMode && securityEnabled && (
          <View style={{ marginBottom: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={{ color: 'white', fontSize: 16 }}>Biometria</Text>
                <Text style={{ color: Colors.muted, fontSize: 13, marginTop: 4 }}>
                  {biometricAvailable
                    ? 'Use a biometria para desbloquear mais rapidamente.'
                    : 'Nenhuma biometria cadastrada neste dispositivo.'}
                </Text>
              </View>
              <Switch
                value={config?.biometricEnabled ?? false}
                onValueChange={handleBiometricChange}
                disabled={busy || (!biometricAvailable && !config?.biometricEnabled)}
              />
            </View>
          </View>
        )}

        {pinWaiting ? (
          <Text style={{ color: '#EF7777', marginBottom: 14 }}>
            Muitas tentativas erradas. Tente o PIN de novo em {formatWait(pinWaitMs)}.
          </Text>
        ) : (
          error && <Text style={{ color: '#EF7777', marginBottom: 14 }}>{error}</Text>
        )}

        {!manageMode && <TouchableOpacity
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
        </TouchableOpacity>}

        {!setupMode && !manageMode && biometricAvailable && config?.biometricEnabled && (
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

        {manageMode && onClose && (
          <TouchableOpacity onPress={onClose} style={{ padding: 16, alignItems: 'center', marginTop: 8 }}>
            <Text style={{ color: Colors.muted }}>Fechar</Text>
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
