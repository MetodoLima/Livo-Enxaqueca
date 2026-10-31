import { Link, router } from 'expo-router';
import { Eye, EyeOff } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { AccessibilityInfo, TextInput, View } from 'react-native';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import IconButton from '@/components/ui/IconButton';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Text from '@/components/ui/Text';
import TextField from '@/components/ui/TextField';
import { sessionRepository } from '@/repositories';

const CAMPO_VAZIO = 'Preencha este campo.';

interface Aviso {
  title: string;
  message: string;
  irParaLogin: boolean;
}

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [campoParaFocar, setCampoParaFocar] = useState<RefObject<TextInput | null> | null>(null);
  const [aviso, setAviso] = useState<Aviso>({ title: '', message: '', irParaLogin: false });
  const [avisoVisible, setAvisoVisible] = useState(false);
  const nomeRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const senhaRef = useRef<TextInput>(null);
  const confirmarRef = useRef<TextInput>(null);
  const cadastrarRef = useRef<View>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Mínimo de 8 dígitos');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Uma letra maiúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Uma letra minúscula');
    }
    if (!/\d/.test(password)) {
      errors.push('Um número');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Um símbolo especial');
    }

    return errors;
  };

  const faltamNaSenha = (password: string): string => {
    const errors = validatePassword(password);
    return errors.length > 0 ? `Faltam: ${errors.join(', ')}` : '';
  };

  const validateConfirmPassword = useCallback((pwd: string, confirmPwd: string) => {
    if (!confirmPwd) {
      setConfirmPasswordError('');
    } else if (pwd !== confirmPwd) {
      setConfirmPasswordError('As senhas não coincidem');
    } else {
      setConfirmPasswordError('');
    }
  }, []);

  const handleNameChange = useCallback((text: string) => {
    setName(text);
    setNameError('');
  }, []);

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text);
    if (text && !validateEmail(text)) {
      setEmailError('Formato de e-mail inválido');
    } else {
      setEmailError('');
    }
  }, []);

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text);
    setPasswordError(faltamNaSenha(text));
  }, []);

  const handleConfirmPasswordChange = useCallback((text: string) => {
    setConfirmPassword(text);
  }, []);

  useEffect(() => {
    if (confirmPassword.length > 0) {
      validateConfirmPassword(password, confirmPassword);
    }
  }, [password, confirmPassword, validateConfirmPassword]);

  useEffect(() => {
    const campo = campoParaFocar?.current;
    if (!campo) return;
    campo.focus();
    AccessibilityInfo.sendAccessibilityEvent(campo, 'focus');
    setCampoParaFocar(null);
  }, [campoParaFocar]);

  const mostrarAviso = (title: string, message: string, irParaLogin = false) => {
    setAviso({ title, message, irParaLogin });
    setAvisoVisible(true);
  };

  const fecharAviso = () => {
    setAvisoVisible(false);
    if (aviso.irParaLogin) {
      router.replace('/login');
    }
  };

  const handleRegister = async () => {
    const erros = [
      { ref: nomeRef, set: setNameError, erro: name ? '' : CAMPO_VAZIO },
      {
        ref: emailRef,
        set: setEmailError,
        erro: !email ? CAMPO_VAZIO : !validateEmail(email) ? 'Formato de e-mail inválido' : '',
      },
      { ref: senhaRef, set: setPasswordError, erro: !password ? CAMPO_VAZIO : faltamNaSenha(password) },
      {
        ref: confirmarRef,
        set: setConfirmPasswordError,
        erro: !confirmPassword ? CAMPO_VAZIO : password !== confirmPassword ? 'As senhas não coincidem' : '',
      },
    ];

    erros.forEach(({ set, erro }) => set(erro));
    const primeiro = erros.find(({ erro }) => erro);
    if (primeiro) {
      setCampoParaFocar(primeiro.ref);
      return;
    }

    setLoading(true);
    const { error, signedIn } = await sessionRepository.signUp({ email, senha: password, nome: name });

    setLoading(false);

    if (error) {
      mostrarAviso('Erro de cadastro', error);
    } else if (!signedIn) {
      mostrarAviso('Verificação necessária', 'Verifique seu e-mail para confirmar a conta.', true);
    }
  };

  const temErro = !!nameError || !!emailError || !!passwordError || !!confirmPasswordError;

  const voltar = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login');
    }
  };

  const olho = (visivel: boolean, alternar: () => void) => (
    <IconButton
      icon={visivel ? Eye : EyeOff}
      accessibilityLabel={visivel ? 'Ocultar senha' : 'Mostrar senha'}
      tone="primary"
      filled
      onPress={alternar}
    />
  );

  return (
    <Screen scroll className="gap-6">
      <ScreenHeader
        title="Criar conta"
        subtitle="Junte-se a nós e comece a monitorar suas crises"
        onBack={voltar}
      />

      <View className="gap-4">
        <TextField
          ref={nomeRef}
          label="Nome"
          placeholder="Como quer ser chamado?"
          value={name}
          onChangeText={handleNameChange}
          autoCapitalize="words"
          error={nameError || undefined}
        />
        <TextField
          ref={emailRef}
          label="E-mail"
          placeholder="Seu melhor e-mail"
          value={email}
          onChangeText={handleEmailChange}
          autoCapitalize="none"
          keyboardType="email-address"
          error={emailError || undefined}
        />
        <TextField
          ref={senhaRef}
          label="Senha"
          placeholder="Crie uma senha forte"
          value={password}
          onChangeText={handlePasswordChange}
          secureTextEntry={!showPassword}
          editable={!loading}
          error={passwordError || undefined}
          accessory={olho(showPassword, () => setShowPassword(!showPassword))}
        />
        <TextField
          ref={confirmarRef}
          label="Confirmar senha"
          placeholder="Repita sua senha"
          value={confirmPassword}
          onChangeText={handleConfirmPasswordChange}
          secureTextEntry={!showConfirmPassword}
          editable={!loading}
          error={confirmPasswordError || undefined}
          accessory={olho(showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword))}
        />
      </View>

      <Button
        ref={cadastrarRef}
        title="Cadastrar"
        loading={loading}
        disabled={temErro}
        accessibilityHint={temErro ? 'Corrija os campos marcados em vermelho para continuar.' : undefined}
        onPress={handleRegister}
      />

      <View className="flex-row flex-wrap items-center justify-center">
        <Text tone="muted">Já tem uma conta?</Text>
        <Link href="/login" asChild>
          <Button title="Entrar" variant="ghost" size="md" />
        </Link>
      </View>

      <Dialog
        visible={avisoVisible}
        title={aviso.title}
        onClose={fecharAviso}
        returnFocusTo={cadastrarRef}
        footer={<Button title="Entendi" variant="secondary" size="md" onPress={fecharAviso} />}
      >
        <Text>{aviso.message}</Text>
      </Dialog>
    </Screen>
  );
}
