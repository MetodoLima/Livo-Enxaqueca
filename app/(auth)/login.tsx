import { Link } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Erro de Login', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-bg-dark"
    >
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-10">
          <Text className="text-accent text-5xl font-epilogue-bold mb-2">Livo</Text>
          <Text className="text-soft text-lg font-epilogue text-center">
            Sua jornada para o bem-estar começa aqui
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-soft font-epilogue-semi mb-2 ml-1">E-mail</Text>
          <TextInput
            className="w-full bg-card-dark text-soft font-epilogue p-4 rounded-2xl border border-[#334155]"
            placeholder="Digite seu e-mail"
            placeholderTextColor={Colors.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View className="mb-8">
          <Text className="text-soft font-epilogue-semi mb-2 ml-1">Senha</Text>
          <TextInput
            className="w-full bg-card-dark text-soft font-epilogue p-4 rounded-2xl border border-[#334155]"
            placeholder="Digite sua senha"
            placeholderTextColor={Colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          className={`w-full bg-accent p-4 rounded-2xl items-center justify-center flex-row ${loading ? 'opacity-70' : ''}`}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.bgDark} />
          ) : (
            <Text className="text-bg-dark font-epilogue-bold text-lg">Entrar</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-8">
          <Text className="text-muted font-epilogue">Ainda não tem uma conta? </Text>
          <Link href={"/register" as any} asChild>
            <TouchableOpacity>
              <Text className="text-accent font-epilogue-bold">Cadastre-se</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
