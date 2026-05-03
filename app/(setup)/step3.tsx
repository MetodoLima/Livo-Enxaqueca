import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}



type HasAura = 'yes' | 'no' | null;

interface AuraSign {
  id: string;
  label: string;
  description: string;
  emoji: string;
  cortexType: string;
}



const TOTAL_STEPS = 10;
const CURRENT_STEP = 3;

const AURA_SIGNS: AuraSign[] = [
  {
    id: 'visual',
    label: 'Pontos ou faíscas luminosas',
    description: 'Manchas, ziguezagues ou flashes de luz',
    emoji: '✨',
    cortexType: 'Visual',
  },
  {
    id: 'sensory',
    label: 'Formigamento em mãos ou rosto',
    description: 'Sensação de dormência ou agulhadas',
    emoji: '🤚',
    cortexType: 'Sensorial',
  },
  {
    id: 'aphasia',
    label: 'Dificuldade de falar',
    description: 'Palavras embaralhadas ou travamento ao falar',
    emoji: '💬',
    cortexType: 'Afasia',
  },
  {
    id: 'motor',
    label: 'Fraqueza em membros',
    description: 'Sensação de peso ou dificuldade de mover',
    emoji: '💪',
    cortexType: 'Motor',
  },
];



export default function Step3Aura() {
  const params = useLocalSearchParams();

  const [hasAura, setHasAura] = useState<HasAura>(null);
  const [selectedSigns, setSelectedSigns] = useState<string[]>([]);

  const isValid =
    hasAura === 'no' ||
    (hasAura === 'yes' && selectedSigns.length > 0);

  function handleHasAura(value: HasAura) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHasAura(value);
    if (value === 'no') setSelectedSigns([]);
  }

  function toggleSign(id: string) {
    setSelectedSigns((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  const { checkSetupStatus } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleNext() {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Por enquanto, como é o último passo criado, vamos finalizar o setup
      // Futuramente, se houver o step4, so mudar a navegação de volta para o router.push
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
            Passo {CURRENT_STEP} de {TOTAL_STEPS} · Aura
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
            Sua visão ou sensibilidade mudam antes da dor?
          </Text>

          {/* Subtítulo */}
          <Text style={{ fontSize: 15, color: '#7A99B2', lineHeight: 22 }}>
            A aura são sintomas neurológicos que aparecem minutos antes da crise. Ocorre em cerca de 30% dos casos.
          </Text>
        </View>

        {/* ── Sim / Não ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 28, flexDirection: 'row', gap: 12 }}>
          {[
            { value: 'yes' as HasAura, label: 'Sim, acontece', emoji: '⚡' },
            { value: 'no' as HasAura, label: 'Não acontece', emoji: '✋' },
          ].map((option) => {
            const isSelected = hasAura === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleHasAura(option.value)}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor: isSelected ? '#00BFA518' : '#112236',
                  borderWidth: 1.5,
                  borderColor: isSelected ? '#00BFA5' : '#1E3A52',
                  borderRadius: 16,
                  paddingVertical: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 22 }}>{option.emoji}</Text>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: isSelected ? '#00BFA5' : '#FFFFFF',
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Lista de sinais de aura (aparece só se Sim) ── */}
        {hasAura === 'yes' && (
          <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: '#FFFFFF',
                marginBottom: 4,
              }}
            >
              O que você costuma sentir?
            </Text>
            <Text style={{ fontSize: 13, color: '#7A99B2', marginBottom: 16 }}>
              Selecione todos que se aplicam.
            </Text>

            <View style={{ gap: 10 }}>
              {AURA_SIGNS.map((sign) => {
                const isChecked = selectedSigns.includes(sign.id);
                return (
                  <TouchableOpacity
                    key={sign.id}
                    onPress={() => toggleSign(sign.id)}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: isChecked ? '#00BFA518' : '#112236',
                      borderWidth: 1.5,
                      borderColor: isChecked ? '#00BFA5' : '#1E3A52',
                      borderRadius: 16,
                      paddingVertical: 16,
                      paddingHorizontal: 18,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{sign.emoji}</Text>

                    <View style={{ flex: 1, gap: 4 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '600',
                          color: isChecked ? '#00BFA5' : '#FFFFFF',
                        }}
                      >
                        {sign.label}
                      </Text>
                      <Text style={{ fontSize: 13, color: '#4A6A82' }}>
                        {sign.description}
                      </Text>
                      {/* Badge do tipo cortical */}
                      <View
                        style={{
                          alignSelf: 'flex-start',
                          backgroundColor: isChecked ? '#00BFA530' : '#1E3A52',
                          borderRadius: 6,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          marginTop: 2,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '700',
                            color: isChecked ? '#00BFA5' : '#4A6A82',
                            letterSpacing: 0.5,
                          }}
                        >
                          {sign.cortexType.toUpperCase()}
                        </Text>
                      </View>
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
            </View>

            {/* Aviso se selecionou afasia ou motor */}
            {(selectedSigns.includes('aphasia') || selectedSigns.includes('motor')) && (
              <View
                style={{
                  backgroundColor: '#E85D7518',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#E85D7540',
                  padding: 14,
                  marginTop: 16,
                  flexDirection: 'row',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <Text style={{ fontSize: 16 }}>⚠️</Text>
                <Text style={{ fontSize: 13, color: '#E85D75', lineHeight: 19, flex: 1 }}>
                  Sintomas como dificuldade de fala ou fraqueza devem ser avaliados por um neurologista para descartar outras condições.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Mensagem se Não ── */}
        {hasAura === 'no' && (
          <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
            <View
              style={{
                backgroundColor: '#112236',
                borderRadius: 12,
                padding: 16,
                flexDirection: 'row',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <Text style={{ fontSize: 16 }}>💡</Text>
              <Text style={{ fontSize: 13, color: '#7A99B2', lineHeight: 19, flex: 1 }}>
                A maioria das pessoas com enxaqueca não tem aura. Suas crises serão acompanhadas normalmente.
              </Text>
            </View>
          </View>
        )}

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