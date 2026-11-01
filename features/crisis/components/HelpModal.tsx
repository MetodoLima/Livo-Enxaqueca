import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Text from '@/components/ui/Text';

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export default function HelpModal({ visible, onClose, title, message }: HelpModalProps) {
  return (
    <Dialog
      visible={visible}
      title={title}
      onClose={onClose}
      footer={<Button title="Entendi" accessibilityLabel="Entendi, fechar ajuda" onPress={onClose} />}
    >
      <Text tone="muted">{message}</Text>
    </Dialog>
  );
}
