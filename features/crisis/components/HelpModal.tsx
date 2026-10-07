import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { HelpCircle } from 'lucide-react-native';

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export default function HelpModal({ visible, onClose, title, message }: HelpModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard} accessibilityViewIsModal={true}>
          <HelpCircle size={40} color={Colors.accent} style={{ marginBottom: 16 }} />
          <Text style={styles.modalTitle} accessibilityRole="header">{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.modalBtn}
            accessibilityRole="button"
            accessibilityLabel="Entendi, fechar ajuda"
          >
            <Text style={styles.modalBtnText}>Entendi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#0D2137',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3A52',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Epilogue_700Bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: 'Epilogue_400Regular',
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  modalBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  modalBtnText: {
    fontSize: 15,
    fontFamily: 'Epilogue_700Bold',
    color: 'white',
  },
});
