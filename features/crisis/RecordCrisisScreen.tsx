import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, AccessibilityInfo } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Screen from '@/components/ui/Screen';
import Text from '@/components/ui/Text';
import { createEmptyCrisis, type CrisisRecord } from '@/types/crisis';
import { useCrisis } from '@/contexts/CrisisContext';
import { crisisRepository } from '@/repositories';

import HelpModal from '@/features/crisis/components/HelpModal';
import StepHeader, { STEP_NAMES } from '@/features/crisis/steps/StepHeader';
import StepFooter from '@/features/crisis/steps/StepFooter';
import StepTime, { problemasDoHorario } from '@/features/crisis/steps/StepTime';
import StepIntensity from '@/features/crisis/steps/StepIntensity';
import StepLocation from '@/features/crisis/steps/StepLocation';
import StepSymptoms from '@/features/crisis/steps/StepSymptoms';
import StepMedication from '@/features/crisis/steps/StepMedication';

type Step = 1 | 2 | 3 | 4 | 5;

interface Ajuda {
  title: string;
  message: string;
  label: string;
}

const AJUDA: Partial<Record<Step, Ajuda>> = {
  1: {
    title: 'Horário da crise',
    message: 'Informe quando a dor começou. Se já passou, defina também o fim.',
    label: 'Ajuda sobre o horário da crise',
  },
  2: {
    title: 'Nível da dor',
    message: 'Use a escala de 0 a 10. Arraste o controle ou toque na barra para posicionar.',
    label: 'Ajuda sobre o nível da dor',
  },
  4: {
    title: 'Sintomas',
    message: 'Selecione todos os sintomas que você está sentindo. Toque novamente para desmarcar.',
    label: 'Ajuda sobre os sintomas',
  },
  5: {
    title: 'Medicamentos',
    message: 'Se não tomou, toque em "Não tomei nenhum". Você pode adicionar medicamentos personalizados abaixo.',
    label: 'Ajuda sobre medicamentos',
  },
};

const DRAFT_KEY = 'crisis_draft';

function motivoDoBloqueio(step: Step, crisis: CrisisRecord): string | undefined {
  if (step === 1) {
    const problemas = problemasDoHorario(crisis);
    if (problemas.inicioNoFuturo || problemas.fimNoFuturo) {
      return 'Ajuste o horário: o início e o fim não podem ficar no futuro.';
    }
  }
  if (step === 2 && crisis.intensity === null) return 'Escolha o nível da dor para avançar.';
  return undefined;
}

export default function RecordCrisisScreen() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [crisis, setCrisis] = useState<CrisisRecord>(createEmptyCrisis);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [primeiraCrise, setPrimeiraCrise] = useState(false);
  const ajudaAutomaticaMostrada = useRef(false);
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

  useEffect(() => {
    let cancelado = false;
    crisisRepository
      .lastEndedAt()
      .then((ultimoFim) => {
        if (!cancelado) setPrimeiraCrise(ultimoFim === null);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (currentStep !== 2 || !primeiraCrise || ajudaAutomaticaMostrada.current) return;
    ajudaAutomaticaMostrada.current = true;
    setShowHelp(true);
  }, [currentStep, primeiraCrise]);

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

  const ajuda = AJUDA[currentStep];
  const motivo = motivoDoBloqueio(currentStep, crisis);

  return (
    <Screen
      scroll={currentStep !== 2}
      className="gap-6 pt-4"
      footer={
        <StepFooter
          onBack={currentStep === 1 ? handleClose : goBack}
          onNext={goNext}
          disabled={motivo !== undefined}
          disabledHint={motivo}
        />
      }
    >
      <StepHeader
        currentStep={currentStep}
        onClose={handleClose}
        onHelp={ajuda ? () => setShowHelp(true) : undefined}
        helpLabel={ajuda?.label}
      />

      {renderStep()}

      {ajuda ? (
        <HelpModal
          visible={showHelp}
          onClose={() => setShowHelp(false)}
          title={ajuda.title}
          message={ajuda.message}
        />
      ) : null}

      <Dialog
        visible={showExitModal}
        title="Sair do registro?"
        onClose={() => setShowExitModal(false)}
        footer={
          <View className="flex-row flex-wrap gap-3">
            <Button
              title="Continuar"
              variant="ghost"
              accessibilityLabel="Continuar preenchendo"
              onPress={() => setShowExitModal(false)}
              className="flex-grow"
            />
            <Button
              title="Sair sem salvar"
              variant="danger"
              accessibilityLabel="Sair sem salvar os dados"
              onPress={confirmExit}
              className="flex-grow"
            />
          </View>
        }
      >
        <Text tone="muted">Os dados desta crise não serão salvos.</Text>
      </Dialog>
    </Screen>
  );
}
