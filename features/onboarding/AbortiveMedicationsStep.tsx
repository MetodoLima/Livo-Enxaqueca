import { router } from 'expo-router';
import { Check, Minus, Pill, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';
import OptionCard from '@/components/ui/OptionCard';
import Text from '@/components/ui/Text';
import SetupStep from '@/features/onboarding/SetupStep';
import { useSetup } from '@/features/onboarding/SetupContext';

type FrequencyOption = 'as_needed' | 'early' | 'daily' | 'avoid' | null;
type EffectivenessOption = 'very_effective' | 'partial' | 'ineffective' | null;

const FREQUENCY_OPTIONS = [
    {
        value: 'as_needed' as FrequencyOption,
        label: 'Só quando a dor já está forte',
        sublabel: 'Aguardo piorar antes de tomar',
    },
    {
        value: 'early' as FrequencyOption,
        label: 'Logo nos primeiros sintomas',
        sublabel: 'Tomo assim que percebo a crise',
    },
    {
        value: 'daily' as FrequencyOption,
        label: 'Quase todo dia',
        sublabel: 'Uso frequente para controlar a dor',
    },
    {
        value: 'avoid' as FrequencyOption,
        label: 'Evito ao máximo tomar remédio',
        sublabel: 'Prefiro métodos não medicamentosos',
    },
];

const EFFECTIVENESS_OPTIONS = [
    {
        value: 'very_effective' as EffectivenessOption,
        label: 'Funciona bem',
        icon: Check,
    },
    {
        value: 'partial' as EffectivenessOption,
        label: 'Funciona parcialmente',
        icon: Minus,
    },
    {
        value: 'ineffective' as EffectivenessOption,
        label: 'Quase não resolve',
        icon: X,
    },
];

export default function AbortiveMedicationsStep() {
    const { updateSetupData } = useSetup();

    const [frequency, setFrequency] = useState<FrequencyOption>(null);
    const [effectiveness, setEffectiveness] = useState<EffectivenessOption>(null);

    const selectedFrequency = FREQUENCY_OPTIONS.find((o) => o.value === frequency) ?? null;
    const selectedEffectiveness = EFFECTIVENESS_OPTIONS.find((o) => o.value === effectiveness) ?? null;

    const isValid = frequency !== null && effectiveness !== null;

    function handleNext() {
        if (!isValid || !selectedFrequency || !selectedEffectiveness) return;

        updateSetupData({
            abortiveFrequency: selectedFrequency.label,
            abortiveEffectiveness: selectedEffectiveness.label,
        });

        router.push({
            pathname: '/(setup)/step9',
        });
    }

    return (
        <SetupStep
            step={8}
            title="Como você usa seus remédios durante uma crise?"
            subtitle="O padrão de uso de medicamentos ajuda a entender sua rotina e orientar seu acompanhamento."
            previousRoute="/(setup)/step7"
            canContinue={isValid}
            onContinue={handleNext}
        >
            <View accessibilityRole="radiogroup" className="gap-2">
                {FREQUENCY_OPTIONS.map((option) => (
                    <OptionCard
                        key={option.value}
                        label={option.label}
                        description={option.sublabel}
                        icon={Pill}
                        mode="radio"
                        checked={frequency === option.value}
                        onPress={() => setFrequency(option.value)}
                    />
                ))}
            </View>

            {frequency && (
                <View className="gap-3">
                    <Text variant="heading">No geral, o remédio resolve sua crise?</Text>
                    <Text variant="caption" tone="muted">
                        Isso ajuda o app a entender a eficácia do seu tratamento atual.
                    </Text>

                    <View accessibilityRole="radiogroup" className="gap-2">
                        {EFFECTIVENESS_OPTIONS.map((option) => (
                            <OptionCard
                                key={option.value}
                                label={option.label}
                                icon={option.icon}
                                mode="radio"
                                checked={effectiveness === option.value}
                                onPress={() => setEffectiveness(option.value)}
                            />
                        ))}
                    </View>
                </View>
            )}
        </SetupStep>
    );
}
