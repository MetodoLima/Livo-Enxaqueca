import { router } from 'expo-router';
import { Check, CircleAlert, PenLine, TriangleAlert, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';
import Notice from '@/components/ui/Notice';
import OptionCard from '@/components/ui/OptionCard';
import Text from '@/components/ui/Text';
import SetupStep from '@/features/onboarding/SetupStep';
import { useSetup } from '@/features/onboarding/SetupContext';

type HasAura = 'yes' | 'no' | null;

interface AuraSign {
  id: string;
  label: string;
  description: string;
  emoji: string;
  cortexType: string;
}

const AURA_SIGNS: AuraSign[] = [
  {
    id: 'visual_flashes',
    label: 'Pontos ou faíscas luminosas',
    description: 'Manchas, ziguezagues ou flashes de luz',
    emoji: '✨',
    cortexType: 'Visual',
  },
  {
    id: 'visual_blind_spot',
    label: 'Pontos cegos ou visão turva',
    description: 'Área escura ou embaçada no campo de visão',
    emoji: '👁️',
    cortexType: 'Visual',
  },
  {
    id: 'visual_loss',
    label: 'Perda parcial da visão',
    description: 'Visão apagada em parte do campo visual',
    emoji: '🌫️',
    cortexType: 'Visual',
  },
  {
    id: 'sensory',
    label: 'Formigamento em mãos ou rosto',
    description: 'Sensação de dormência ou agulhadas',
    emoji: '🤚',
    cortexType: 'Sensorial',
  },
  {
    id: 'electric_shock',
    label: 'Sensação de choque elétrico',
    description: 'Descarga ou corrente elétrica pelo corpo',
    emoji: '⚡',
    cortexType: 'Sensorial',
  },
  {
    id: 'aphasia_speak',
    label: 'Dificuldade de falar',
    description: 'Palavras embaralhadas ou travamento ao falar',
    emoji: '💬',
    cortexType: 'Afasia',
  },
  {
    id: 'aphasia_understand',
    label: 'Dificuldade de entender',
    description: 'Dificuldade para compreender o que os outros dizem',
    emoji: '👂',
    cortexType: 'Afasia',
  },
  {
    id: 'motor',
    label: 'Fraqueza em membros',
    description: 'Sensação de peso ou dificuldade de mover',
    emoji: '🪫',
    cortexType: 'Motor',
  },
  {
    id: 'ataxia',
    label: 'Falta de equilíbrio ou coordenação',
    description: 'Dificuldade de andar ou coordenar movimentos',
    emoji: '🌀',
    cortexType: 'Motor',
  },
  {
    id: 'confusion',
    label: 'Confusão mental',
    description: 'Pensamentos embaralhados ou desorientação',
    emoji: '😵',
    cortexType: 'Cognitivo',
  },
];

export default function AuraStep() {
  const { updateSetupData } = useSetup();

  const [hasAura, setHasAura] = useState<HasAura>(null);
  const [selectedSigns, setSelectedSigns] = useState<string[]>([]);
  const [showOther, setShowOther] = useState(false);

  const isValid =
    hasAura === 'no' ||
    (hasAura === 'yes' && (selectedSigns.length > 0 || showOther));

  function handleHasAura(value: HasAura) {
    setHasAura(value);
    if (value === 'no') {
      setSelectedSigns([]);
      setShowOther(false);
    }
  }

  function toggleSign(id: string) {
    setSelectedSigns((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function handleToggleOther() {
    setShowOther((prev) => !prev);
  }

  function handleNext() {
    if (!isValid) return;

    const hasAuraLabel = hasAura === 'yes' ? 'true' : 'false';
    const auraSignsLabels = selectedSigns
      .map((id) => AURA_SIGNS.find((s) => s.id === id)?.label)
      .filter(Boolean) as string[];

    if (showOther) {
      auraSignsLabels.push('Outro');
    }

    updateSetupData({
      hasAura: hasAuraLabel,
      auraSigns: auraSignsLabels,
    });

    router.push({ pathname: '/(setup)/step4' });
  }

  const showWarning =
    selectedSigns.includes('aphasia_speak') ||
    selectedSigns.includes('aphasia_understand') ||
    selectedSigns.includes('motor') ||
    selectedSigns.includes('ataxia');

  return (
    <SetupStep
      step={3}
      title="Sua visão ou sensibilidade mudam antes da dor?"
      subtitle="A aura são sintomas neurológicos que aparecem minutos antes da crise. Ocorre em cerca de 30% dos casos."
      previousRoute="/(setup)/step2"
      canContinue={isValid}
      onContinue={handleNext}
    >
      <View accessibilityRole="radiogroup" className="gap-2">
        <OptionCard
          label="Sim, acontece"
          icon={Check}
          mode="radio"
          checked={hasAura === 'yes'}
          onPress={() => handleHasAura('yes')}
        />
        <OptionCard
          label="Não acontece"
          icon={X}
          mode="radio"
          checked={hasAura === 'no'}
          onPress={() => handleHasAura('no')}
        />
      </View>

      {hasAura === 'yes' && (
        <View className="gap-3">
          <Text variant="heading">O que você costuma sentir?</Text>
          <Text variant="caption" tone="muted">
            Selecione todos que se aplicam.
          </Text>

          <View className="gap-2">
            {AURA_SIGNS.map((sign) => (
              <OptionCard
                key={sign.id}
                label={sign.label}
                description={sign.description}
                tag={sign.cortexType.toUpperCase()}
                emoji={sign.emoji}
                mode="checkbox"
                checked={selectedSigns.includes(sign.id)}
                onPress={() => toggleSign(sign.id)}
              />
            ))}

            <OptionCard
              label="Outro"
              description="Tenho outro sintoma não listado aqui"
              icon={PenLine}
              mode="checkbox"
              checked={showOther}
              onPress={handleToggleOther}
            />
          </View>

          {showWarning && (
            <Notice icon={TriangleAlert} tone="attention">
              Sintomas como fraqueza, falta de equilíbrio ou dificuldade de fala devem ser avaliados por um neurologista para descartar outras condições.
            </Notice>
          )}
        </View>
      )}

      {hasAura === 'no' && (
        <Notice icon={CircleAlert}>
          A maioria das pessoas com enxaqueca não tem aura. Suas crises serão acompanhadas normalmente.
        </Notice>
      )}
    </SetupStep>
  );
}
