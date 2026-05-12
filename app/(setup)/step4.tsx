import Slider from '@react-native-community/slider';
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

const TOTAL_STEPS = 9;
const CURRENT_STEP = 4;

const MIN_HOURS = 3; // 3 representa "4h-"
const MAX_HOURS = 13; // 13 representa "12h+"

function formatHours(value: number): string {
    if (value <= 3) return '4h-';
    if (value >= 13) return '12h+';
    return `${value}h`;
}

function getSleepFeedback(value: number): { label: string; color: string; description: string } {
    if (value <= 3)
        return {
            label: 'Sono muito insuficiente',
            color: '#E85D75',
            description: 'Menos de 4h é um gatilho severo de crises.',
        };
    if (value < 6)
        return {
            label: 'Sono insuficiente',
            color: '#E85D75',
            description: 'Menos de 6h é um gatilho frequente de crises.',
        };
    if (value <= 6)
        return {
            label: 'Sono adequado',
            color: '#F5A623',
            description: 'Próximo do ideal. Tente manter consistência.',
        };
    if (value === 7)
        return {
            label: 'Sono ideal',
            color: '#00BFA5',
            description: 'Ótima faixa para reduzir o risco de crises.',
        };
    if (value <= 9)
        return {
            label: 'Sono ideal',
            color: '#00BFA5',
            description: 'Ótima faixa para reduzir o risco de crises.',
        };
    if (value <= 11)
        return {
            label: 'Sono excessivo',
            color: '#F5A623',
            description: 'Dormir mais de 9h também pode desencadear crises.',
        };
    return {
        label: 'Sono excessivo',
        color: '#E85D75',
        description: 'Dormir mais de 9h também pode desencadear crises.',
    };
}

export default function Step4Sono() {
    const { updateSetupData } = useSetup();

    const [hours, setHours] = useState<number>(7);
    const [touched, setTouched] = useState(false);

    const feedback = getSleepFeedback(hours);

    function handleNext() {
        updateSetupData({
            sleepBaseline: hours >= 13 ? 12.5 : hours <= 3 ? 3.5 : hours,
        });

        router.push({ pathname: '/(setup)/step5' });
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

                    {/* Rótulo do passo */}
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
                        Passo {CURRENT_STEP} de {TOTAL_STEPS} · Sono
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
                        Quantas horas você dorme em dias sem dor?
                    </Text>

                    {/* Subtítulo */}
                    <Text style={{ fontSize: 15, color: '#7A99B2', lineHeight: 22 }}>
                        Esse valor vira sua linha de base. O app vai te alertar quando seu sono desviar muito disso.
                    </Text>
                </View>

                {/* ── Card do slider ── */}
                <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
                    <View
                        style={{
                            backgroundColor: '#112236',
                            borderRadius: 20,
                            borderWidth: 1.5,
                            borderColor: feedback.color + '60',
                            padding: 28,
                            alignItems: 'center',
                        }}
                    >
                        {/* Valor grande */}
                        <Text
                            style={{
                                fontSize: 72,
                                fontWeight: '800',
                                color: feedback.color,
                                includeFontPadding: false,
                            }}
                        >
                            {formatHours(hours)}
                        </Text>

                        <Text style={{ fontSize: 14, color: '#4A6A82', marginBottom: 28 }}>
                            por noite
                        </Text>

                        {/* Slider */}
                        <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={MIN_HOURS}
                            maximumValue={MAX_HOURS}
                            step={1}
                            value={hours}
                            onValueChange={(val) => {
                                setHours(val);
                                if (!touched) setTouched(true);
                            }}
                            minimumTrackTintColor={feedback.color}
                            maximumTrackTintColor="#1E3A52"
                            thumbTintColor={feedback.color}
                        />

                        {/* Labels min/max */}
                        <View
                            style={{
                                width: '100%',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                marginTop: 4,
                            }}
                        >
                            <Text style={{ fontSize: 12, color: '#4A6A82' }}>4h-</Text>
                            <Text style={{ fontSize: 12, color: '#4A6A82' }}>12h+</Text>
                        </View>
                    </View>
                </View>

                {/* ── Badge de feedback ── */}
                <View style={{ paddingHorizontal: 24, marginTop: 16, minHeight: 56 }}>
                    {touched && (
                        <View
                            style={{
                                backgroundColor: feedback.color + '18',
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: feedback.color + '40',
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
                                    backgroundColor: feedback.color,
                                }}
                            />
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        fontSize: 13,
                                        fontWeight: '700',
                                        color: feedback.color,
                                        marginBottom: 2,
                                    }}
                                >
                                    {feedback.label}
                                </Text>
                                <Text style={{ fontSize: 13, color: '#7A99B2', lineHeight: 18 }}>
                                    {feedback.description}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* ── Marcadores de referência ── */}
                <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
                    <Text
                        style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: '#4A6A82',
                            letterSpacing: 1,
                            textTransform: 'uppercase',
                            marginBottom: 12,
                        }}
                    >
                        Referência
                    </Text>

                    <View style={{ gap: 8 }}>
                        {[
                            { range: 'Menos de 6h', label: 'Gatilho de risco', color: '#E85D75' },
                            { range: '7h – 9h', label: 'Faixa ideal', color: '#00BFA5' },
                            { range: 'Mais de 9h', label: 'Pode causar crises', color: '#F5A623' },
                        ].map((item) => (
                            <View
                                key={item.range}
                                style={{
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
                                        backgroundColor: item.color,
                                    }}
                                />
                                <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '500', width: 100 }}>
                                    {item.range}
                                </Text>
                                <Text style={{ fontSize: 13, color: '#4A6A82' }}>{item.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ── Botão de avançar ── */}
                <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
                    <TouchableOpacity
                        onPress={handleNext}
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
                            Continuar
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}