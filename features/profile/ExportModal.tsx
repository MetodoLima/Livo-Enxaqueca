import { Colors } from '@/constants/Colors';
import { X } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';

export const TIME_OPTIONS = [
  { months: 1, label: 'Último mês', sublabel: 'Crises dos últimos 30 dias' },
  { months: 3, label: 'Últimos 3 meses', sublabel: 'Crises dos últimos 3 meses' },
  { months: 6, label: 'Últimos 6 meses', sublabel: 'Crises dos últimos 6 meses' },
  { months: 12, label: 'Último ano', sublabel: 'Crises dos últimos 12 meses' },
];

interface ExportModalProps {
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onSelect: (months: number) => void;
}

export default function ExportModal({ visible, loading, onClose, onSelect }: ExportModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}
        onPress={!loading ? onClose : undefined}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View
            style={{
              backgroundColor: '#1a2a38',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 44,
              borderTopWidth: 1,
              borderColor: 'rgba(255,255,255,0.10)',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  color: 'white',
                  fontSize: 18,
                  fontWeight: '700',
                  fontFamily: 'Epilogue_700Bold',
                }}
              >
                Escolha o período
              </Text>
              {!loading && (
                <TouchableOpacity onPress={onClose} hitSlop={8}>
                  <X size={22} color="rgba(255,255,255,0.45)" />
                </TouchableOpacity>
              )}
            </View>

            {loading ? (
              <View style={{ alignItems: 'center', paddingVertical: 36 }}>
                <ActivityIndicator size="large" color={Colors.accent} />
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.55)',
                    marginTop: 16,
                    fontSize: 14,
                    fontFamily: 'Epilogue_400Regular',
                  }}
                >
                  Gerando relatório...
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {TIME_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.months}
                    onPress={() => onSelect(opt.months)}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#232533',
                      borderRadius: 14,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: 'white',
                          fontSize: 15,
                          fontFamily: 'Epilogue_600SemiBold',
                        }}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        style={{
                          color: 'rgba(255,255,255,0.38)',
                          fontSize: 12,
                          marginTop: 2,
                          fontFamily: 'Epilogue_400Regular',
                        }}
                      >
                        {opt.sublabel}
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: Colors.accent,
                        opacity: 0.7,
                      }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
