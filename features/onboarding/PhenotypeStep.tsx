import { router } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';
import OptionCard from '@/components/ui/OptionCard';
import SetupStep from '@/features/onboarding/SetupStep';
import { useSetup } from '@/features/onboarding/SetupContext';

type OptionValue = '2' | '7' | '12' | '16' | 'unknown';

interface Option {
  value: OptionValue;
  label: string;
  sublabel: string;
  userType: 'episodic' | 'chronic' | null;
}

const OPTIONS: Option[] = [
  {
    value: '2',
    label: '1 - 4 dias',
    sublabel: 'Raramente',
    userType: 'episodic',
  },
  {
    value: '7',
    label: '5 - 9 dias',
    sublabel: 'Às vezes',
    userType: 'episodic',
  },
  {
    value: '12',
    label: '10 - 14 dias',
    sublabel: 'Com frequência',
    userType: 'episodic',
  },
  {
    value: '16',
    label: '15 dias ou mais',
    sublabel: 'Quase todo dia',
    userType: 'chronic',
  },
  {
    value: 'unknown',
    label: 'Não sei',
    sublabel: 'Posso descobrir depois',
    userType: null,
  },
];

export default function PhenotypeStep() {
  const { updateSetupData } = useSetup();
  const [selected, setSelected] = useState<OptionValue | null>(null);

  const selectedOption = OPTIONS.find((o) => o.value === selected) ?? null;
  const isValid = selected !== null;

  function handleNext() {
    if (!isValid || !selectedOption) return;

    if (selectedOption.value !== 'unknown') {
      updateSetupData({
        frequency: selectedOption.label,
      });
    }

    router.push({
      pathname: '/(setup)/step2',
    });
  }

  return (
    <SetupStep
      step={1}
      title="Com que frequência você tem crises?"
      subtitle="Pense nos últimos 3 meses. Inclua dias com dor leve ou moderada também."
      previousRoute="/(setup)/intro"
      canContinue={isValid}
      onContinue={handleNext}
    >
      <View accessibilityRole="radiogroup" className="gap-2">
        {OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            description={option.sublabel}
            icon={CalendarDays}
            mode="radio"
            checked={selected === option.value}
            onPress={() => setSelected(option.value)}
          />
        ))}
      </View>
    </SetupStep>
  );
}
