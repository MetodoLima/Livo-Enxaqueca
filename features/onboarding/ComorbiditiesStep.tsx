import { router } from 'expo-router';
import { Plus, Search, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { View } from 'react-native';
import Chip from '@/components/ui/Chip';
import IconButton from '@/components/ui/IconButton';
import OptionCard from '@/components/ui/OptionCard';
import Text from '@/components/ui/Text';
import TextField from '@/components/ui/TextField';
import { color } from '@/constants/Colors';
import SetupStep from '@/features/onboarding/SetupStep';
import { useSetup } from '@/features/onboarding/SetupContext';

interface Condition {
    id: string;
    label: string;
    note?: string;
}

const SUGGESTED_CONDITIONS: Condition[] = [
    { id: 'hypertension', label: 'Hipertensão', note: 'Influencia a escolha do preventivo' },
    { id: 'anxiety', label: 'Ansiedade', note: 'Gatilho emocional frequente' },
    { id: 'insomnia', label: 'Insônia', note: 'Afeta diretamente o sono base' },
    { id: 'epilepsy', label: 'Epilepsia', note: 'Compartilha medicações com enxaqueca' },
    { id: 'depression', label: 'Depressão', note: 'Comorbidade comum em crônicos' },
    { id: 'hypothyroidism', label: 'Hipotireoidismo', note: 'Alterações hormonais podem intensificar crises' },
    { id: 'fibromyalgia', label: 'Fibromialgia', note: 'Dor crônica frequentemente associada à enxaqueca' },
    { id: 'diabetes', label: 'Diabetes', note: 'Variações de glicemia são gatilhos comuns' },
];

function conditionLabel(id: string): string {
    const condition = SUGGESTED_CONDITIONS.find((c) => c.id === id);
    return condition ? condition.label : id.replace('custom_', '').replace(/_/g, ' ');
}

export default function ComorbiditiesStep() {
    const { updateSetupData } = useSetup();

    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [noCondition, setNoCondition] = useState(false);

    const filtered = SUGGESTED_CONDITIONS.filter((c) =>
        c.label.toLowerCase().includes(search.toLowerCase())
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

        if (!noCondition) {
            updateSetupData({
                comorbidities: selected.map(conditionLabel),
            });
        }

        router.push({
            pathname: '/(setup)/step7',
        });
    }

    return (
        <SetupStep
            step={6}
            title="Você tem diagnóstico de outras condições?"
            subtitle="Isso ajuda o app a entender melhor sua saúde e sugerir estratégias mais adequadas."
            previousRoute="/(setup)/step5"
            canContinue={isValid}
            onContinue={handleNext}
        >
            <TextField
                label="Condição"
                placeholder="Buscar ou adicionar condição..."
                hint="Toque em uma sugestão ou escreva e adicione."
                value={search}
                onChangeText={setSearch}
                accessory={
                    search.trim().length > 0 ? (
                        <IconButton
                            icon={Plus}
                            accessibilityLabel="Adicionar condição"
                            tone="primary"
                            filled
                            onPress={handleAddCustom}
                        />
                    ) : (
                        <View
                            importantForAccessibility="no-hide-descendants"
                            accessibilityElementsHidden
                            className="h-12 w-12 items-center justify-center"
                        >
                            <Search size={22} color={color.contentMuted} />
                        </View>
                    )
                }
            />

            {selected.length > 0 && (
                <View className="flex-row flex-wrap gap-2">
                    {selected.map((id) => (
                        <Chip
                            key={id}
                            label={conditionLabel(id)}
                            tone="primary"
                            onRemove={() => toggleCondition(id)}
                        />
                    ))}
                </View>
            )}

            <View className="gap-3">
                <Text variant="heading">Sugestões</Text>

                <View className="gap-2">
                    {filtered.map((condition) => (
                        <OptionCard
                            key={condition.id}
                            label={condition.label}
                            description={condition.note}
                            mode="checkbox"
                            checked={selected.includes(condition.id)}
                            onPress={() => toggleCondition(condition.id)}
                        />
                    ))}
                </View>
            </View>

            <OptionCard
                label="Nenhuma condição"
                description="Não tenho outros diagnósticos"
                icon={X}
                mode="checkbox"
                checked={noCondition}
                onPress={handleNoCondition}
            />
        </SetupStep>
    );
}
