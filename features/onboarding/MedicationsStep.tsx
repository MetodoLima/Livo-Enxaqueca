import { router } from 'expo-router';
import { Pill, Plus, TriangleAlert, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import IconButton from '@/components/ui/IconButton';
import Notice from '@/components/ui/Notice';
import OptionCard from '@/components/ui/OptionCard';
import Text from '@/components/ui/Text';
import TextField from '@/components/ui/TextField';
import { color } from '@/constants/Colors';
import SetupStep from '@/features/onboarding/SetupStep';
import { useSetup } from '@/features/onboarding/SetupContext';

interface Medication {
    id: string;
    name: string;
    activeIngredient: string;
    category: 'triptan' | 'analgesic' | 'anti_inflammatory' | 'ergot' | 'combination' | 'preventive' | 'other';
}

const MEDICATION_DB: Medication[] = [
  { id: 'sumatriptan', name: 'Sumatriptano', activeIngredient: 'Sumatriptana', category: 'triptan' },
  { id: 'imigran', name: 'Imigran', activeIngredient: 'Sumatriptana', category: 'triptan' },
  { id: 'sumax', name: 'Sumax', activeIngredient: 'Sumatriptana', category: 'triptan' },
  { id: 'rizatriptan', name: 'Rizatriptano', activeIngredient: 'Rizatriptana', category: 'triptan' },
  { id: 'maxalt', name: 'Maxalt', activeIngredient: 'Rizatriptana', category: 'triptan' },
  { id: 'zolmitriptan', name: 'Zolmitriptano', activeIngredient: 'Zolmitriptana', category: 'triptan' },
  { id: 'zomig', name: 'Zomig', activeIngredient: 'Zolmitriptana', category: 'triptan' },
  { id: 'naratriptan', name: 'Naratriptano', activeIngredient: 'Naratriptana', category: 'triptan' },
  { id: 'eletriptan', name: 'Eletriptano', activeIngredient: 'Eletriptana', category: 'triptan' },
  { id: 'relpax', name: 'Relpax', activeIngredient: 'Eletriptana', category: 'triptan' },

  { id: 'dipyrone', name: 'Dipirona', activeIngredient: 'Metamizol', category: 'analgesic' },
  { id: 'novalgina', name: 'Novalgina', activeIngredient: 'Metamizol', category: 'analgesic' },
  { id: 'anador', name: 'Anador', activeIngredient: 'Metamizol', category: 'analgesic' },
  { id: 'paracetamol', name: 'Paracetamol', activeIngredient: 'Paracetamol', category: 'analgesic' },
  { id: 'tylenol', name: 'Tylenol', activeIngredient: 'Paracetamol', category: 'analgesic' },
  { id: 'aspirina', name: 'Aspirina', activeIngredient: 'Ácido Acetilsalicílico', category: 'analgesic' },
  { id: 'aas', name: 'AAS', activeIngredient: 'Ácido Acetilsalicílico', category: 'analgesic' },

  { id: 'ibuprofen', name: 'Ibuprofeno', activeIngredient: 'Ibuprofeno', category: 'anti_inflammatory' },
  { id: 'advil', name: 'Advil', activeIngredient: 'Ibuprofeno', category: 'anti_inflammatory' },
  { id: 'alivium', name: 'Alivium', activeIngredient: 'Ibuprofeno', category: 'anti_inflammatory' },
  { id: 'naproxen', name: 'Naproxeno', activeIngredient: 'Naproxeno', category: 'anti_inflammatory' },
  { id: 'flanax', name: 'Flanax', activeIngredient: 'Naproxeno', category: 'anti_inflammatory' },
  { id: 'nimesulide', name: 'Nimesulida', activeIngredient: 'Nimesulida', category: 'anti_inflammatory' },
  { id: 'nimesil', name: 'Nimesil', activeIngredient: 'Nimesulida', category: 'anti_inflammatory' },
  { id: 'voltaren', name: 'Voltaren', activeIngredient: 'Diclofenaco', category: 'anti_inflammatory' },
  { id: 'diclofenaco', name: 'Diclofenaco', activeIngredient: 'Diclofenaco', category: 'anti_inflammatory' },
  { id: 'cataflan', name: 'Cataflan', activeIngredient: 'Diclofenaco Potássico', category: 'anti_inflammatory' },
  { id: 'celebra', name: 'Celebra', activeIngredient: 'Celecoxibe', category: 'anti_inflammatory' },

  { id: 'ergotamine', name: 'Ergotamina', activeIngredient: 'Ergotamina', category: 'ergot' },
  { id: 'cafergot', name: 'Cafergot', activeIngredient: 'Ergotamina + Cafeína', category: 'ergot' },
  { id: 'enxak', name: 'Enxak', activeIngredient: 'Di-hidroergotamina + Dipirona + Cafeína', category: 'ergot' },

  { id: 'dorflex', name: 'Dorflex', activeIngredient: 'Dipirona + Orfenadrina + Cafeína', category: 'combination' },
  { id: 'excedrin', name: 'Excedrin', activeIngredient: 'Paracetamol + Aspirina + Cafeína', category: 'combination' },
  { id: 'neosaldina', name: 'Neosaldina', activeIngredient: 'Di-hidroergotamina + Dipirona + Cafeína', category: 'combination' },
  { id: 'saldatona', name: 'Saldatona', activeIngredient: 'Di-hidroergotamina + Dipirona + Cafeína', category: 'combination' },

  { id: 'propranolol', name: 'Propranolol', activeIngredient: 'Propranolol', category: 'preventive' },
  { id: 'amitriptyline', name: 'Amitriptilina', activeIngredient: 'Amitriptilina', category: 'preventive' },
  { id: 'topamax', name: 'Topamax', activeIngredient: 'Topiramato', category: 'preventive' },
  { id: 'topiramato', name: 'Topiramato', activeIngredient: 'Topiramato', category: 'preventive' },
  { id: 'flunarizine', name: 'Flunarizina', activeIngredient: 'Flunarizina', category: 'preventive' },
  { id: 'sibelium', name: 'Sibelium', activeIngredient: 'Flunarizina', category: 'preventive' },
  { id: 'venlafaxine', name: 'Venlafaxina', activeIngredient: 'Venlafaxina', category: 'preventive' },
  { id: 'valproate', name: 'Valproato', activeIngredient: 'Ácido Valpróico', category: 'preventive' },
];

const CATEGORY_LABELS: Record<Medication['category'], string> = {
    triptan: 'Triptano',
    analgesic: 'Analgésico',
    anti_inflammatory: 'Anti-inflamatório',
    ergot: 'Ergotamínico',
    combination: 'Combinado',
    preventive: 'Preventivo',
    other: 'Outro',
};

export default function MedicationsStep() {
    const { updateSetupData } = useSetup();

    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Medication[]>([]);
    const [results, setResults] = useState<Medication[]>([]);
    const [loading, setLoading] = useState(false);
    const [noMedication, setNoMedication] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isValid = noMedication || selected.length > 0;
    const canAddCustom = !loading && search.trim().length > 1 && results.length === 0;

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

        if (!noMedication) {
            updateSetupData({
                medications: selected.map((m) => m.name),
            });
        }

        router.push({ pathname: '/(setup)/step8' });
    }

    function accessory() {
        if (loading) {
            return (
                <View className="h-12 w-12 items-center justify-center">
                    <ActivityIndicator color={color.primary} accessibilityLabel="Buscando" />
                </View>
            );
        }
        if (canAddCustom) {
            return (
                <IconButton
                    icon={Plus}
                    accessibilityLabel="Adicionar medicamento"
                    tone="primary"
                    filled
                    onPress={handleAddCustom}
                />
            );
        }
        return (
            <View
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden
                className="h-12 w-12 items-center justify-center"
            >
                <Pill size={22} color={color.contentMuted} />
            </View>
        );
    }

    return (
        <SetupStep
            step={7}
            title="Quais remédios você toma quando a dor começa?"
            subtitle="Busque pelo nome comercial ou princípio ativo. Isso ajuda a monitorar o uso e evitar dependência."
            previousRoute="/(setup)/step6"
            canContinue={isValid}
            onContinue={handleNext}
        >
            <View className="gap-2">
                <TextField
                    label="Medicamento"
                    placeholder="Ex: Dorflex, Sumatriptano, Dipirona..."
                    value={search}
                    onChangeText={setSearch}
                    accessory={accessory()}
                />

                {showResults && results.length > 0 && (
                    <View className="gap-2">
                        {results.map((med) => {
                            const category = CATEGORY_LABELS[med.category].toUpperCase();
                            const isAlreadySelected = !!selected.find((s) => s.id === med.id);
                            return (
                                <Card
                                    key={med.id}
                                    surface="raised"
                                    padding="sm"
                                    selected={isAlreadySelected}
                                    accessibilityLabel={[med.name, med.activeIngredient, category]
                                        .filter(Boolean)
                                        .join(', ')}
                                    onPress={() => handleSelect(med)}
                                >
                                    <View className="flex-row items-center gap-3">
                                        <View className="flex-1 gap-1">
                                            <Text weight="semibold">{med.name}</Text>
                                            {med.activeIngredient ? (
                                                <Text variant="caption" tone="muted">
                                                    {med.activeIngredient}
                                                </Text>
                                            ) : null}
                                        </View>
                                        <Text variant="caption" weight="semibold" tone="muted">
                                            {category}
                                        </Text>
                                    </View>
                                </Card>
                            );
                        })}
                    </View>
                )}
            </View>

            {selected.length > 0 && (
                <View className="gap-3">
                    <Text variant="heading">Selecionados</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {selected.map((med) => (
                            <Chip
                                key={med.id}
                                label={med.name}
                                icon={Pill}
                                tone="primary"
                                onRemove={() => handleRemove(med.id)}
                            />
                        ))}
                    </View>
                </View>
            )}

            {selected.length >= 3 && (
                <Notice icon={TriangleAlert} tone="attention">
                    Usar muitos medicamentos diferentes pode aumentar o risco de cefaleia por uso excessivo. O app vai te ajudar a monitorar isso.
                </Notice>
            )}

            <OptionCard
                label="Não uso medicamentos"
                description="Aguento a crise ou uso outros métodos"
                icon={X}
                mode="checkbox"
                checked={noMedication}
                onPress={handleNoMedication}
            />
        </SetupStep>
    );
}
