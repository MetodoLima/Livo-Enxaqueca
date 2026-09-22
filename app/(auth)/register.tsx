import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const validateConfirmPassword = useCallback((pwd: string, confirmPwd: string) => {
    if (!confirmPwd) {
      setConfirmPasswordError('');
    } else if (pwd !== confirmPwd) {
      setConfirmPasswordError('As senhas não coincidem');
    } else {
      setConfirmPasswordError('');
    }
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
    const errors = validatePassword(text);
    setPasswordError(errors.length > 0 ? `Faltam: ${errors.join(', ')}` : '');
  }, []);

  const handleConfirmPasswordChange = useCallback((text: string) => {
    setConfirmPassword(text);
  }, []);

  // Validar confirmação de senha quando qualquer uma das senhas mudar
  useEffect(() => {
    if (confirmPassword.length > 0) {
      validateConfirmPassword(password, confirmPassword);
    }
  }, [password, confirmPassword, validateConfirmPassword]);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Erro', 'Por favor, insira um e-mail válido.');
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      Alert.alert('Erro', `Sua senha deve conter:\n- ${passwordErrors.join('\n- ')}`);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          setupCompleted: false, // Define status do setup inicial
        },
      },
    });

    setLoading(false);

    if (error) {
      Alert.alert('Erro de Cadastro', error.message);
    } else if (data.session) {
      // Login automático e redirecionamento tratados pelo AuthProvider
      Alert.alert('Sucesso', 'Sua conta foi criada!');
    } else {
      Alert.alert('Verificação necessária', 'Verifique seu e-mail para confirmar a conta.');
      router.replace('/login' as any);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      className="flex-1 bg-bg-dark"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} className="px-6">
        <View className="px-6 py-10">
          <View className="mb-10">
            <Text className="text-accent text-4xl font-epilogue-bold mb-2">Criar Conta</Text>
            <Text className="text-soft text-base font-epilogue">
              Junte-se a nós e comece a monitorar suas crises
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-soft font-epilogue-semi mb-2 ml-1">Nome Completo</Text>
            <TextInput
              className="w-full bg-card-dark text-soft font-epilogue p-4 rounded-2xl border border-[#334155]"
              placeholder="Como quer ser chamado?"
              placeholderTextColor={Colors.muted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View className="mb-6">
            <Text className="text-soft font-epilogue-semi mb-2 ml-1">E-mail</Text>
            <TextInput
              className={`w-full bg-card-dark text-soft font-epilogue p-4 rounded-2xl border ${emailError ? 'border-red-500' : 'border-[#334155]'}`}
              placeholder="Seu melhor e-mail"
              placeholderTextColor={Colors.muted}
              value={email}
              onChangeText={handleEmailChange}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {emailError ? <Text className="text-red-500 font-epilogue text-sm mt-2 ml-1">{emailError}</Text> : null}
          </View>

          <View className="mb-6">
            <Text className="text-soft font-epilogue-semi mb-2 ml-1">Senha</Text>
            <View className="relative">
              <TextInput
                className={`w-full bg-card-dark text-soft font-epilogue p-4 rounded-2xl border ${passwordError ? 'border-red-500' : 'border-[#334155]'}`}
                placeholder="Crie uma senha forte"
                placeholderTextColor={Colors.muted}
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                editable={!loading}
                selectionColor="#64748b"
              />
              <TouchableOpacity
                className="absolute right-4 top-4"
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color={Colors.muted}
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text className="text-red-500 font-epilogue text-sm mt-2 ml-1">{passwordError}</Text> : null}
          </View>

          <View className="mb-8">
            <Text className="text-soft font-epilogue-semi mb-2 ml-1">Confirmar Senha</Text>
            <View className="relative">
              <TextInput
                className={`w-full bg-card-dark text-soft font-epilogue p-4 rounded-2xl border ${confirmPasswordError ? 'border-red-500' : 'border-[#334155]'}`}
                placeholder="Repita sua senha"
                placeholderTextColor={Colors.muted}
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
                selectionColor="#64748b"
              />
              <TouchableOpacity
                className="absolute right-4 top-4"
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color={Colors.muted}
                />
              </TouchableOpacity>
            </View>
            {confirmPasswordError ? <Text className="text-red-500 font-epilogue text-sm mt-2 ml-1">{confirmPasswordError}</Text> : null}
          </View>

          <TouchableOpacity
            className={`w-full bg-accent p-4 rounded-2xl items-center justify-center flex-row ${loading || emailError || passwordError || confirmPasswordError ? 'opacity-70' : ''}`}
            onPress={handleRegister}
            disabled={loading || !!emailError || !!passwordError || !!confirmPasswordError}
          >
            {loading ? (
              <ActivityIndicator color={Colors.bgDark} />
            ) : (
              <Text className="text-bg-dark font-epilogue-bold text-lg">Cadastrar</Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center mt-8">
            <Text className="text-muted font-epilogue">Já tem uma conta? </Text>
            <Link href={"/login" as any} asChild>
              <TouchableOpacity>
                <Text className="text-accent font-epilogue-bold">Entrar</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
