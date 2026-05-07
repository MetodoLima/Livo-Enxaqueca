import { router } from 'expo-router';
import React, { useState } from 'react';
import { useSetup } from '../../contexts/SetupContext';
import {
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';



interface Condition {
    id: string;
    label: string;
    emoji: string;
    note?: string;
}



const TOTAL_STEPS = 9;
const CURRENT_STEP = 6;

const SUGGESTED_CONDITIONS: Condition[] = [
    { id: 'hypertension', label: 'Hipertensão', emoji: '❤️', note: 'Influencia a escolha do preventivo' },
    { id: 'anxiety', label: 'Ansiedade', emoji: '🧠', note: 'Gatilho emocional frequente' },
    { id: 'insomnia', label: 'Insônia', emoji: '🌙', note: 'Afeta diretamente o sono base' },
    { id: 'epilepsy', label: 'Epilepsia', emoji: '⚡', note: 'Compartilha medicações com enxaqueca' },
    { id: 'depression', label: 'Depressão', emoji: '💙', note: 'Comorbidade comum em crônicos' },
    { id: 'hypothyroidism', label: 'Hipotireoidismo', emoji: '🦋' },
    { id: 'fibromyalgia', label: 'Fibromialgia', emoji: '🔴' },
    { id: 'diabetes', label: 'Diabetes', emoji: '🩸' },
];



export default function Step6Comorbidades() {
    const { updateSetupData } = useSetup();

    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [noCondition, setNoCondition] = useState(false);

    const filtered = SUGGESTED_CONDITIONS.filter((c) =>
        c.label.toLowerCase().includes(search.toLowerCase())
    );


    const customItems = selected.filter(
        (id) => !SUGGESTED_CONDITIONS.find((c) => c.id === id)
    );

    const isValid = noCondition || selected.length > 0;

    function toggleCondition(id: string) {
        setNoCondition(false);
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
        );
    }

    function handleNoCondition() {
        setSelected([]);
        setSearch('');
        setNoCondition((prev) => !prev);
    }

    function handleAddCustom() {
        const trimmed = search.trim();
        if (!trimmed) return;
        const customId = `custom_${trimmed.toLowerCase().replace(/\s+/g, '_')}`;
        if (!selected.includes(customId)) {
            setSelected((prev) => [...prev, customId]);
            setNoCondition(false);
        }
        setSearch('');
    }

    function handleNext() {
        if (!isValid) return;

        // Se o usuário marcou "Nenhuma condição", descartamos (regra de negócio)
        if (!noCondition) {
            const labels = selected.map((id) => {
                const condition = SUGGESTED_CONDITIONS.find((c) => c.id === id);
                return condition
                    ? condition.label
                    : id.replace('custom_', '').replace(/_/g, ' ');
            });
            updateSetupData({
                comorbidities: labels,
            });
        }

        router.push({
            pathname: '/(setup)/step7',
        });
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#0D2137' }}>
            <StatusBar barStyle="light-content" backgroundColor="#0D2137" />

            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
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
                        Passo {CURRENT_STEP} de {TOTAL_STEPS} · Comorbidades
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
                        Você tem diagnóstico de outras condições?
                    </Text>

                    {/* Subtítulo */}
                    <Text style={{ fontSize: 15, color: '#7A99B2', lineHeight: 22 }}>
                        Isso ajuda o app a entender melhor sua saúde e sugerir estratégias mais adequadas.
                    </Text>
                </View>

                {/* ── Campo de busca ── */}
                <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
                    <View
                        style={{
                            backgroundColor: '#112236',
                            borderRadius: 14,
                            borderWidth: 1.5,
                            borderColor: search.length > 0 ? '#00BFA5' : '#1E3A52',
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 16,
                            gap: 10,
                        }}
                    >
                        <Text style={{ fontSize: 16 }}>🔍</Text>
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Buscar ou adicionar condição..."
                            placeholderTextColor="#4A6A82"
                            style={{
                                flex: 1,
                                fontSize: 15,
                                color: '#FFFFFF',
                                paddingVertical: 14,
                            }}
                        />
                        {search.trim().length > 0 && (
                            <TouchableOpacity
                                onPress={handleAddCustom}
                                style={{
                                    backgroundColor: '#00BFA520',
                                    borderRadius: 8,
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                }}
                            >
                                <Text style={{ fontSize: 13, color: '#00BFA5', fontWeight: '700' }}>
                                    + Adicionar
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* ── Tags selecionadas ── */}
                {selected.length > 0 && (
                    <View
                        style={{
                            paddingHorizontal: 24,
                            marginTop: 16,
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 8,
                        }}
                    >
                        {selected.map((id) => {
                            const condition = SUGGESTED_CONDITIONS.find((c) => c.id === id);
                            const label = condition
                                ? condition.label
                                : id.replace('custom_', '').replace(/_/g, ' ');
                            return (
                                <TouchableOpacity
                                    key={id}
                                    onPress={() => toggleCondition(id)}
                                    style={{
                                        backgroundColor: '#00BFA520',
                                        borderRadius: 20,
                                        borderWidth: 1,
                                        borderColor: '#00BFA560',
                                        paddingHorizontal: 14,
                                        paddingVertical: 7,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}
                                >
                                    <Text style={{ fontSize: 13, color: '#00BFA5', fontWeight: '600' }}>
                                        {condition?.emoji} {label}
                                    </Text>
                                    <Text style={{ fontSize: 13, color: '#00BFA5', fontWeight: '700' }}>×</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* ── Lista de sugestões ── */}
                <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
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
                        Sugestões
                    </Text>

                    <View style={{ gap: 10 }}>
                        {filtered.map((condition) => {
                            const isChecked = selected.includes(condition.id);
                            return (
                                <TouchableOpacity
                                    key={condition.id}
                                    onPress={() => toggleCondition(condition.id)}
                                    activeOpacity={0.8}
                                    style={{
                                        backgroundColor: isChecked ? '#00BFA518' : '#112236',
                                        borderWidth: 1.5,
                                        borderColor: isChecked ? '#00BFA5' : '#1E3A52',
                                        borderRadius: 16,
                                        paddingVertical: 14,
                                        paddingHorizontal: 18,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 14,
                                    }}
                                >
                                    <Text style={{ fontSize: 22 }}>{condition.emoji}</Text>

                                    <View style={{ flex: 1, gap: 2 }}>
                                        <Text
                                            style={{
                                                fontSize: 15,
                                                fontWeight: '600',
                                                color: isChecked ? '#00BFA5' : '#FFFFFF',
                                            }}
                                        >
                                            {condition.label}
                                        </Text>
                                        {condition.note && (
                                            <Text style={{ fontSize: 12, color: '#4A6A82' }}>
                                                {condition.note}
                                            </Text>
                                        )}
                                    </View>

                                    {/* Checkbox quadrado */}
                                    <View
                                        style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: 6,
                                            borderWidth: 2,
                                            borderColor: isChecked ? '#00BFA5' : '#1E3A52',
                                            backgroundColor: isChecked ? '#00BFA5' : 'transparent',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {isChecked && (
                                            <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '700' }}>
                                                ✓
                                            </Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Nenhuma condição */}
                        <TouchableOpacity
                            onPress={handleNoCondition}
                            activeOpacity={0.8}
                            style={{
                                backgroundColor: noCondition ? '#4A6A8218' : '#112236',
                                borderWidth: 1.5,
                                borderColor: noCondition ? '#4A6A82' : '#1E3A52',
                                borderRadius: 16,
                                paddingVertical: 14,
                                paddingHorizontal: 18,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 14,
                                marginTop: 8,
                                borderStyle: 'dashed',
                            }}
                        >
                            <Text style={{ fontSize: 22 }}>✋</Text>
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontWeight: '600',
                                        color: noCondition ? '#7A99B2' : '#FFFFFF',
                                    }}
                                >
                                    Nenhuma condição
                                </Text>
                                <Text style={{ fontSize: 12, color: '#4A6A82' }}>
                                    Não tenho outros diagnósticos
                                </Text>
                            </View>
                            <View
                                style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 6,
                                    borderWidth: 2,
                                    borderColor: noCondition ? '#4A6A82' : '#1E3A52',
                                    backgroundColor: noCondition ? '#4A6A82' : 'transparent',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {noCondition && (
                                    <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '700' }}>
                                        ✓
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

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