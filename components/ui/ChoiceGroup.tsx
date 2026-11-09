import { useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Text from '@/components/ui/Text';

const ESPACO = 8;

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  renderSample?: (selected: boolean) => ReactNode;
}

export interface ChoiceGroupProps<T extends string> {
  label: string;
  description?: string;
  options: readonly ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export default function ChoiceGroup<T extends string>({
  label,
  description,
  options,
  value,
  onChange,
  className = '',
}: ChoiceGroupProps<T>) {
  const [largura, setLargura] = useState(0);
  const larguraDaOpcao = largura > 0 ? (largura - ESPACO * (options.length - 1)) / options.length : undefined;

  return (
    <View className={`gap-3 ${className}`}>
      <View className="gap-1">
        <Text weight="semibold">{label}</Text>
        {description ? (
          <Text variant="caption" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        className="flex-row gap-2"
        onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
      >
        {options.map((opcao) => {
          const selecionada = opcao.value === value;
          return (
            <Pressable
              key={opcao.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selecionada }}
              accessibilityLabel={opcao.label}
              onPress={() => onChange(opcao.value)}
              className={`min-h-14 items-center justify-center gap-1 rounded-md border px-2 py-3 active:opacity-80 ${
                selecionada ? 'border-primary bg-primary-subtle' : 'border-line-strong bg-surface-raised'
              }`}
              style={{ width: larguraDaOpcao }}
            >
              {opcao.renderSample ? (
                <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                  {opcao.renderSample(selecionada)}
                </View>
              ) : null}
              <Text
                variant={opcao.renderSample ? 'caption' : 'body'}
                weight="semibold"
                tone={selecionada ? 'content' : 'muted'}
                className="text-center"
              >
                {opcao.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
