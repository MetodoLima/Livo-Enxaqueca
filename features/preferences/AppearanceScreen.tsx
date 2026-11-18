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
import { PALETAS, ROTULO_DO_TEMA, TEMAS as LISTA_DE_TEMAS, type Tema } from '@/constants/temas';
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

const TEMAS: ChoiceOption<Tema>[] = LISTA_DE_TEMAS.map((tema) => {
  const { canvas, surface, primary, lineStrong } = PALETAS[tema].roles;
  return {
    value: tema,
    label: ROTULO_DO_TEMA[tema],
    renderSample: () => (
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        className="h-8 w-8 overflow-hidden rounded-full border"
        style={{ backgroundColor: canvas, borderColor: lineStrong }}
      >
        <View className="absolute bottom-0 left-0 right-0 h-3" style={{ backgroundColor: surface }} />
        <View className="absolute right-1 top-1 h-3 w-3 rounded-full" style={{ backgroundColor: primary }} />
      </View>
    ),
  };
});

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
    AccessibilityInfo.announceForAccessibility('Preferências de aparência restauradas');
  };

  return (
    <Screen scroll>
      <ScreenHeader title="Aparência" subtitle="Ajuste o tema e o texto do app" onBack={() => router.back()} />

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

        <TituloDaSecao>Tema</TituloDaSecao>

        <ChoiceGroup
          label="Tema do app"
          description="O escuro é o padrão do Livo. O alto contraste reforça bordas e cores."
          options={TEMAS}
          value={preferencias.tema}
          onChange={(tema) => definir({ tema })}
        />

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
