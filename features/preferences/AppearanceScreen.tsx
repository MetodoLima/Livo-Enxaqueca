import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ChoiceGroup, { type ChoiceOption } from '@/components/ui/ChoiceGroup';
import OptionCard from '@/components/ui/OptionCard';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import SwitchRow from '@/components/ui/SwitchRow';
import Text from '@/components/ui/Text';
import type { ColorPaletteMode } from '@/constants/colorPaletteMode';
import { resolverPaleta, type IntensidadeCores } from '@/constants/Colors';
import { PALETAS, ROTULO_DO_TEMA, TEMAS as LISTA_DE_TEMAS, type Tema } from '@/constants/temas';
import { INTENSIDADES_CORES, type Espaco, type Fonte, type Tamanho } from '@/constants/typography';
import { usePreferences } from '@/contexts/PreferencesContext';

function comAmostra<T extends string>(
  opcoes: { value: T; label: string }[],
  amostra: (value: T, selecionada: boolean) => ReactNode,
): ChoiceOption<T>[] {
  return opcoes.map((opcao) => ({ ...opcao, renderSample: (selecionada) => amostra(opcao.value, selecionada) }));
}

const ROTULO_INTENSIDADE: Record<IntensidadeCores, string> = {
  normal: 'Normal',
  suaves: 'Suaves',
  'sem-cor': 'Sem cor',
};

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

const MODOS_DE_CORES: readonly {
  value: ColorPaletteMode;
  label: string;
  description: string;
}[] = [
  {
    value: 'original',
    label: 'Original',
    description: 'Mantém as cores do tema selecionado.',
  },
  {
    value: 'deuteranopia',
    label: 'Deuteranopia',
    description: 'Adapta as cores para facilitar a diferenciação visual em casos de deficiência de percepção do verde.',
  },
  {
    value: 'protanopia',
    label: 'Protanopia',
    description: 'Adapta as cores para facilitar a diferenciação visual em casos de deficiência de percepção do vermelho.',
  },
  {
    value: 'tritanopia',
    label: 'Tritanopia',
    description: 'Adapta as cores para facilitar a diferenciação visual em casos de deficiência de percepção do azul.',
  },
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

  const { tema, intensidadeCores, modoDeCores } = preferencias;
  const intensidades = comAmostra(
    INTENSIDADES_CORES.map((value) => ({ value, label: ROTULO_INTENSIDADE[value] })),
    (intensidade) => {
      const { roles } = resolverPaleta(tema, intensidade, modoDeCores);
      return (
        <View accessible={false} importantForAccessibility="no-hide-descendants" className="flex-row items-center gap-1.5 py-1">
          {[roles.primary, roles.attention, roles.danger].map((backgroundColor, index) => (
            <View key={index} className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor }} />
          ))}
        </View>
      );
    },
  );

  const restaurarPadrao = () => {
    restaurar();
    AccessibilityInfo.announceForAccessibility('Preferências de aparência restauradas');
  };

  const selecionarModoDeCores = (modo: ColorPaletteMode, label: string) => {
    definir({ modoDeCores: modo });
    AccessibilityInfo.announceForAccessibility(`Modo de cores ${label} selecionado`);
  };

  const mudarIntensidade = (intensidadeCores: IntensidadeCores) => {
    definir({ intensidadeCores });
    const avisos: Record<IntensidadeCores, string> = {
      normal: 'Intensidade de cores normal ativada',
      suaves: 'Intensidade de cores suaves ativada',
      'sem-cor': 'Intensidade sem cor ativada',
    };
    AccessibilityInfo.announceForAccessibility(avisos[intensidadeCores]);
  };

  return (
    <Screen scroll>
      <ScreenHeader title="Aparência" subtitle="Ajuste o tema, as cores e o texto do app" onBack={() => router.back()} />

      <View className="gap-6">
        <Card padding="sm" className="gap-2">
          <Text variant="caption" weight="semibold" tone="muted" className="uppercase">
            Prévia
          </Text>
          <Text variant="heading" accessibilityRole="text">
            Crise registrada
          </Text>
          <View className="flex-row items-center gap-2">
            <View className="h-3 w-3 rounded-full bg-primary" />
            <Text tone="primary" weight="semibold">
              Intensidade 6 · Forte
            </Text>
          </View>
          <Text>Você pode editar os detalhes depois.</Text>
        </Card>

        <TituloDaSecao>Tema</TituloDaSecao>

        <ChoiceGroup
          label="Tema do app"
          description="O escuro é o padrão do Livo. O alto contraste reforça bordas e cores."
          options={TEMAS}
          value={preferencias.tema}
          onChange={(tema) => definir({ tema })}
        />

        <TituloDaSecao>Cores</TituloDaSecao>

        <ChoiceGroup
          label="Intensidade de cores"
          description="Normal, cores suaves para sensibilidade ou sem cor em escala de cinza"
          options={intensidades}
          value={preferencias.intensidadeCores}
          onChange={mudarIntensidade}
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

        <TituloDaSecao>Visão de cores</TituloDaSecao>

        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Visão de cores"
          className="gap-3"
        >
          {MODOS_DE_CORES.map((opcao) => {
            const { roles, pain } = resolverPaleta(tema, intensidadeCores, opcao.value);
            return (
              <OptionCard
                key={opcao.value}
                label={opcao.label}
                description={opcao.description}
                mode="radio"
                checked={modoDeCores === opcao.value}
                onPress={() => selecionarModoDeCores(opcao.value, opcao.label)}
                previewColors={[roles.primary, roles.attention, roles.success, pain[8]]}
              />
            );
          })}
        </View>

        <Button title="Restaurar padrão" variant="secondary" onPress={restaurarPadrao} />
      </View>
    </Screen>
  );
}
