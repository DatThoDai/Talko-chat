import React from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useDispatch} from 'react-redux';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {sendFileMessage} from '../../redux/chatSlice';
import {messageType} from '../../constants';

const ImagePickerModal = ({modalVisible, setModalVisible, conversationId}) => {
  const dispatch = useDispatch();

  // Close the modal
  const handleClose = () => {
    setModalVisible(false);
  };

  // Take a photo using the camera
  const handleTakePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        console.error('Camera error:', result.errorMessage);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const photo = result.assets[0];
        handleUploadFile(photo, messageType.IMAGE);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  // Pick an image from the gallery
  const handleChooseImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        console.error('Image picker error:', result.errorMessage);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const image = result.assets[0];
        handleUploadFile(image, messageType.IMAGE);
      }
    } catch (error) {
      console.error('Error choosing image:', error);
    }
  };

  // Pick a video from the gallery
  const handleChooseVideo = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'video',
        quality: 0.8,
        videoQuality: 'medium',
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        console.error('Video picker error:', result.errorMessage);
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const video = result.assets[0];
        handleUploadFile(video, messageType.VIDEO);
      }
    } catch (error) {
      console.error('Error choosing video:', error);
    }
  };

  // Pick a file (document)
  const handleChooseFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        handleUploadFile({
          uri: file.uri,
          type: file.mimeType || 'application/octet-stream',
          name: file.name,
          size: file.size,
        }, messageType.FILE);
      }
    } catch (error) {
      console.error('Error choosing file:', error);
    }
  };

  // Handle file upload
  const handleUploadFile = (file, type) => {
    if (!file || !conversationId) return;

    const fileData = {
      uri: file.uri,
      type: file.type || 'application/octet-stream',
      name: file.fileName || file.name || `file_${Date.now()}`,
    };

    dispatch(sendFileMessage({
      conversationId,
      file: fileData,
      fileType: type,
      content: '',
    }))
      .unwrap()
      .then(() => {
        setModalVisible(false);
      })
      .catch((error) => {
        console.error('Error sending file message:', error);
      });
  };

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="slide"
      onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chia sẻ</Text>
                <TouchableOpacity onPress={handleClose}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsContainer}>
                <TouchableOpacity style={styles.option} onPress={handleTakePhoto}>
                  <View style={[styles.iconCircle, {backgroundColor: '#4CAF50'}]}>
                    <Icon name="camera" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.optionText}>Chụp ảnh</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option} onPress={handleChooseImage}>
                  <View style={[styles.iconCircle, {backgroundColor: '#2196F3'}]}>
                    <Icon name="image" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.optionText}>Thư viện ảnh</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option} onPress={handleChooseVideo}>
                  <View style={[styles.iconCircle, {backgroundColor: '#FF9800'}]}>
                    <Icon name="videocam" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.optionText}>Video</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.option} onPress={handleChooseFile}>
                  <View style={[styles.iconCircle, {backgroundColor: '#9C27B0'}]}>
                    <Icon name="document" size={24} color="#FFFFFF" />
                  </View>
                  <Text style={styles.optionText}>Tệp</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.noteText}>
                * Kích thước tệp tối đa: 25MB
              </Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E6E7',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-around',
  },
  option: {
    width: '25%',
    alignItems: 'center',
    marginVertical: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  noteText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default ImagePickerModal;
