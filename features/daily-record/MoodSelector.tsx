import { useState } from 'react';
import { Image, View } from 'react-native';
import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import { MOODS, type MoodId } from '@/constants/data';

const VAO = 4;
const MOLDURA = 10;

interface MoodSelectorProps {
  selected: MoodId | null;
  onSelect: (id: MoodId) => void;
}

export default function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  const [largura, setLargura] = useState(0);
  const selecionado = MOODS.find((mood) => mood.id === selected);
  const lado = Math.floor((largura - VAO * (MOODS.length - 1)) / MOODS.length);
  const rosto = lado - MOLDURA;

  return (
    <View className="gap-2">
      <View
        onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
        className="flex-row justify-between"
      >
        {largura > 0
          ? MOODS.map((mood) => (
              <Card
                key={mood.id}
                padding="xs"
                selected={selected === mood.id}
                onPress={() => onSelect(mood.id)}
                accessibilityLabel={mood.label}
                className="items-center justify-center"
                style={{ width: lado, height: lado }}
              >
                <Image
                  source={mood.image}
                  style={{ width: rosto, height: rosto }}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              </Card>
            ))
          : null}
      </View>
      <Text
        variant="caption"
        tone="muted"
        importantForAccessibility="no"
        accessibilityElementsHidden
        className="text-center"
      >
        {selecionado ? selecionado.label : ' '}
      </Text>
    </View>
  );
}
