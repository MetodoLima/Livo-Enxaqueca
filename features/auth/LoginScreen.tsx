import { Link } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import IconButton from '@/components/ui/IconButton';
import Screen from '@/components/ui/Screen';
import Text from '@/components/ui/Text';
import TextField from '@/components/ui/TextField';
import { sessionRepository } from '@/repositories';

interface Aviso {
  title: string;
  message: string;
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aviso, setAviso] = useState<Aviso>({ title: '', message: '' });
  const [avisoVisible, setAvisoVisible] = useState(false);
  const entrarRef = useRef<View>(null);

  const mostrarAviso = (title: string, message: string) => {
    setAviso({ title, message });
    setAvisoVisible(true);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      mostrarAviso('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    const { error } = await sessionRepository.signIn(email, password);

    setLoading(false);

    if (error) {
      mostrarAviso('Erro de login', error);
    }
  };

  return (
    <Screen scroll className="justify-center gap-6 pt-section">
      <View className="items-center gap-2">
        <Text variant="display" className="text-center">
          Livo
        </Text>
        <Text tone="muted" className="text-center">
          Sua jornada para o bem-estar começa aqui
        </Text>
      </View>

      <View className="gap-4">
        <TextField
          label="E-mail"
          placeholder="Digite seu e-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextField
          label="Senha"
          placeholder="Digite sua senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          accessory={
            <IconButton
              icon={showPassword ? Eye : EyeOff}
              accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              tone="primary"
              filled
              onPress={() => setShowPassword(!showPassword)}
            />
          }
        />
      </View>

      <Button ref={entrarRef} title="Entrar" loading={loading} onPress={handleLogin} />

      <View className="flex-row flex-wrap items-center justify-center">
        <Text tone="muted">Ainda não tem uma conta?</Text>
        <Link href="/register" asChild>
          <Button title="Cadastre-se" variant="ghost" size="md" />
        </Link>
      </View>

      <Dialog
        visible={avisoVisible}
        title={aviso.title}
        onClose={() => setAvisoVisible(false)}
        returnFocusTo={entrarRef}
        footer={<Button title="Entendi" variant="secondary" size="md" onPress={() => setAvisoVisible(false)} />}
      >
        <Text>{aviso.message}</Text>
      </Dialog>
    </Screen>
  );
}
