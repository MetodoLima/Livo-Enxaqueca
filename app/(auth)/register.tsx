import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/Colors';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
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
              className="w-full bg-card-dark text-soft font-epilogue p-4 rounded-2xl border border-[#334155]"
              placeholder="Seu melhor e-mail"
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
              placeholder="Crie uma senha forte"
              placeholderTextColor={Colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            className={`w-full bg-accent p-4 rounded-2xl items-center justify-center flex-row ${loading ? 'opacity-70' : ''}`}
            onPress={handleRegister}
            disabled={loading}
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
