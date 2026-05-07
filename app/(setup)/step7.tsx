import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useSetup } from '../../contexts/SetupContext';
import {
    ActivityIndicator,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';



interface Medication {
    id: string;
    name: string;
    activeIngredient: string;
    category: 'triptan' | 'analgesic' | 'anti_inflammatory' | 'ergot' | 'other';
}



const TOTAL_STEPS = 9;
const CURRENT_STEP = 7;

// Lista local de referência — substitui a API enquanto não estiver disponível
const MEDICATION_DB: Medication[] = [
    { id: 'sumatriptan', name: 'Sumatriptano', activeIngredient: 'Sumatriptana', category: 'triptan' },
    { id: 'imigran', name: 'Imigran', activeIngredient: 'Sumatriptana', category: 'triptan' },
    { id: 'rizatriptan', name: 'Rizatriptano', activeIngredient: 'Rizatriptana', category: 'triptan' },
    { id: 'maxalt', name: 'Maxalt', activeIngredient: 'Rizatriptana', category: 'triptan' },
    { id: 'zolmitriptan', name: 'Zolmitriptano', activeIngredient: 'Zolmitriptana', category: 'triptan' },
    { id: 'naratriptan', name: 'Naratriptano', activeIngredient: 'Naratriptana', category: 'triptan' },
    { id: 'dipyrone', name: 'Dipirona', activeIngredient: 'Metamizol', category: 'analgesic' },
    { id: 'novalgina', name: 'Novalgina', activeIngredient: 'Metamizol', category: 'analgesic' },
    { id: 'paracetamol', name: 'Paracetamol', activeIngredient: 'Paracetamol', category: 'analgesic' },
    { id: 'tylenol', name: 'Tylenol', activeIngredient: 'Paracetamol', category: 'analgesic' },
    { id: 'ibuprofen', name: 'Ibuprofeno', activeIngredient: 'Ibuprofeno', category: 'anti_inflammatory' },
    { id: 'advil', name: 'Advil', activeIngredient: 'Ibuprofeno', category: 'anti_inflammatory' },
    { id: 'naproxen', name: 'Naproxeno', activeIngredient: 'Naproxeno', category: 'anti_inflammatory' },
    { id: 'nimesulide', name: 'Nimesulida', activeIngredient: 'Nimesulida', category: 'anti_inflammatory' },
    { id: 'ergotamine', name: 'Ergotamina', activeIngredient: 'Ergotamina', category: 'ergot' },
    { id: 'cafergot', name: 'Cafergot', activeIngredient: 'Ergotamina + Cafeína', category: 'ergot' },
];

const CATEGORY_LABELS: Record<Medication['category'], { label: string; color: string }> = {
    triptan: { label: 'Triptano', color: '#00BFA5' },
    analgesic: { label: 'Analgésico', color: '#7B68EE' },
    anti_inflammatory: { label: 'Anti-inflamatório', color: '#F5A623' },
    ergot: { label: 'Ergotamínico', color: '#E85D75' },
    other: { label: 'Outro', color: '#4A6A82' },
};



export default function Step7Medicamentos() {
    const { updateSetupData } = useSetup();

    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Medication[]>([]);
    const [results, setResults] = useState<Medication[]>([]);
    const [loading, setLoading] = useState(false);
    const [noMedication, setNoMedication] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isValid = noMedication || selected.length > 0;


    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (search.trim().length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }

        setLoading(true);
        debounceRef.current = setTimeout(() => {
            const filtered = MEDICATION_DB.filter(
                (m) =>
                    m.name.toLowerCase().includes(search.toLowerCase()) ||
                    m.activeIngredient.toLowerCase().includes(search.toLowerCase())
            );
            setResults(filtered);
            setLoading(false);
            setShowResults(true);
        }, 350);
    }, [search]);

    function handleSelect(med: Medication) {
        if (!selected.find((s) => s.id === med.id)) {
            setSelected((prev) => [...prev, med]);
            setNoMedication(false);
        }
        setSearch('');
        setResults([]);
        setShowResults(false);
    }

    function handleRemove(id: string) {
        setSelected((prev) => prev.filter((s) => s.id !== id));
    }

    function handleAddCustom() {
        const trimmed = search.trim();
        if (!trimmed) return;
        const custom: Medication = {
            id: `custom_${Date.now()}`,
            name: trimmed,
            activeIngredient: '',
            category: 'other',
        };
        setSelected((prev) => [...prev, custom]);
        setNoMedication(false);
        setSearch('');
        setResults([]);
        setShowResults(false);
    }

    function handleNoMedication() {
        setSelected([]);
        setSearch('');
        setNoMedication((prev) => !prev);
    }

    function handleNext() {
        if (!isValid) return;

        // Se o usuário marcou "Não uso medicamentos", descartamos (regra de negócio)
        if (!noMedication) {
            updateSetupData({
                medications: selected.map((m) => m.name),
            });
        }

        router.push({
            pathname: '/(setup)/step8',
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
                        Passo {CURRENT_STEP} de {TOTAL_STEPS} · Medicamentos
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
                        Quais remédios você toma quando a dor começa?
                    </Text>

                    {/* Subtítulo */}
                    <Text style={{ fontSize: 15, color: '#7A99B2', lineHeight: 22 }}>
                        Busque pelo nome comercial ou princípio ativo. Isso ajuda a monitorar o uso e evitar dependência.
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
                        <Text style={{ fontSize: 16 }}>💊</Text>
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Ex: Sumatriptano, Novalgina..."
                            placeholderTextColor="#4A6A82"
                            style={{
                                flex: 1,
                                fontSize: 15,
                                color: '#FFFFFF',
                                paddingVertical: 14,
                            }}
                        />
                        {loading && <ActivityIndicator size="small" color="#00BFA5" />}
                        {!loading && search.trim().length > 1 && results.length === 0 && (
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

                    {/* ── Dropdown de resultados ── */}
                    {showResults && results.length > 0 && (
                        <View
                            style={{
                                backgroundColor: '#112236',
                                borderRadius: 14,
                                borderWidth: 1.5,
                                borderColor: '#1E3A52',
                                marginTop: 6,
                                overflow: 'hidden',
                            }}
                        >
                            {results.map((med, index) => {
                                const cat = CATEGORY_LABELS[med.category];
                                const isAlreadySelected = !!selected.find((s) => s.id === med.id);
                                return (
                                    <TouchableOpacity
                                        key={med.id}
                                        onPress={() => handleSelect(med)}
                                        disabled={isAlreadySelected}
                                        style={{
                                            paddingVertical: 14,
                                            paddingHorizontal: 18,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 12,
                                            borderTopWidth: index === 0 ? 0 : 1,
                                            borderTopColor: '#1E3A52',
                                            opacity: isAlreadySelected ? 0.4 : 1,
                                        }}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                                                {med.name}
                                            </Text>
                                            {med.activeIngredient && (
                                                <Text style={{ fontSize: 12, color: '#4A6A82', marginTop: 2 }}>
                                                    {med.activeIngredient}
                                                </Text>
                                            )}
                                        </View>
                                        <View
                                            style={{
                                                backgroundColor: cat.color + '20',
                                                borderRadius: 6,
                                                paddingHorizontal: 8,
                                                paddingVertical: 3,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: '700',
                                                    color: cat.color,
                                                    letterSpacing: 0.4,
                                                }}
                                            >
                                                {cat.label.toUpperCase()}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* ── Tags selecionadas ── */}
                {selected.length > 0 && (
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
                            Selecionados
                        </Text>
                        <View style={{ gap: 10 }}>
                            {selected.map((med) => {
                                const cat = CATEGORY_LABELS[med.category];
                                return (
                                    <View
                                        key={med.id}
                                        style={{
                                            backgroundColor: '#112236',
                                            borderRadius: 14,
                                            borderWidth: 1.5,
                                            borderColor: cat.color + '60',
                                            paddingVertical: 14,
                                            paddingHorizontal: 18,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 12,
                                        }}
                                    >
                                        <Text style={{ fontSize: 20 }}>💊</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>
                                                {med.name}
                                            </Text>
                                            {med.activeIngredient ? (
                                                <Text style={{ fontSize: 12, color: '#4A6A82', marginTop: 2 }}>
                                                    {med.activeIngredient}
                                                </Text>
                                            ) : null}
                                        </View>
                                        <View
                                            style={{
                                                backgroundColor: cat.color + '20',
                                                borderRadius: 6,
                                                paddingHorizontal: 8,
                                                paddingVertical: 3,
                                                marginRight: 8,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 11,
                                                    fontWeight: '700',
                                                    color: cat.color,
                                                    letterSpacing: 0.4,
                                                }}
                                            >
                                                {cat.label.toUpperCase()}
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={() => handleRemove(med.id)}>
                                            <Text style={{ fontSize: 18, color: '#4A6A82', fontWeight: '700' }}>×</Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* ── Opção nenhum medicamento ── */}
                <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
                    <TouchableOpacity
                        onPress={handleNoMedication}
                        activeOpacity={0.8}
                        style={{
                            backgroundColor: noMedication ? '#4A6A8218' : '#112236',
                            borderWidth: 1.5,
                            borderColor: noMedication ? '#4A6A82' : '#1E3A52',
                            borderRadius: 16,
                            paddingVertical: 14,
                            paddingHorizontal: 18,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 14,
                            borderStyle: 'dashed',
                        }}
                    >
                        <Text style={{ fontSize: 22 }}>✋</Text>
                        <View style={{ flex: 1 }}>
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontWeight: '600',
                                    color: noMedication ? '#7A99B2' : '#FFFFFF',
                                }}
                            >
                                Não uso medicamentos
                            </Text>
                            <Text style={{ fontSize: 12, color: '#4A6A82' }}>
                                Aguento a crise ou uso outros métodos
                            </Text>
                        </View>
                        <View
                            style={{
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                borderWidth: 2,
                                borderColor: noMedication ? '#4A6A82' : '#1E3A52',
                                backgroundColor: noMedication ? '#4A6A82' : 'transparent',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {noMedication && (
                                <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '700' }}>✓</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>

                {/* ── Aviso de uso excessivo ── */}
                {selected.length >= 3 && (
                    <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
                        <View
                            style={{
                                backgroundColor: '#F5A62318',
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: '#F5A62340',
                                padding: 14,
                                flexDirection: 'row',
                                gap: 10,
                                alignItems: 'flex-start',
                            }}
                        >
                            <Text style={{ fontSize: 16 }}>⚠️</Text>
                            <Text style={{ fontSize: 13, color: '#F5A623', lineHeight: 19, flex: 1 }}>
                                Usar muitos medicamentos diferentes pode aumentar o risco de cefaleia por uso excessivo. O app vai te ajudar a monitorar isso.
                            </Text>
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