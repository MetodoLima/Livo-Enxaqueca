import Slider from '@react-native-community/slider';
import { router } from 'expo-router';
import { cssInterop } from 'nativewind';
import React, { useState } from 'react';
import { View } from 'react-native';
import Text from '@/components/ui/Text';
import { color } from '@/constants/Colors';
import SetupStep from '@/features/onboarding/SetupStep';
import { useSetup } from '@/features/onboarding/SetupContext';

cssInterop(Slider, { className: 'style' });

const MIN_HOURS = 3;
const MAX_HOURS = 13;

function formatHours(value: number): string {
    if (value <= 3) return '4h-';
    if (value >= 13) return '12h+';
    return `${value}h`;
}

export default function SleepStep() {
    const { updateSetupData } = useSetup();

    const [hours, setHours] = useState<number>(7);

    function handleNext() {
        updateSetupData({
            sleepBaseline: hours >= 13 ? 12.5 : hours <= 3 ? 3.5 : hours,
        });

        router.push({ pathname: '/(setup)/step5' });
    }

    return (
        <SetupStep
            step={4}
            title="Quantas horas você dorme em dias sem dor?"
            subtitle="Esse valor vira sua linha de base para acompanhar seus hábitos no dia a dia."
            previousRoute="/(setup)/step3"
            canContinue
            onContinue={handleNext}
        >
            <View className="items-center gap-1">
                <Text variant="hero">
                    {formatHours(hours)}
                </Text>
                <Text tone="muted">por noite</Text>
            </View>

            <View className="gap-2">
                <Slider
                    className="h-12 w-full"
                    minimumValue={MIN_HOURS}
                    maximumValue={MAX_HOURS}
                    step={1}
                    value={hours}
                    onValueChange={(val) => {
                        setHours(val);
                    }}
                    minimumTrackTintColor={color.primary}
                    maximumTrackTintColor={color.surfaceRaised}
                    thumbTintColor={color.primary}
                    accessibilityLabel="Horas de sono por noite"
                    accessibilityValue={{ text: formatHours(hours) }}
                />

                <View className="flex-row justify-between">
                    <Text variant="caption" tone="muted">4h-</Text>
                    <Text variant="caption" tone="muted">12h+</Text>
                </View>
            </View>
        </SetupStep>
    );
}
