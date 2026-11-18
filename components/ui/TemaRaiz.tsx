import { vars } from 'nativewind';
import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import { variaveisDoTema } from '@/constants/temas';
import { useTema } from '@/hooks/useTema';

/** Injeta as variáveis de cor do tema ativo; toda classe `bg-canvas`, `text-content` etc. as lê daqui. */
export default function TemaRaiz({ children }: { children: ReactNode }) {
  const { tema, color } = useTema();
  const estilo = useMemo(() => [{ flex: 1, backgroundColor: color.canvas }, vars(variaveisDoTema(tema))], [tema, color]);
  return <View style={estilo}>{children}</View>;
}
