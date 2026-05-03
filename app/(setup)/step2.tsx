import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

// Necessário para LayoutAnimation funcionar no Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}



type HasSigns = 'yes' | 'no' | null;

interface Sign {
  id: string;
  label: string;
  description: string;
  emoji: string;
}



const TOTAL_STEPS = 10;
const CURRENT_STEP = 2;

const PREMONITORY_SIGNS: Sign[] = [
  {
    id: 'yawning',
    label: 'Bocejos repetitivos',
    description: 'Bocejos frequentes sem estar com sono',
    emoji: '🥱',
  },
  {
    id: 'food_craving',
    label: 'Fome por alimentos específicos',
    description: 'Vontade súbita de comer algo em particular',
    emoji: '🍫',
  },
  {
    id: 'irritability',
    label: 'Irritabilidade',
    description: 'Mudança de humor ou sensação de tensão',
    emoji: '😤',
  },
  {
    id: 'neck_stiffness',
    label: 'Rigidez no pescoço',
    description: 'Tensão ou dor na nuca e ombros',
    emoji: '😣',
  },
];



export default function Step2Premonitoria() {
  const params = useLocalSearchParams();

  const [hasSigns, setHasSigns] = useState<HasSigns>(null);
  const [selectedSigns, setSelectedSigns] = useState<string[]>([]);

  const isValid =
    hasSigns === 'no' ||
    (hasSigns === 'yes' && selectedSigns.length > 0);

  function handleHasSigns(value: HasSigns) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setHasSigns(value);
    if (value === 'no') setSelectedSigns([]);
  }

  function toggleSign(id: string) {
    setSelectedSigns((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function handleNext() {
    if (!isValid) return;

     router.push({
       pathname: '/(setup)/step3',
       params: {
         ...params,                                  
         hasSigns: hasSigns,                         
         premonitorySigns: selectedSigns.join(','),  
       },
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
            Passo {CURRENT_STEP} de {TOTAL_STEPS} · Fase Premonitória
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
            Você percebe sinais antes da dor começar?
          </Text>

          {/* Subtítulo */}
          <Text style={{ fontSize: 15, color: '#7A99B2', lineHeight: 22 }}>
            Alguns sintomas aparecem horas antes da crise. Isso ajuda o app a te alertar com antecedência.
          </Text>
        </View>

        {/* ── Sim / Não ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 28, flexDirection: 'row', gap: 12 }}>
          {[
            { value: 'yes' as HasSigns, label: 'Sim, percebo', emoji: '👁️' },
            { value: 'no' as HasSigns, label: 'Não percebo', emoji: '🤷' },
          ].map((option) => {
            const isSelected = hasSigns === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleHasSigns(option.value)}
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

        {/* ── Lista de sinais (aparece só se Sim) ── */}
        {hasSigns === 'yes' && (
          <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: '#FFFFFF',
                marginBottom: 4,
              }}
            >
              Quais sinais você costuma sentir?
            </Text>
            <Text style={{ fontSize: 13, color: '#7A99B2', marginBottom: 16 }}>
              Selecione todos que se aplicam.
            </Text>

            <View style={{ gap: 10 }}>
              {PREMONITORY_SIGNS.map((sign) => {
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

                    <View style={{ flex: 1, gap: 2 }}>
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
          </View>
        )}

        {/* ── Mensagem se Não ── */}
        {hasSigns === 'no' && (
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
                Tudo bem! Com o tempo, o app pode te ajudar a identificar padrões que você ainda não percebeu.
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