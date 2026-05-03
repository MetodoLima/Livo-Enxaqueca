import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';



type ImpactLevel = 1 | 2 | 3 | 4 | 5 | null;
type ActivityStop = 'never' | 'sometimes' | 'often' | 'always' | null;



const TOTAL_STEPS = 9;
const CURRENT_STEP = 9;

const IMPACT_LEVELS: {
    value: ImpactLevel;
    emoji: string;
    label: string;
    sublabel: string;
    color: string;
}[] = [
        { value: 1, emoji: '😊', label: 'Quase nenhum', sublabel: 'Consigo fazer tudo normalmente', color: '#00BFA5' },
        { value: 2, emoji: '🙂', label: 'Leve', sublabel: 'Fico desconfortável mas funciono', color: '#4DD9C0' },
        { value: 3, emoji: '😐', label: 'Moderado', sublabel: 'Preciso reduzir o ritmo', color: '#F5A623' },
        { value: 4, emoji: '😣', label: 'Alto', sublabel: 'Consigo fazer muito pouco', color: '#F07040' },
        { value: 5, emoji: '🤕', label: 'Incapacitante', sublabel: 'Preciso parar tudo e me isolar', color: '#E85D75' },
    ];

const ACTIVITY_STOP_OPTIONS: {
    value: ActivityStop;
    label: string;
    sublabel: string;
    emoji: string;
    color: string;
}[] = [
        { value: 'never', label: 'Nunca preciso parar', sublabel: 'Consigo manter minha rotina', emoji: '💪', color: '#00BFA5' },
        { value: 'sometimes', label: 'Às vezes paro', sublabel: 'Em crises mais fortes', emoji: '⚖️', color: '#F5A623' },
        { value: 'often', label: 'Na maioria das crises', sublabel: 'Geralmente preciso descansar', emoji: '🛋️', color: '#F07040' },
        { value: 'always', label: 'Sempre preciso parar tudo', sublabel: 'Toda crise me tira de ação', emoji: '🛑', color: '#E85D75' },
    ];



export default function Step9Impacto() {
    const params = useLocalSearchParams();

    const [impactLevel, setImpactLevel] = useState<ImpactLevel>(null);
    const [activityStop, setActivityStop] = useState<ActivityStop>(null);

    const selectedImpact = IMPACT_LEVELS.find((o) => o.value === impactLevel) ?? null;
    const isValid = impactLevel !== null && activityStop !== null;


    const needsPreventive =
        (impactLevel ?? 0) >= 4 || activityStop === 'often' || activityStop === 'always';

    const { checkSetupStatus } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleNext() {
        if (!isValid || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { setupCompleted: true }
            });

            if (error) {
                console.error("Erro ao atualizar perfil:", error.message);
                return;
            }

            // Atualiza o estado global para acionar o redirecionamento no _layout.tsx
            await checkSetupStatus();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
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
                        Passo {CURRENT_STEP} de {TOTAL_STEPS} · Impacto
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
                        O quanto a enxaqueca afeta sua vida?
                    </Text>

                    {/* Subtítulo */}
                    <Text style={{ fontSize: 15, color: '#7A99B2', lineHeight: 22 }}>
                        Pense em como você fica durante uma crise típica. Isso define a necessidade de tratamento preventivo.
                    </Text>
                </View>

                {/* ── Escala de impacto — emojis ── */}
                <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
                    <Text
                        style={{
                            fontSize: 15,
                            fontWeight: '600',
                            color: '#FFFFFF',
                            marginBottom: 16,
                        }}
                    >
                        Nível de impacto durante uma crise
                    </Text>

                    {/* Emojis em linha */}
                    <View
                        style={{
                            backgroundColor: '#112236',
                            borderRadius: 20,
                            padding: 20,
                            alignItems: 'center',
                        }}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
                            {IMPACT_LEVELS.map((level) => {
                                const isSelected = impactLevel === level.value;
                                return (
                                    <TouchableOpacity
                                        key={level.value}
                                        onPress={() => setImpactLevel(level.value)}
                                        style={{ alignItems: 'center', gap: 6 }}
                                    >
                                        <View
                                            style={{
                                                width: 52,
                                                height: 52,
                                                borderRadius: 26,
                                                backgroundColor: isSelected ? level.color + '30' : '#0D2137',
                                                borderWidth: 2,
                                                borderColor: isSelected ? level.color : '#1E3A52',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Text style={{ fontSize: 26 }}>{level.emoji}</Text>
                                        </View>
                                        <Text
                                            style={{
                                                fontSize: 10,
                                                fontWeight: '700',
                                                color: isSelected ? level.color : '#4A6A82',
                                                textAlign: 'center',
                                            }}
                                        >
                                            {level.value}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Linha de descrição do selecionado */}
                        <View style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
                            {selectedImpact ? (
                                <View style={{ alignItems: 'center', gap: 2 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '700', color: selectedImpact.color }}>
                                        {selectedImpact.label}
                                    </Text>
                                    <Text style={{ fontSize: 13, color: '#7A99B2' }}>
                                        {selectedImpact.sublabel}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={{ fontSize: 13, color: '#4A6A82' }}>
                                    Toque em um número para selecionar
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* ── Você precisa parar atividades? (aparece após selecionar nível) ── */}
                {impactLevel && (
                    <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
                        <Text
                            style={{
                                fontSize: 15,
                                fontWeight: '600',
                                color: '#FFFFFF',
                                marginBottom: 4,
                            }}
                        >
                            Você precisa parar suas atividades durante a crise?
                        </Text>
                        <Text style={{ fontSize: 13, color: '#7A99B2', marginBottom: 16 }}>
                            Trabalho, estudos, compromissos do dia a dia.
                        </Text>

                        <View style={{ gap: 10 }}>
                            {ACTIVITY_STOP_OPTIONS.map((option) => {
                                const isSelected = activityStop === option.value;
                                return (
                                    <TouchableOpacity
                                        key={option.value}
                                        onPress={() => setActivityStop(option.value)}
                                        activeOpacity={0.8}
                                        style={{
                                            backgroundColor: isSelected ? option.color + '18' : '#112236',
                                            borderWidth: 1.5,
                                            borderColor: isSelected ? option.color : '#1E3A52',
                                            borderRadius: 16,
                                            paddingVertical: 14,
                                            paddingHorizontal: 18,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 14,
                                        }}
                                    >
                                        <Text style={{ fontSize: 22 }}>{option.emoji}</Text>
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
                                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' }} />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* ── Aviso de preventivo ── */}
                {needsPreventive && activityStop && (
                    <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
                        <View
                            style={{
                                backgroundColor: '#7B68EE18',
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: '#7B68EE40',
                                padding: 14,
                                flexDirection: 'row',
                                gap: 10,
                                alignItems: 'flex-start',
                            }}
                        >
                            <Text style={{ fontSize: 16 }}>💡</Text>
                            <Text style={{ fontSize: 13, color: '#7B68EE', lineHeight: 19, flex: 1, fontWeight: '600' }}>
                                Seu perfil sugere que você pode se beneficiar de tratamento preventivo. O app vai destacar isso nos seus relatórios.
                            </Text>
                        </View>
                    </View>
                )}

                {/* ── Botão de avançar ── */}
                <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
                    <TouchableOpacity
                        onPress={handleNext}
                        disabled={!isValid || isSubmitting}
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
                            {isSubmitting ? 'Salvando...' : 'Continuar'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}