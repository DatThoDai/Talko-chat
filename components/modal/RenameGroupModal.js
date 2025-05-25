import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../styles';
import { conversationApi } from '../../api';

const RenameGroupModal = ({ 
  visible, 
  onClose, 
  conversationId, 
  currentName = '', 
  onRenameSuccess 
}) => {
  const [newName, setNewName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newName || newName.trim() === '') {
      Alert.alert('Lỗi', 'Tên nhóm không được để trống');
      return;
    }

    if (newName.trim() === currentName) {
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      // Gọi API để đổi tên nhóm
      await conversationApi.updateName(conversationId, { name: newName.trim() });
      
      // Thông báo thành công
      Alert.alert('Thành công', 'Đã đổi tên nhóm thành công');
      
      // Gọi callback để cập nhật UI
      if (onRenameSuccess) {
        onRenameSuccess(newName.trim());
      }
      
      // Đóng modal
      onClose();
    } catch (error) {
      console.error('Error renaming group:', error);
      Alert.alert('Lỗi', 'Không thể đổi tên nhóm. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Đổi tên nhóm</Text>
          
          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
            placeholder="Nhập tên nhóm mới"
            autoFocus
            maxLength={50}
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]} 
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Lưu</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.dark,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...typography.body,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.light,
    marginRight: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
  cancelButtonText: {
    ...typography.body,
    color: colors.dark,
  },
  saveButtonText: {
    ...typography.body,
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default RenameGroupModal; 