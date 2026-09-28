import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MOODS, MoodId } from '@/constants/data';
import { Colors } from '@/constants/Colors';
import { BlurView } from 'expo-blur';

interface MoodSelectorProps {
  selected: MoodId | null;
  onSelect: (id: MoodId) => void;
  showLabels?: boolean;
}

export default function MoodSelector({
  selected,
  onSelect,
  showLabels = true,
}: MoodSelectorProps) {
  return (
    <View style={styles.container}>
      {MOODS.map((mood) => {
        const isSelected = selected === mood.id;
        return (
          <TouchableOpacity
            key={mood.id}
            onPress={() => onSelect(mood.id)}
            style={[
              styles.card,
              isSelected && styles.cardSelected,
            ]}
            activeOpacity={0.7}
          >
            <BlurView
              intensity={40}
              tint="dark"
              style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]}
            />
            <View style={styles.cardContent} pointerEvents="none">
              <Image source={mood.image} style={styles.moodImage} resizeMode="contain" />
              {showLabels && (
                <Text
                  style={[
                    styles.label,
                    isSelected && styles.labelSelected,
                  ]}
                >
                  {mood.label}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#232533',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    aspectRatio: 0.7,
  },
  cardSelected: {
    backgroundColor: 'rgba(37, 183, 187, 0.12)',
    borderColor: Colors.accent,
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  moodImage: {
    width: 40,
    height: 40,
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Epilogue_500Medium',
    color: Colors.muted,
  },
  labelSelected: {
    color: Colors.accent,
    fontFamily: 'Epilogue_700Bold',
  },
});
