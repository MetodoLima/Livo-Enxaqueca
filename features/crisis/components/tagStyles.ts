import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';

export const tagStyles = StyleSheet.create({
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: `${Colors.purple}15`,
  },
  tagEmoji: {
    fontSize: 16,
  },
  tagText: {
    fontSize: 13,
    fontFamily: 'Epilogue_600SemiBold',
    color: Colors.purple,
  },
});
