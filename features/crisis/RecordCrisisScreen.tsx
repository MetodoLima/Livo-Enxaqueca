import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { createEmptyCrisis, type CrisisRecord } from '@/types/crisis';
import { useCrisis } from '@/contexts/CrisisContext';

import StepHeader, { ProgressBar } from '@/features/crisis/steps/StepHeader';
import StepTime from '@/features/crisis/steps/StepTime';
import StepIntensity from '@/features/crisis/steps/StepIntensity';
import StepLocation from '@/features/crisis/steps/StepLocation';
import StepSymptoms from '@/features/crisis/steps/StepSymptoms';
import StepMedication from '@/features/crisis/steps/StepMedication';

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_NAMES: Record<number, string> = {
  1: 'Horário',
  2: 'Intensidade',
  3: 'Localização',
  4: 'Sintomas',
  5: 'Medicamentos',
};

const DRAFT_KEY = 'crisis_draft';

export default function RecordCrisisScreen() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [crisis, setCrisis] = useState<CrisisRecord>(createEmptyCrisis);
  const [showExitModal, setShowExitModal] = useState(false);
  const [restored, setRestored] = useState(false);
  const router = useRouter();
  const { saveCrisis } = useCrisis();

  // COGA: Restaurar rascunho ao montar
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(DRAFT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setCrisis({
            ...parsed,
            startTime: new Date(parsed.startTime),
            endTime: parsed.endTime ? new Date(parsed.endTime) : null,
          });
          if (parsed._step) setCurrentStep(parsed._step);
        }
      } catch {}
      setRestored(true);
    })();
  }, []);

  // COGA: Salvar rascunho a cada mudança
  useEffect(() => {
    if (!restored) return;
    AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ ...crisis, _step: currentStep })).catch(() => {});
  }, [crisis, currentStep, restored]);

  const clearDraft = useCallback(() => {
    AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
  }, []);

  // COGA: Anunciar mudança de step para leitores de tela
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      `Passo ${currentStep} de 5: ${STEP_NAMES[currentStep]}`
    );
  }, [currentStep]);

  const updateCrisis = useCallback((patch: Partial<CrisisRecord>) => {
    setCrisis((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleConfirm = useCallback(() => {
    saveCrisis(crisis);
    clearDraft();
    AccessibilityInfo.announceForAccessibility('Crise registrada com sucesso!');
    router.dismiss();
    router.push('/(tabs)/crisis');
  }, [crisis, router, saveCrisis, clearDraft]);

  const goNext = useCallback(() => {
    if (currentStep < 5) {
      setCurrentStep((s) => (s + 1) as Step);
    } else {
      handleConfirm();
    }
  }, [currentStep, handleConfirm]);

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((s) => (s - 1) as Step);
    }
  }, [currentStep]);

  const handleClose = useCallback(() => {
    setShowExitModal(true);
  }, []);

  const confirmExit = useCallback(() => {
    setShowExitModal(false);
    clearDraft();
    router.back();
  }, [router, clearDraft]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepTime data={crisis} onChange={updateCrisis} onNext={goNext} />;
      case 2:
        return <StepIntensity data={crisis} onChange={updateCrisis} onNext={goNext} />;
      case 3:
        return <StepLocation data={crisis} onChange={updateCrisis} onNext={goNext} />;
      case 4:
        return <StepSymptoms data={crisis} onChange={updateCrisis} onNext={goNext} />;
      case 5:
        return <StepMedication data={crisis} onChange={updateCrisis} onNext={goNext} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <StepHeader
          currentStep={currentStep}
          onBack={goBack}
          onClose={handleClose}
        />
        <ProgressBar currentStep={currentStep} />

        <Animated.View key={currentStep} entering={FadeIn.duration(300)} style={{ flex: 1 }}>
          {renderStep()}
        </Animated.View>
      </ScrollView>

      <Modal
        visible={showExitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard} accessibilityViewIsModal={true}>
            <Text style={styles.modalEmoji}>⚠️</Text>
            <Text style={styles.modalTitle} accessibilityRole="header">Sair do registro?</Text>
            <Text style={styles.modalMessage}>
              Os dados desta crise não serão salvos.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowExitModal(false)}
                style={styles.modalBtnCancel}
                accessibilityRole="button"
                accessibilityLabel="Continuar preenchendo"
              >
                <Text style={styles.modalBtnCancelText}>Continuar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmExit}
                style={styles.modalBtnExit}
                accessibilityRole="button"
                accessibilityLabel="Sair sem salvar os dados"
              >
                <Text style={styles.modalBtnExitText}>Sair sem salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#0D2137',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3A52',
  },
  modalEmoji: {
    fontSize: 40,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Epilogue_700Bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Epilogue_400Regular',
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  modalBtnCancelText: {
    fontSize: 15,
    fontFamily: 'Epilogue_700Bold',
    color: 'white',
  },
  modalBtnExit: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  modalBtnExitText: {
    fontSize: 15,
    fontFamily: 'Epilogue_600SemiBold',
    color: '#EF4444',
  },
});
