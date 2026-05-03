import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Alert,
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
import StepAiComplement from '@/components/crisis/StepAiComplement';

type Step = 1 | 2 | 3 | 4 | 5;

export default function RecordCrisisScreen() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [crisis, setCrisis] = useState<CrisisRecord>(createEmptyCrisis);
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
    if (currentStep > 1) {
      Alert.alert(
        'Descartar registro?',
        'Seu progresso será perdido.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
        ],
      );
    } else {
      router.back();
    }
  }, [currentStep, router]);

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
        return <StepAiComplement data={crisis} onChange={updateCrisis} onNext={goNext} />;
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
});
