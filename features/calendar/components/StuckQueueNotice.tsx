import { Clock } from 'lucide-react-native';
import Notice from '@/components/ui/Notice';
import { useSync } from '@/contexts/SyncContext';

export default function StuckQueueNotice() {
  const { fila } = useSync();

  if (!fila.travado) return null;

  return (
    <Notice icon={Clock} tone="attention">
      Alguns registros estão só neste celular. Mantenha o aplicativo instalado até eles aparecerem sem o relógio.
    </Notice>
  );
}
