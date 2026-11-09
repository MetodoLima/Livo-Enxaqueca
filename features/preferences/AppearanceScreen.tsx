import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ChoiceGroup, { type ChoiceOption } from '@/components/ui/ChoiceGroup';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SwitchRow from '@/components/ui/SwitchRow';
import Text from '@/components/ui/Text';
import type { Espaco, Fonte, Tamanho } from '@/constants/typography';
import { usePreferences } from '@/contexts/PreferencesContext';

function comAmostra<T extends string>(
  opcoes: { value: T; label: string }[],
  amostra: (value: T, selecionada: boolean) => ReactNode,
): ChoiceOption<T>[] {
  return opcoes.map((opcao) => ({ ...opcao, renderSample: (selecionada) => amostra(opcao.value, selecionada) }));
}

const TAMANHOS = comAmostra<Tamanho>(
  [
    { value: 'padrao', label: 'Padrão' },
    { value: 'grande', label: 'Grande' },
    { value: 'maior', label: 'Maior' },
  ],
  (tamanho, selecionada) => (
    <Text amostra={{ tamanho }} weight="bold" tone={selecionada ? 'primary' : 'content'}>
      A
    </Text>
  ),
);

const FONTES = comAmostra<Fonte>(
  [
    { value: 'padrao', label: 'Padrão' },
    { value: 'legivel', label: 'Legível' },
    { value: 'dislexia', label: 'Dislexia' },
  ],
  (fonte, selecionada) => (
    <Text amostra={{ fonte }} variant="heading" weight="bold" tone={selecionada ? 'primary' : 'content'}>
      Aa
    </Text>
  ),
);

const ESPACOS: readonly ChoiceOption<Espaco>[] = [
  { value: 'padrao', label: 'Padrão' },
  { value: 'medio', label: 'Médio' },
  { value: 'amplo', label: 'Amplo' },
];

function TituloDaSecao({ children }: { children: string }) {
  return (
    <Text variant="caption" weight="semibold" tone="muted" accessibilityRole="header" className="uppercase">
      {children}
    </Text>
  );
}

export default function AppearanceScreen() {
  const router = useRouter();
  const { preferencias, definir, restaurar } = usePreferences();

  const restaurarPadrao = () => {
    restaurar();
    AccessibilityInfo.announceForAccessibility('Preferências de texto restauradas');
  };

  return (
    <Screen scroll>
      <ScreenHeader title="Aparência" subtitle="Ajuste o texto do app" onBack={() => router.back()} />

      <View className="gap-6">
        <Card padding="sm" className="gap-2">
          <Text variant="caption" weight="semibold" tone="muted" className="uppercase">
            Prévia
          </Text>
          <Text variant="heading" accessibilityRole="text">
            Crise registrada
          </Text>
          <Text>Intensidade 6 · Forte. Você pode editar os detalhes depois.</Text>
        </Card>

        <TituloDaSecao>Texto</TituloDaSecao>

        <ChoiceGroup
          label="Tamanho do texto"
          options={TAMANHOS}
          value={preferencias.tamanho}
          onChange={(tamanho) => definir({ tamanho })}
        />

        <ChoiceGroup
          label="Fonte"
          options={FONTES}
          value={preferencias.fonte}
          onChange={(fonte) => definir({ fonte })}
        />

        <SwitchRow
          label="Texto em negrito"
          description="Deixa todos os textos mais grossos"
          value={preferencias.negrito}
          onValueChange={(negrito) => definir({ negrito })}
        />

        <ChoiceGroup
          label="Espaço entre linhas"
          options={ESPACOS}
          value={preferencias.linhas}
          onChange={(linhas) => definir({ linhas })}
        />

        <ChoiceGroup
          label="Espaço entre letras"
          options={ESPACOS}
          value={preferencias.letras}
          onChange={(letras) => definir({ letras })}
        />

        <Button title="Restaurar padrão" variant="secondary" onPress={restaurarPadrao} />
      </View>
    </Screen>
  );
}
