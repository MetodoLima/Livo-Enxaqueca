import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MOODS, MoodId } from '@/constants/data';

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
    <View className="flex-row justify-between">
      {MOODS.map((mood) => {
        const isSelected = selected === mood.id;
        return (
          <TouchableOpacity
            key={mood.id}
            onPress={() => onSelect(mood.id)}
            className="items-center"
          >
            <View
              className={`
                w-12 h-12 rounded-full items-center justify-center
                ${isSelected ? 'bg-slate-700 border-2 border-accent' : 'bg-slate-800/60'}
              `}
            >
              <Text className="text-xl">{mood.emoji}</Text>
            </View>
            {showLabels && (
              <Text
                className={`text-[11px] mt-2 font-epilogue ${
                  isSelected ? 'text-accent font-epilogue-bold' : 'text-muted'
                }`}
              >
                {mood.label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
