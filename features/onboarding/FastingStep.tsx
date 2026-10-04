import { router } from 'expo-router';
import React, { useState } from 'react';
import { useSetup } from '@/features/onboarding/SetupContext';
import { SetupBackButton } from '@/components/SetupBackButton';
import {
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type MealFrequency = 'regular' | 'fasting' | 'irregular' | null;

interface Option {
    value: MealFrequency;
    label: string;
    sublabel: string;
    color: string;
}

const TOTAL_STEPS = 9;
const CURRENT_STEP = 5;

const OPTIONS: Option[] = [
    {
        value: 'regular',
        label: 'Regular',
        sublabel: 'Como a cada 3h aproximadamente',
        color: '#00BFA5',
    },
    {
        value: 'fasting',
        label: 'Longos períodos de jejum',
        sublabel: 'Fico muitas horas sem comer',
        color: '#00BFA5',
    },
    {
        value: 'irregular',
        label: 'Irregular',
        sublabel: 'Varia bastante de dia para dia',
        color: '#00BFA5',
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
        <View style={{ flex: 1, backgroundColor: '#0D2137' }}>
            <StatusBar barStyle="light-content" backgroundColor="#0D2137" />

            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 8 }}>
                    <SetupBackButton fallbackRoute="/(setup)/step4" />

                    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 32 }}>
                        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                            <View
                                key={i}
                                style={{
                                    flex: 1,
                                    height: 4,
                                    borderRadius: 2,
                                    backgroundColor: i < CURRENT_STEP ? '#00BFA5' : '#1E3A52',
                                }}
                            />
                        ))}
                    </View>

                    <Text
                        style={{
                            fontSize: 12,
                            fontWeight: '600',
                            letterSpacing: 1.5,
                            color: '#00BFA5',
                            textTransform: 'uppercase',
                            marginBottom: 8,
                        }}
                    >
                        Passo {CURRENT_STEP} de {TOTAL_STEPS} · Gatilhos Alimentares
                    </Text>

                    <Text
                        style={{
                            fontSize: 26,
                            fontWeight: '700',
                            color: '#FFFFFF',
                            lineHeight: 34,
                            marginBottom: 8,
                        }}
                    >
                        Qual a frequência das suas refeições?
                    </Text>

                    <Text style={{ fontSize: 15, color: '#7A99B2', lineHeight: 22 }}>
                        O jejum é um dos principais gatilhos metabólicos de enxaqueca. Queremos entender seu padrão.
                    </Text>
                </View>

                <View style={{ paddingHorizontal: 24, marginTop: 24, gap: 12 }}>
                    {OPTIONS.map((option) => {
                        const isSelected = selected === option.value;
                        return (
                            <TouchableOpacity
                                key={option.value}
                                onPress={() => setSelected(option.value)}
                                activeOpacity={0.8}
                                style={{
                                    backgroundColor: isSelected ? option.color + '18' : '#112236',
                                    borderWidth: 1.5,
                                    borderColor: isSelected ? option.color : '#1E3A52',
                                    borderRadius: 16,
                                    paddingVertical: 18,
                                    paddingHorizontal: 20,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <View style={{ flex: 1, gap: 2, marginRight: 12 }}>
                                    <Text
                                        style={{
                                            fontSize: 16,
                                            fontWeight: '600',
                                            color: isSelected ? option.color : '#FFFFFF',
                                        }}
                                    >
                                        {option.label}
                                    </Text>
                                    <Text style={{ fontSize: 13, color: '#4A6A82' }}>
                                        {option.sublabel}
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: 11,
                                        borderWidth: 2,
                                        borderColor: isSelected ? option.color : '#1E3A52',
                                        backgroundColor: isSelected ? option.color : 'transparent',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {isSelected && (
                                        <View
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: 4,
                                                backgroundColor: '#FFFFFF',
                                            }}
                                        />
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
                    <TouchableOpacity
                        onPress={handleNext}
                        disabled={!isValid}
                        style={{
                            backgroundColor: isValid ? '#00BFA5' : '#1E3A52',
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
                                color: isValid ? '#FFFFFF' : '#3A5A72',
                                letterSpacing: 0.3,
                            }}
                        >
                            Continuar
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}