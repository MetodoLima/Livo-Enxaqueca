import { useRouter } from 'expo-router';
import { Bell, ChevronRight, FileText, LogOut, Shield, Type, User, type LucideIcon } from 'lucide-react-native';
import { useRef, useState, type RefObject } from 'react';
import { Modal, View } from 'react-native';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import Dialog from '@/components/ui/Dialog';
import IconBadge from '@/components/ui/IconBadge';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Text from '@/components/ui/Text';
import { color } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useAppLock } from '@/features/app-lock/AppLockContext';
import AppLockScreen from '@/features/app-lock/AppLockScreen';
import ExportModal from '@/features/profile/ExportModal';
import { usePdfExport } from '@/features/profile/usePdfExport';
import { sessionRepository } from '@/repositories';

interface ItemDoMenuProps {
  icon: LucideIcon;
  label: string;
  desc: string;
  onPress?: () => void;
  ref?: RefObject<View | null>;
}

function ItemDoMenu({ icon, label, desc, onPress, ref }: ItemDoMenuProps) {
  const conteudo = (
    <View className="flex-row items-center gap-3">
      <IconBadge icon={icon} tone="neutral" />
      <View className="flex-1 gap-1">
        <Text weight="semibold">{label}</Text>
        <Text variant="caption" tone="muted">
          {desc}
        </Text>
      </View>
      {onPress ? <ChevronRight size={20} color={color.contentMuted} /> : <Chip label="Em breve" />}
    </View>
  );

  if (onPress) {
    return (
      <Card ref={ref} padding="sm" accessibilityLabel={`${label}. ${desc}`} onPress={onPress}>
        {conteudo}
      </Card>
    );
  }

  return (
    <Card padding="sm">
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${desc}. Em breve`}
        accessibilityState={{ disabled: true }}
        accessibilityHint="Esta opção ainda não está disponível"
      >
        {conteudo}
      </View>
    </Card>
  );
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [appLockModalVisible, setAppLockModalVisible] = useState(false);
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  const [erroNoRelatorio, setErroNoRelatorio] = useState(false);
  const { config } = useAppLock();
  const { exportPdf, loading: pdfLoading } = usePdfExport();
  const exportarRef = useRef<View>(null);
  const sairRef = useRef<View>(null);

  const nome = user?.user_metadata?.name ? `${user.user_metadata.name}` : 'Visitante';

  const handleExport = async (months: number) => {
    const userName = user?.user_metadata?.name ?? user?.email ?? 'Paciente';
    try {
      await exportPdf(months, userName);
      setExportModalVisible(false);
    } catch {
      setExportModalVisible(false);
      setErroNoRelatorio(true);
    }
  };

  const sair = async () => {
    setConfirmandoSaida(false);
    await sessionRepository.signOut();
  };

  return (
    <Screen scroll>
      <ScreenHeader title="Perfil" />

      <View className="gap-4">
        <Card padding="sm">
          <View className="flex-row items-center gap-3" accessible accessibilityLabel={`${nome}${user?.email ? `, ${user.email}` : ''}`}>
            <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-subtle">
              <User size={24} color={color.primary} />
            </View>
            <View className="flex-1 gap-1">
              <Text variant="heading">{nome}</Text>
              {user?.email ? (
                <Text variant="caption" tone="muted">
                  {user.email}
                </Text>
              ) : null}
            </View>
          </View>
        </Card>

        <ItemDoMenu icon={Shield} label="Dados de saúde" desc="Perfil médico e alergias" />
        <ItemDoMenu
          icon={Type}
          label="Aparência"
          desc="Tamanho, fonte e espaçamento do texto"
          onPress={() => router.push('/appearance')}
        />
        <ItemDoMenu icon={Bell} label="Lembretes" desc="Medicações e hidratação" />
        <ItemDoMenu
          ref={exportarRef}
          icon={FileText}
          label="Exportar dados"
          desc="PDF para seu médico"
          onPress={() => setExportModalVisible(true)}
        />
        <ItemDoMenu icon={Shield} label="Segurança" desc="PIN e biometria" onPress={() => setAppLockModalVisible(true)} />

        <Button
          ref={sairRef}
          title="Sair da conta"
          variant="danger"
          icon={LogOut}
          onPress={() => setConfirmandoSaida(true)}
          className="mt-4"
        />
      </View>

      <ExportModal
        visible={exportModalVisible}
        loading={pdfLoading}
        onClose={() => setExportModalVisible(false)}
        onSelect={handleExport}
        returnFocusTo={exportarRef}
      />

      <Dialog
        visible={erroNoRelatorio}
        title="Não foi possível gerar o relatório"
        onClose={() => setErroNoRelatorio(false)}
        returnFocusTo={exportarRef}
        footer={<Button title="Entendi" onPress={() => setErroNoRelatorio(false)} />}
      >
        <Text tone="muted">Tente novamente.</Text>
      </Dialog>

      <Dialog
        visible={confirmandoSaida}
        title="Sair da conta?"
        onClose={() => setConfirmandoSaida(false)}
        returnFocusTo={sairRef}
        footer={
          <View className="flex-row flex-wrap gap-3">
            <Button title="Cancelar" variant="ghost" onPress={() => setConfirmandoSaida(false)} className="flex-grow" />
            <Button title="Sair" variant="danger" onPress={sair} className="flex-grow" />
          </View>
        }
      >
        <Text tone="muted">Você vai precisar entrar de novo para ver seus registros.</Text>
      </Dialog>

      <Modal visible={appLockModalVisible} animationType="slide" onRequestClose={() => setAppLockModalVisible(false)}>
        <AppLockScreen mode={config ? 'manage' : 'setup'} onClose={() => setAppLockModalVisible(false)} />
      </Modal>
    </Screen>
  );
}
