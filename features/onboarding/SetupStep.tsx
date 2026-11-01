import { router, type Href } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import type { ReactNode, Ref } from 'react';
import { View } from 'react-native';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import ProgressSteps from '@/components/ui/ProgressSteps';
import Screen from '@/components/ui/Screen';
import Text from '@/components/ui/Text';

const TOTAL_STEPS = 9;

interface SetupStepProps {
  step: number;
  title: string;
  subtitle: string;
  previousRoute: Href;
  canContinue: boolean;
  onContinue: () => void;
  loading?: boolean;
  continueRef?: Ref<View>;
  children: ReactNode;
}

export default function SetupStep({
  step,
  title,
  subtitle,
  previousRoute,
  canContinue,
  onContinue,
  loading = false,
  continueRef,
  children,
}: SetupStepProps) {
  const voltar = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(previousRoute);
    }
  };

  return (
    <Screen
      scroll
      className="gap-6 pt-6"
      footer={
        <>
          <IconButton icon={ArrowLeft} accessibilityLabel="Voltar" tone="content" filled onPress={voltar} />
          <Button
            ref={continueRef}
            title="Continuar"
            className="flex-1"
            loading={loading}
            disabled={!canContinue}
            accessibilityHint={canContinue ? undefined : 'Escolha uma opção para continuar.'}
            onPress={onContinue}
          />
        </>
      }
    >
      <View className="gap-2">
        <Text
          variant="caption"
          weight="semibold"
          tone="muted"
          importantForAccessibility="no"
          accessibilityElementsHidden
        >
          Passo {step} de {TOTAL_STEPS}
        </Text>
        <ProgressSteps current={step} total={TOTAL_STEPS} />
      </View>

      <View className="gap-2">
        <Text variant="title">{title}</Text>
        <Text tone="muted">{subtitle}</Text>
      </View>

      {children}
    </Screen>
  );
}
