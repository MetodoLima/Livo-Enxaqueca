import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import Text from '@/components/ui/Text';
import { color } from '@/constants/Colors';
import { LOCATIONS, SIDES, type CrisisRecord, type LocationId, type SideId } from '@/types/crisis';

export const LOCATION_ICONS: Record<LocationId, ImageSourcePropType> = {
  frontal: require('@/assets/images/crisis/locations/Frontal.png'),
  temporal: require('@/assets/images/crisis/locations/Temporal.png'),
  occipital: require('@/assets/images/crisis/locations/Nuca.png'),
  atras_olhos: require('@/assets/images/crisis/locations/AtrasOlhos.png'),
  difusa: require('@/assets/images/crisis/locations/Difusa.png'),
};

const COLUNAS = 2;
const ESPACO = 12;

interface LocationPickerProps {
  location: LocationId | null;
  side: SideId | null;
  onChange: (patch: Partial<CrisisRecord>) => void;
}

export default function LocationPicker({ location, side, onChange }: LocationPickerProps) {
  const [larguraDaGrade, setLarguraDaGrade] = useState(0);
  const larguraDoItem = larguraDaGrade > 0 ? (larguraDaGrade - ESPACO * (COLUNAS - 1)) / COLUNAS : undefined;

  const toggleLocation = (id: LocationId) => {
    onChange({ location: location === id ? null : id });
  };

  const toggleSide = (id: SideId) => {
    onChange({ side: side === id ? null : id });
  };

  return (
    <View className="gap-6">
      <View
        className="flex-row flex-wrap justify-center gap-3"
        onLayout={(e) => setLarguraDaGrade(e.nativeEvent.layout.width)}
      >
        {LOCATIONS.map((loc) => {
          const isActive = location === loc.id;
          return (
            <Card
              key={loc.id}
              padding="sm"
              selected={isActive}
              onPress={() => toggleLocation(loc.id)}
              accessibilityLabel={loc.label}
              className="min-h-28 items-center justify-center gap-2"
              style={{ width: larguraDoItem }}
            >
              <Image source={LOCATION_ICONS[loc.id]} resizeMode="contain" className="h-12 w-12" />
              <Text variant="caption" weight="semibold" tone={isActive ? 'content' : 'muted'} className="text-center">
                {loc.label}
              </Text>
              {isActive ? (
                <View className="absolute right-3 top-3">
                  <Check size={16} color={color.primary} />
                </View>
              ) : null}
            </Card>
          );
        })}
      </View>

      {location ? (
        <View className="gap-3">
          <Text variant="heading" className="text-center">
            Qual lado?
          </Text>
          <View className="flex-row flex-wrap justify-center gap-2">
            {SIDES.map((s) => (
              <Chip
                key={s.id}
                label={s.label}
                tone="primary"
                selected={side === s.id}
                onPress={() => toggleSide(s.id)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
