import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography } from '../../styles';
import { conversationApi } from '../../api';

const ChangeGroupAvatarModal = ({ visible, onClose, conversationId, onAvatarChanged }) => {
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        setLoading(true);
        const imageBase64 = result.assets[0].base64;
        
        try {
          // Get file extension from uri
          const uri = result.assets[0].uri;
          const extension = uri.split('.').pop().toLowerCase();
          let fileExtension = '.jpg'; // default extension
          
          // Map common image extensions
          if (extension === 'png') fileExtension = '.png';
          else if (extension === 'jpeg' || extension === 'jpg') fileExtension = '.jpg';
          else if (extension === 'gif') fileExtension = '.gif';

          // Prepare image data - don't add extension to fileName
          const imageData = {
            fileName: 'group_avatar', // Remove extension from fileName
            fileExtension: fileExtension, // Extension will be added by backend
            fileBase64: imageBase64 // Send raw base64 without data URI prefix
          };

          // Call API to update avatar
          const response = await conversationApi.updateAvatar(conversationId, imageData);
          
          if (response && response.data) {
            // Ensure we're passing the new avatar URL correctly
            const newAvatarUrl = response.data.avatar;
            console.log('New avatar URL:', newAvatarUrl);
            
            // Call the callback with the new avatar URL
            if (typeof onAvatarChanged === 'function') {
              onAvatarChanged(newAvatarUrl);
            }
            
            Alert.alert('Thành công', 'Đã cập nhật ảnh nhóm');
            onClose();
          }
        } catch (error) {
          console.error('Error updating group avatar:', error);
          Alert.alert('Lỗi', 'Không thể cập nhật ảnh nhóm. Vui lòng thử lại sau.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Thay đổi ảnh nhóm</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color={colors.dark} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.pickImageButton} onPress={pickImage}>
            <Icon name="photo-library" size={24} color={colors.primary} />
            <Text style={styles.pickImageText}>Chọn ảnh từ thư viện</Text>
          </TouchableOpacity>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.md,
    minHeight: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.dark,
  },
  closeButton: {
    padding: spacing.sm,
  },
  pickImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.light,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  pickImageText: {
    ...typography.body,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});

export default ChangeGroupAvatarModal; 