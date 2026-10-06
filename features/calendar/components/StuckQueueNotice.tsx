import { View, Text } from 'react-native';
import { Clock } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useSync } from '@/contexts/SyncContext';

export default function StuckQueueNotice() {
  const { fila } = useSync();

  if (!fila.travado) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: 'rgba(232, 144, 79, 0.10)',
        borderLeftWidth: 3,
        borderLeftColor: Colors.orange,
      }}
    >
      <Clock size={16} color={Colors.orange} />
      <Text
        style={{
          flex: 1,
          color: Colors.soft,
          fontFamily: 'Epilogue_400Regular',
          fontSize: 13,
          lineHeight: 18,
        }}
      >
        Alguns registros estão só neste celular. Mantenha o aplicativo instalado até eles
        aparecerem sem o relógio.
      </Text>
    </View>
  );
}
