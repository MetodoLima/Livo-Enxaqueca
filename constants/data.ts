import { Moon, Droplets, Plus, Mic } from 'lucide-react-native';
import { color } from './Colors';
import { ImageSourcePropType } from 'react-native';

export const MOODS = [
  { image: require('../assets/images/LivoPessimo.png') as ImageSourcePropType, label: 'Péssimo', id: 'terrible' },
  { image: require('../assets/images/LivoRuim.png') as ImageSourcePropType, label: 'Ruim', id: 'bad' },
  { image: require('../assets/images/LivoRegular.png') as ImageSourcePropType, label: 'Regular', id: 'so-so' },
  { image: require('../assets/images/LivoBem.png') as ImageSourcePropType, label: 'Bem', id: 'okay' },
  { image: require('../assets/images/LivoOtimo.png') as ImageSourcePropType, label: 'Ótimo', id: 'great' },
] as const;

export type MoodId = (typeof MOODS)[number]['id'];

export const HABITS = [
  { icon: Moon, label: 'Sono', color: color.secondary },
  { icon: Droplets, label: 'Água', color: color.primary },
  { icon: Plus, label: 'Hábitos', color: color.contentMuted },
  { icon: Mic, label: 'Voz', color: color.attention },
] as const;
