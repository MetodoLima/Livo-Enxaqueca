import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';



type OptionValue = '2' | '7' | '12' | '16' | 'unknown';

interface Option {
  value: OptionValue;
  label: string;
  sublabel: string;
  userType: 'episodic' | 'chronic' | null;
  color: string;
}



const TOTAL_STEPS = 10;
const CURRENT_STEP = 1;

const OPTIONS: Option[] = [
  {
    value: '2',
    label: '1 – 4 dias',
    sublabel: 'Raramente',
    userType: 'episodic',
    color: '#00BFA5',
  },
  {
    value: '7',
    label: '5 – 9 dias',
    sublabel: 'Às vezes',
    userType: 'episodic',
    color: '#00BFA5',
  },
  {
    value: '12',
    label: '10 – 14 dias',
    sublabel: 'Com frequência',
    userType: 'episodic',
    color: '#F5A623',
  },
  {
    value: '16',
    label: '15 dias ou mais',
    sublabel: 'Quase todo dia',
    userType: 'chronic',
    color: '#E85D75',
  },
  {
    value: 'unknown',
    label: 'Não sei',
    sublabel: 'Posso descobrir depois',
    userType: null,
    color: '#4A6A82',
  },
];


export default function Step1Fenotipagem() {
  const [selected, setSelected] = useState<OptionValue | null>(null);

  const selectedOption = OPTIONS.find((o) => o.value === selected) ?? null;
  const isValid = selected !== null;

  function handleNext() {
    if (!isValid || !selectedOption) return;

     router.push({
       pathname: '/(setup)/step2',
       params: {
         frequency: selectedOption.value,
         userType: selectedOption.userType ?? 'unknown',
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
            Passo {CURRENT_STEP} de {TOTAL_STEPS} · Fenotipagem
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
            Com que frequência você tem crises?
          </Text>

          {/* Subtítulo */}
          <Text style={{ fontSize: 15, color: '#7A99B2', lineHeight: 22 }}>
            Pense nos últimos 3 meses. Inclua dias com dor leve ou moderada também.
          </Text>
        </View>

        {/* ── Badge de classificação (aparece ao selecionar) ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 20, minHeight: 48 }}>
          {selectedOption && selectedOption.userType ? (
            <View
              style={{
                backgroundColor: selectedOption.color + '18',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: selectedOption.color + '40',
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
                  backgroundColor: selectedOption.color,
                }}
              />
              <Text
                style={{
                  fontSize: 13,
                  color: selectedOption.color,
                  fontWeight: '600',
                  flex: 1,
                  lineHeight: 18,
                }}
              >
                {selectedOption.userType === 'chronic'
                  ? 'Enxaqueca Crônica — o app vai adaptar seu acompanhamento.'
                  : selectedOption.value === '12'
                  ? 'Atenção: você está próximo do limiar crônico.'
                  : 'Enxaqueca Episódica — foco em identificar seus gatilhos.'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ── Opções ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 12, gap: 12 }}>
          {OPTIONS.map((option) => {
            const isSelected = selected === option.value;
            const isUnknown = option.value === 'unknown';

            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => setSelected(option.value)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: isSelected ? option.color + '18' : '#112236',
                  borderWidth: 1.5,
                  borderColor: isSelected ? option.color : '#1E3A52',
                  borderRadius: 16,
                  paddingVertical: 18,
                  paddingHorizontal: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: isUnknown ? 8 : 0,
                  borderStyle: isUnknown ? 'dashed' : 'solid',
                }}
              >
                <View style={{ gap: 2 }}>
                  <Text
                    style={{
                      fontSize: 16,
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

                {/* Indicador de seleção */}
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
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#FFFFFF',
                      }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
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