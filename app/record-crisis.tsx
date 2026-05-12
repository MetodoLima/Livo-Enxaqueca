import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { createEmptyCrisis, type CrisisRecord } from '@/types/crisis';
import { useCrisis } from '@/contexts/CrisisContext';

// Step components
import StepHeader, { ProgressBar } from '@/components/crisis/StepHeader';
import StepTime from '@/components/crisis/StepTime';
import StepIntensity from '@/components/crisis/StepIntensity';
import StepLocation from '@/components/crisis/StepLocation';
import StepSymptoms from '@/components/crisis/StepSymptoms';
import StepMedication from '@/components/crisis/StepMedication';

type Step = 1 | 2 | 3 | 4 | 5;

export default function RecordCrisisScreen() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [crisis, setCrisis] = useState<CrisisRecord>(createEmptyCrisis);
  const [showExitModal, setShowExitModal] = useState(false);
  const router = useRouter();
  const { saveCrisis } = useCrisis();

  // ── Patch crisis data from any step ─────────────────────────────────
  const updateCrisis = useCallback((patch: Partial<CrisisRecord>) => {
    setCrisis((prev) => ({ ...prev, ...patch }));
  }, []);

  // ── Navigation ──────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (currentStep < 5) {
      setCurrentStep((s) => (s + 1) as Step);
    } else {
      handleConfirm();
    }
  }, [currentStep]);

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
    router.back();
  }, [router]);

  // ── Confirm & save ──────────────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    saveCrisis(crisis);
    router.dismiss();
    router.push('/(tabs)/crisis' as any);
  }, [crisis, router, saveCrisis]);

  // ── Render current step ─────────────────────────────────────────────
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

      {/* ── Exit confirmation modal ── */}
      <Modal
        visible={showExitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>⚠️</Text>
            <Text style={styles.modalTitle}>Sair do registro?</Text>
            <Text style={styles.modalMessage}>
              Os dados desta crise não serão salvos.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowExitModal(false)}
                style={styles.modalBtnCancel}
              >
                <Text style={styles.modalBtnCancelText}>Continuar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmExit}
                style={styles.modalBtnExit}
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

  // Exit modal
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
  },
  modalBtnExitText: {
    fontSize: 15,
    fontFamily: 'Epilogue_600SemiBold',
    color: '#EF4444',
  },
});
