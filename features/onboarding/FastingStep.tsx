import { router } from 'expo-router';
import { Clock } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';
import OptionCard from '@/components/ui/OptionCard';
import SetupStep from '@/features/onboarding/SetupStep';
import { useSetup } from '@/features/onboarding/SetupContext';

type MealFrequency = 'regular' | 'fasting' | 'irregular' | null;

interface Option {
    value: MealFrequency;
    label: string;
    sublabel: string;
}

const OPTIONS: Option[] = [
    {
        value: 'regular',
        label: 'Regular',
        sublabel: 'Como a cada 3h aproximadamente',
    },
    {
        value: 'fasting',
        label: 'Longos períodos de jejum',
        sublabel: 'Fico muitas horas sem comer',
    },
    {
        value: 'irregular',
        label: 'Irregular',
        sublabel: 'Varia bastante de dia para dia',
    },
];

export default function FastingStep() {
    const { updateSetupData } = useSetup();
    const [selected, setSelected] = useState<MealFrequency>(null);

    const selectedOption = OPTIONS.find((o) => o.value === selected) ?? null;
    const isValid = selected !== null;

    function handleNext() {
        if (!isValid || !selectedOption) return;

        updateSetupData({
            mealFrequency: selectedOption.label,
        });

        router.push({
            pathname: '/(setup)/step6',
        });
    }

    return (
        <SetupStep
            step={5}
            title="Qual a frequência das suas refeições?"
            subtitle="O jejum é um dos principais gatilhos metabólicos de enxaqueca. Queremos entender seu padrão."
            previousRoute="/(setup)/step4"
            canContinue={isValid}
            onContinue={handleNext}
        >
            <View accessibilityRole="radiogroup" className="gap-2">
                {OPTIONS.map((option) => (
                    <OptionCard
                        key={option.value}
                        label={option.label}
                        description={option.sublabel}
                        icon={Clock}
                        mode="radio"
                        checked={selected === option.value}
                        onPress={() => setSelected(option.value)}
                    />
                ))}
            </View>
        </SetupStep>
    );
}
