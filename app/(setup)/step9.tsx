import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useSetup } from '../../contexts/SetupContext';
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

// Mapeamento de cada campo do contexto para seu passo e tipo esperado no banco.
// O `tipo` aqui é o valor da coluna `tipo` em `perguntas_setup`.
const FIELD_META: Record<string, { passo: number; tipo: string }> = {
    frequency: { passo: 1, tipo: 'single_choice' },
    hasSigns: { passo: 2, tipo: 'boolean' },
    premonitorySigns: { passo: 2, tipo: 'multi_choice' },
    hasAura: { passo: 3, tipo: 'boolean' },
    auraSigns: { passo: 3, tipo: 'multi_choice' },
    sleepBaseline: { passo: 4, tipo: 'range' },
    mealFrequency: { passo: 5, tipo: 'single_choice' },
    comorbidities: { passo: 6, tipo: 'text' },
    medications: { passo: 7, tipo: 'text' },
    abortiveFrequency: { passo: 8, tipo: 'single_choice' },
    abortiveEffectiveness: { passo: 8, tipo: 'single_choice' },
    impactLevel: { passo: 9, tipo: 'range' },
    activityStop: { passo: 9, tipo: 'single_choice' },
};

type DBOpcao = { id: number; texto: string };
type DBPergunta = {
    id: number;
    texto: string;
    tipo: string;
    passo_setup: number;
    opcoes_pergunta: DBOpcao[];
};

/**
 * Busca o usuario_id (bigint) da tabela usuarios a partir do auth.user.id (uuid).
 */
async function getUsuarioId(authUserId: string): Promise<number | null> {
    const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .eq('user_id', authUserId)
        .single();
    if (error || !data) return null;
    return data.id;
}

/**
 * Salva todas as respostas do setup no banco de dados.
 *
 * Usa o campo `tipo` da tabela `perguntas_setup` como fonte da verdade:
 * - 'range'         → valor_numero  (Number)
 * - 'boolean'       → valor_booleano (true/false)
 * - 'text'          → valor_texto   (String)
 * - 'single_choice' → opcao_id      (cruzamento por label)
 * - 'multi_choice'  → opcao_id      (cruzamento por label, uma linha por opção)
 */
async function saveSetupAnswers(
    finalData: Record<string, any>,
    usuarioId: number,
    perguntas: DBPergunta[]
): Promise<void> {
    const rows: Record<string, any>[] = [];

    for (const [key, value] of Object.entries(finalData)) {
        if (value === undefined || value === null) continue;

        const metadados = FIELD_META[key];
        if (!metadados) {
            console.warn('[Setup] Campo não mapeado em FIELD_META:', key);
            continue;
        }

        // Normaliza para array para tratar single e multi de forma uniforme
        const values: any[] = Array.isArray(value) ? value : [value];

        for (const val of values) {
            if (val === undefined || val === null) continue;

            // ── range ───────────────────────────────────────────────────
            if (metadados.tipo === 'range') {
                const pergunta = perguntas.find(
                    (p) => p.passo_setup === metadados.passo && p.tipo === 'range'
                );
                if (pergunta) {
                    const numVal = Number(val);
                    const acimaMax = metadados.passo === 4 && numVal > 12;
                    rows.push({
                        user_id: usuarioId,
                        pergunta_id: pergunta.id,
                        valor_numero: acimaMax ? 12 : numVal,
                        ...(metadados.passo === 4 ? { valor_acima_max: acimaMax } : {}),
                    });
                }
                continue;
            }

            // ── boolean ─────────────────────────────────────────────────
            if (metadados.tipo === 'boolean') {
                const pergunta = perguntas.find(
                    (p) => p.passo_setup === metadados.passo && p.tipo === 'boolean'
                );
                if (pergunta) {
                    rows.push({
                        user_id: usuarioId,
                        pergunta_id: pergunta.id,
                        valor_booleano: val === true || val === 'true',
                    });
                }
                continue;
            }

            // ── text ─────────────────────────────────────────────────────
            if (metadados.tipo === 'text') {
                const pergunta = perguntas.find(
                    (p) => p.passo_setup === metadados.passo && p.tipo === 'text'
                );
                if (pergunta) {
                    rows.push({
                        user_id: usuarioId,
                        pergunta_id: pergunta.id,
                        valor_texto: String(val),
                    });
                }
                continue;
            }

            // ── single_choice / multi_choice: cruzamento por label ───────
            const valNorm = String(val).toLowerCase().trim();
            let matched = false;
            for (const pergunta of perguntas) {
                if (pergunta.passo_setup !== metadados.passo) continue;
                const opcao = pergunta.opcoes_pergunta.find(
                    (o) => o.texto.toLowerCase().trim() === valNorm
                );
                if (opcao) {
                    rows.push({
                        user_id: usuarioId,
                        pergunta_id: pergunta.id,
                        opcao_id: opcao.id,
                    });
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                console.warn('[Setup] Opção sem correspondência no banco:', key, '=', val);
            }
        }
    }

    if (rows.length === 0) return;

    console.log(rows);

    const { error } = await supabase.from('respostas_setup').insert(rows);
    if (error) throw error;
}





export default function Step9Impacto() {
    const { setupData, clearSetupData } = useSetup();
    const { checkSetupStatus } = useAuth();

    const [impactLevel, setImpactLevel] = useState<ImpactLevel>(null);
    const [activityStop, setActivityStop] = useState<ActivityStop>(null);

    const selectedImpact = IMPACT_LEVELS.find((o) => o.value === impactLevel) ?? null;
    const isValid = impactLevel !== null && activityStop !== null;


    const needsPreventive =
        (impactLevel ?? 0) >= 4 || activityStop === 'often' || activityStop === 'always';

    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleNext() {
        if (!isValid || isSubmitting || !selectedImpact) return;

        const selectedActivityStop = ACTIVITY_STOP_OPTIONS.find((o) => o.value === activityStop);

        const finalData = {
            ...setupData,
            impactLevel: selectedImpact.value,
            activityStop: selectedActivityStop?.label ?? activityStop,
        };

        setIsSubmitting(true);
        try {
            // 1. Buscar o ID interno do usuário na tabela `usuarios`
            const { data: authData } = await supabase.auth.getUser();
            if (!authData?.user) throw new Error('Usuário não autenticado.');

            const usuarioId = await getUsuarioId(authData.user.id);
            if (!usuarioId) throw new Error('Perfil do usuário não encontrado na tabela usuarios.');

            // 2. Buscar todas as perguntas com suas opções
            const { data: perguntas, error: pErr } = await supabase
                .from('perguntas_setup')
                .select('id, texto, tipo, passo_setup, opcoes_pergunta(id, texto)');
            if (pErr || !perguntas) throw pErr ?? new Error('Falha ao buscar perguntas.');

            // 3. Salvar as respostas no banco
            await saveSetupAnswers(finalData, usuarioId, perguntas as DBPergunta[]);

            // 4. Marcar setup como concluído no Supabase Auth
            const { error: updateErr } = await supabase.auth.updateUser({
                data: { setupCompleted: true }
            });
            if (updateErr) throw updateErr;

            clearSetupData();
            await checkSetupStatus();
        } catch (err: any) {
            console.error('[Setup] Erro ao finalizar setup:', err?.message ?? err);
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