import Slider from '@react-native-community/slider';
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

const TOTAL_STEPS = 9;
const CURRENT_STEP = 4;

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
        <View style={{ flex: 1, backgroundColor: '#0D2137' }}>
            <StatusBar barStyle="light-content" backgroundColor="#0D2137" />

            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 8 }}>
                    <SetupBackButton fallbackRoute="/(setup)/step3" />

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
                        Passo {CURRENT_STEP} de {TOTAL_STEPS} · Sono
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
                        Quantas horas você dorme em dias sem dor?
                    </Text>

                    <Text style={{ fontSize: 15, color: '#7A99B2', lineHeight: 22 }}>
                        Esse valor vira sua linha de base para acompanhar seus hábitos no dia a dia.
                    </Text>
                </View>

                <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
                    <View
                        style={{
                            backgroundColor: '#112236',
                            borderRadius: 20,
                            borderWidth: 1.5,
                            borderColor: '#00BFA540',
                            padding: 28,
                            alignItems: 'center',
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 72,
                                fontWeight: '800',
                                color: '#00BFA5',
                                includeFontPadding: false,
                            }}
                        >
                            {formatHours(hours)}
                        </Text>

                        <Text style={{ fontSize: 14, color: '#4A6A82', marginBottom: 28 }}>
                            por noite
                        </Text>

                        <Slider
                            style={{ width: '100%', height: 40 }}
                            minimumValue={MIN_HOURS}
                            maximumValue={MAX_HOURS}
                            step={1}
                            value={hours}
                            onValueChange={(val) => {
                                setHours(val);
                            }}
                            minimumTrackTintColor="#00BFA5"
                            maximumTrackTintColor="#1E3A52"
                            thumbTintColor="#00BFA5"
                        />

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

                <View style={{ paddingHorizontal: 24, marginTop: 40 }}>
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