import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

interface SetupBackButtonProps {
  fallbackRoute?: string;
}

export function SetupBackButton({ fallbackRoute }: SetupBackButtonProps) {
  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else if (fallbackRoute) {
      router.replace(fallbackRoute as any);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleBack}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Voltar para a etapa anterior"
        accessibilityHint="Retorna à pergunta anterior do onboarding"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={styles.touchable}
      >
        <View style={styles.iconCircle}>
          <ArrowLeft size={18} color="#FFFFFF" />
        </View>
        <Text style={styles.label}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  touchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E3A52',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#7A99B2',
  },
});
