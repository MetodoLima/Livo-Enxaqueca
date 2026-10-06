import { Image, View } from 'react-native';
import Card from '@/components/ui/Card';
import Text from '@/components/ui/Text';
import { MOODS, type MoodId } from '@/constants/data';

interface MoodSelectorProps {
  selected: MoodId | null;
  onSelect: (id: MoodId) => void;
  showLabels?: boolean;
}

export default function MoodSelector({ selected, onSelect, showLabels = true }: MoodSelectorProps) {
  return (
    <View className="flex-row gap-2">
      {MOODS.map((mood) => {
        const isSelected = selected === mood.id;
        return (
          <Card
            key={mood.id}
            padding="sm"
            selected={isSelected}
            onPress={() => onSelect(mood.id)}
            accessibilityLabel={mood.label}
            className="flex-1 items-center gap-2"
          >
            <Image
              source={mood.image}
              className="h-10 w-10"
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            {showLabels && (
              <Text
                variant="caption"
                weight={isSelected ? 'semibold' : 'regular'}
                tone={isSelected ? 'content' : 'muted'}
                className="text-center"
              >
                {mood.label}
              </Text>
            )}
          </Card>
        );
      })}
    </View>
  );
}
