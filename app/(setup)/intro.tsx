import { router } from 'expo-router';
import React from 'react';
import {
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SetupIntro() {
  function handleStart() {
    router.push('/(setup)/step1');
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: '#0D2137' }}
      accessible={true}
      accessibilityRole="summary"
    >
      <StatusBar barStyle="light-content" backgroundColor="#0D2137" />

      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          justifyContent: 'center',
        }}
      >
        <Text
          accessibilityRole="header"
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: '#FFFFFF',
            lineHeight: 36,
            marginBottom: 24,
          }}
        >
          Vamos conhecer você melhor
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: '#7A99B2',
            lineHeight: 24,
            marginBottom: 16,
          }}
        >
          Antes de começar a usar o Livo, vamos fazer algumas perguntas sobre
          sua saúde e seus hábitos. Suas respostas ajudarão o aplicativo a
          oferecer uma experiência mais personalizada.
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: '#7A99B2',
            lineHeight: 24,
          }}
        >
          Serão 9 perguntas sobre temas como sono, frequência das crises,
          medicamentos e outras condições de saúde.
        </Text>
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        <TouchableOpacity
          onPress={handleStart}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Começar o questionário de personalização"
          style={{
            backgroundColor: '#00BFA5',
            borderRadius: 16,
            paddingVertical: 18,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '700',
              color: '#FFFFFF',
              letterSpacing: 0.3,
            }}
          >
            Começar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
