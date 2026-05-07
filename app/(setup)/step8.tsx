import { router } from 'expo-router';
import React, { useState } from 'react';
import { useSetup } from '../../contexts/SetupContext';
import {
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';



type FrequencyOption = 'as_needed' | 'early' | 'daily' | 'avoid' | null;
type EffectivenessOption = 'very_effective' | 'partial' | 'ineffective' | null;



const TOTAL_STEPS = 9;
const CURRENT_STEP = 8;

const FREQUENCY_OPTIONS = [
    {
        value: 'as_needed' as FrequencyOption,
        label: 'Só quando a dor já está forte',
        sublabel: 'Aguardo piorar antes de tomar',
        emoji: '⏱️',
        risk: 'medium',
        color: '#F5A623',
        feedback: 'Tomar cedo costuma ser mais eficaz. O app pode te lembrar de agir antes.',
    },
    {
        value: 'early' as FrequencyOption,
        label: 'Logo nos primeiros sintomas',
        sublabel: 'Tomo assim que percebo a crise',
        emoji: '⚡',
        risk: 'low',
        color: '#00BFA5',
        feedback: 'Ótima estratégia. Agir cedo aumenta muito a eficácia dos abortivos.',
    },
    {
        value: 'daily' as FrequencyOption,
        label: 'Quase todo dia',
        sublabel: 'Uso frequente para controlar a dor',
        emoji: '📅',
        risk: 'high',
        color: '#E85D75',
        feedback: 'Uso diário pode causar cefaleia por uso excessivo. O app vai monitorar isso de perto.',
    },
    {
        value: 'avoid' as FrequencyOption,
        label: 'Evito ao máximo tomar remédio',
        sublabel: 'Prefiro métodos não medicamentosos',
        emoji: '🌿',
        risk: 'low',
        color: '#00BFA5',
        feedback: 'Válido! O app vai te ajudar a registrar o que funciona para você.',
    },
];

const EFFECTIVENESS_OPTIONS = [
    {
        value: 'very_effective' as EffectivenessOption,
        label: 'Funciona bem',
        emoji: '✅',
        color: '#00BFA5',
    },
    {
        value: 'partial' as EffectivenessOption,
        label: 'Funciona parcialmente',
        emoji: '🔶',
        color: '#F5A623',
    },
    {
        value: 'ineffective' as EffectivenessOption,
        label: 'Quase não resolve',
        emoji: '❌',
        color: '#E85D75',
    },
];



export default function Step8Abortivos() {
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
        <View style={{ flex: 1, backgroundColor: '#0D2137' }}>
            <StatusBar barStyle="light-content" backgroundColor="#0D2137" />

            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Cabeçalho ── */}
                <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 8 }}>

                    {/* Barra de progresso */}
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

                    {/* Rótulo */}
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
                        Passo {CURRENT_STEP} de {TOTAL_STEPS} · Uso Abortivo
                    </Text>

                    {/* Título */}
                    <Text
                        style={{
                            fontSize: 26,
                            fontWeight: '700',
                            color: '#FFFFFF',
                            lineHeight: 34,
                            marginBottom: 8,
                        }}
                    >
                        Como você usa seus remédios durante uma crise?
                    </Text>

                    {/* Subtítulo */}
                    <Text style={{ fontSize: 15, color: '#7A99B2', lineHeight: 22 }}>
                        O padrão de uso abortivo ajuda a identificar risco de dependência e orientar seu tratamento.
                    </Text>
                </View>

                {/* ── Badge de feedback ── */}
                <View style={{ paddingHorizontal: 24, marginTop: 20, minHeight: 64 }}>
                    {selectedFrequency && (
                        <View
                            style={{
                                backgroundColor: selectedFrequency.color + '18',
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: selectedFrequency.color + '40',
                                padding: 14,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 10,
                            }}
                        >
                            <View
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: selectedFrequency.color,
                                }}
                            />
                            <Text
                                style={{
                                    fontSize: 13,
                                    color: selectedFrequency.color,
                                    fontWeight: '600',
                                    flex: 1,
                                    lineHeight: 18,
                                }}
                            >
                                {selectedFrequency.feedback}
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── Frequência de uso ── */}
                <View style={{ paddingHorizontal: 24, marginTop: 12, gap: 10 }}>
                    {FREQUENCY_OPTIONS.map((option) => {
                        const isSelected = frequency === option.value;
                        return (
                            <TouchableOpacity
                                key={option.value}
                                onPress={() => setFrequency(option.value)}
                                activeOpacity={0.8}
                                style={{
                                    backgroundColor: isSelected ? option.color + '18' : '#112236',
                                    borderWidth: 1.5,
                                    borderColor: isSelected ? option.color : '#1E3A52',
                                    borderRadius: 16,
                                    paddingVertical: 16,
                                    paddingHorizontal: 20,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 14,
                                }}
                            >
                                <Text style={{ fontSize: 24 }}>{option.emoji}</Text>
                                <View style={{ flex: 1, gap: 2 }}>
                                    <Text
                                        style={{
                                            fontSize: 15,
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

                                {/* Radio */}
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

                {/* ── Eficácia (aparece após selecionar frequência) ── */}
                {frequency && (
                    <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
                        <Text
                            style={{
                                fontSize: 15,
                                fontWeight: '600',
                                color: '#FFFFFF',
                                marginBottom: 4,
                            }}
                        >
                            No geral, o remédio resolve sua crise?
                        </Text>
                        <Text style={{ fontSize: 13, color: '#7A99B2', marginBottom: 16 }}>
                            Isso ajuda o app a entender a eficácia do seu tratamento atual.
                        </Text>

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            {EFFECTIVENESS_OPTIONS.map((option) => {
                                const isSelected = effectiveness === option.value;
                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        onPress={() => setEffectiveness(option.value)}
                                        activeOpacity={0.8}
                                        style={{
                                            flex: 1,
                                            backgroundColor: isSelected ? option.color + '18' : '#112236',
                                            borderWidth: 1.5,
                                            borderColor: isSelected ? option.color : '#1E3A52',
                                            borderRadius: 14,
                                            paddingVertical: 16,
                                            alignItems: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        <Text style={{ fontSize: 22 }}>{option.emoji}</Text>
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                fontWeight: '600',
                                                color: isSelected ? option.color : '#7A99B2',
                                                textAlign: 'center',
                                            }}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* ── Botão de avançar ── */}
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