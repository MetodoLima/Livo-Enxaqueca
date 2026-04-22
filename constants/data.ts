import { Moon, Droplets, Plus, Mic } from 'lucide-react-native';
import { Colors } from './Colors';

export const MOODS = [
  { emoji: '😊', label: 'Ótimo', id: 'great' },
  { emoji: '🙂', label: 'Bem', id: 'okay' },
  { emoji: '😐', label: 'Regular', id: 'so-so' },
  { emoji: '😣', label: 'Ruim', id: 'bad' },
  { emoji: '🤕', label: 'Péssimo', id: 'terrible' },
] as const;

export type MoodId = (typeof MOODS)[number]['id'];

export const HABITS = [
  { icon: Moon, label: 'Sono', color: Colors.purple },
  { icon: Droplets, label: 'Água', color: Colors.accent },
  { icon: Plus, label: 'Hábitos', color: Colors.muted },
  { icon: Mic, label: 'Voz', color: Colors.orange },
] as const;
