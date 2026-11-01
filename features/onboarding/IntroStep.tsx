import { router } from 'expo-router';
import React from 'react';
import Button from '@/components/ui/Button';
import Screen from '@/components/ui/Screen';
import Text from '@/components/ui/Text';

export default function IntroStep() {
  function handleStart() {
    router.push('/(setup)/step1');
  }

  return (
    <Screen
      scroll
      className="gap-4 pt-14"
      footer={
        <Button
          title="Começar"
          accessibilityLabel="Começar o questionário de personalização"
          className="flex-1"
          onPress={handleStart}
        />
      }
    >
      <Text variant="title" className="text-center">
        Vamos conhecer você melhor
      </Text>

      <Text tone="muted" className="text-center">
        Antes de começar a usar o Livo, vamos fazer algumas perguntas sobre
        sua saúde e seus hábitos. Suas respostas ajudarão o aplicativo a
        oferecer uma experiência mais personalizada.
      </Text>

      <Text tone="muted" className="text-center">
        Serão 9 perguntas sobre temas como sono, frequência das crises,
        medicamentos e outras condições de saúde.
      </Text>
    </Screen>
  );
}
