import { router } from 'expo-router';
import { Check, CircleAlert, PenLine, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';
import Notice from '@/components/ui/Notice';
import OptionCard from '@/components/ui/OptionCard';
import Text from '@/components/ui/Text';
import SetupStep from '@/features/onboarding/SetupStep';
import { useSetup } from '@/features/onboarding/SetupContext';

type HasSigns = 'yes' | 'no' | null;

interface Sign {
  id: string;
  label: string;
  description: string;
  emoji: string;
}

const PREMONITORY_SIGNS: Sign[] = [
  {
    id: 'yawning',
    label: 'Bocejos repetitivos',
    description: 'Bocejos frequentes sem estar com sono',
    emoji: '🥱',
  },
  {
    id: 'food_craving',
    label: 'Fome por alimentos específicos',
    description: 'Vontade súbita de comer algo em particular',
    emoji: '🍫',
  },
  {
    id: 'irritability',
    label: 'Irritabilidade',
    description: 'Mudança de humor ou sensação de tensão',
    emoji: '😤',
  },
  {
    id: 'neck_stiffness',
    label: 'Rigidez no pescoço',
    description: 'Tensão ou dor na nuca e ombros',
    emoji: '😣',
  },
  {
    id: 'fatigue',
    label: 'Cansaço excessivo',
    description: 'Fadiga intensa mesmo sem esforço físico',
    emoji: '😴',
  },
  {
    id: 'concentration',
    label: 'Dificuldade de concentração',
    description: 'Mente embaralhada, dificuldade de focar',
    emoji: '🧠',
  },
  {
    id: 'fluid_retention',
    label: 'Retenção de líquido',
    description: 'Sensação de inchaço ou peso no corpo',
    emoji: '💧',
  },
  {
    id: 'muscle_pain',
    label: 'Dor muscular',
    description: 'Tensão ou dor nos músculos sem causa aparente',
    emoji: '💪',
  },
  {
    id: 'nausea',
    label: 'Náusea leve',
    description: 'Enjoo antes mesmo da dor começar',
    emoji: '🤢',
  },
  {
    id: 'light_sensitivity',
    label: 'Sensibilidade à luz',
    description: 'Incômodo com claridade antes da crise',
    emoji: '🌟',
  },
];

export default function PremonitoryStep() {
  const { updateSetupData } = useSetup();

  const [hasSigns, setHasSigns] = useState<HasSigns>(null);
  const [selectedSigns, setSelectedSigns] = useState<string[]>([]);
  const [showOther, setShowOther] = useState(false);

  const isValid =
    hasSigns === 'no' ||
    (hasSigns === 'yes' && (selectedSigns.length > 0 || showOther));

  function handleHasSigns(value: HasSigns) {
    setHasSigns(value);
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

    const hasSignsLabel = hasSigns === 'yes' ? 'true' : 'false';
    const premonitorySignsLabels = selectedSigns
      .map((id) => PREMONITORY_SIGNS.find((s) => s.id === id)?.label)
      .filter(Boolean) as string[];

    if (showOther) {
      premonitorySignsLabels.push('Outro');
    }

    updateSetupData({
      hasSigns: hasSignsLabel,
      premonitorySigns: premonitorySignsLabels,
    });

    router.push({ pathname: '/(setup)/step3' });
  }

  return (
    <SetupStep
      step={2}
      title="Você percebe sinais antes da dor começar?"
      subtitle="Alguns sintomas aparecem horas antes da crise. Isso ajuda o app a te alertar com antecedência."
      previousRoute="/(setup)/step1"
      canContinue={isValid}
      onContinue={handleNext}
    >
      <View accessibilityRole="radiogroup" className="gap-2">
        <OptionCard
          label="Sim, percebo"
          icon={Check}
          mode="radio"
          checked={hasSigns === 'yes'}
          onPress={() => handleHasSigns('yes')}
        />
        <OptionCard
          label="Não percebo"
          icon={X}
          mode="radio"
          checked={hasSigns === 'no'}
          onPress={() => handleHasSigns('no')}
        />
      </View>

      {hasSigns === 'yes' && (
        <View className="gap-3">
          <Text variant="heading">Quais sinais você costuma sentir?</Text>
          <Text variant="caption" tone="muted">
            Selecione todos que se aplicam.
          </Text>

          <View className="gap-2">
            {PREMONITORY_SIGNS.map((sign) => (
              <OptionCard
                key={sign.id}
                label={sign.label}
                description={sign.description}
                emoji={sign.emoji}
                mode="checkbox"
                checked={selectedSigns.includes(sign.id)}
                onPress={() => toggleSign(sign.id)}
              />
            ))}

            <OptionCard
              label="Outro"
              description="Tenho outro sinal não listado aqui"
              icon={PenLine}
              mode="checkbox"
              checked={showOther}
              onPress={handleToggleOther}
            />
          </View>
        </View>
      )}

      {hasSigns === 'no' && (
        <Notice icon={CircleAlert}>
          Tudo bem! Com o tempo, o app pode te ajudar a identificar padrões que você ainda não percebeu.
        </Notice>
      )}
    </SetupStep>
  );
}
