import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { colors, spacing, borderRadius } from '../styles';

const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB

const FileUploadComponent = ({ onFileSelect, onCancel }) => {
  // Handle taking a photo with the camera
  const handleTakePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        includeBase64: false,
      });
      
      if (result.didCancel) {
        return;
      }
      
      if (result.errorCode) {
        Alert.alert('Lỗi', `Không thể chụp ảnh: ${result.errorMessage}`);
        return;
      }
      
      const file = result.assets[0];
      
      if (file.fileSize > FILE_SIZE_LIMIT) {
        Alert.alert('Tệp quá lớn', 'Kích thước tệp không được vượt quá 10MB');
        return;
      }
      
      // Format file data for upload
      const formattedFile = {
        uri: file.uri,
        type: file.type,
        name: file.fileName || `photo_${new Date().getTime()}.jpg`,
        size: file.fileSize,
      };
      
      onFileSelect(formattedFile, 'IMAGE');
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại sau.');
    }
  };
  
  // Handle selecting an image from the gallery
  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        selectionLimit: 1,
        includeBase64: false,
      });
      
      if (result.didCancel) {
        return;
      }
      
      if (result.errorCode) {
        Alert.alert('Lỗi', `Không thể chọn ảnh: ${result.errorMessage}`);
        return;
      }
      
      const file = result.assets[0];
      
      if (file.fileSize > FILE_SIZE_LIMIT) {
        Alert.alert('Tệp quá lớn', 'Kích thước tệp không được vượt quá 10MB');
        return;
      }
      
      // Format file data for upload
      const formattedFile = {
        uri: file.uri,
        type: file.type,
        name: file.fileName || `image_${new Date().getTime()}.jpg`,
        size: file.fileSize,
      };
      
      onFileSelect(formattedFile, 'IMAGE');
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại sau.');
    }
  };
  
  // Handle selecting a video
  const handlePickVideo = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'video',
        quality: 0.8,
        selectionLimit: 1,
        durationLimit: 60, // 60 seconds max video length
        includeBase64: false,
      });
      
      if (result.didCancel) {
        return;
      }
      
      if (result.errorCode) {
        Alert.alert('Lỗi', `Không thể chọn video: ${result.errorMessage}`);
        return;
      }
      
      const file = result.assets[0];
      
      if (file.fileSize > FILE_SIZE_LIMIT) {
        Alert.alert('Tệp quá lớn', 'Kích thước tệp không được vượt quá 10MB');
        return;
      }
      
      // Format file data for upload
      const formattedFile = {
        uri: file.uri,
        type: file.type,
        name: file.fileName || `video_${new Date().getTime()}.mp4`,
        size: file.fileSize,
      };
      
      onFileSelect(formattedFile, 'VIDEO');
    } catch (error) {
      console.error('Video picker error:', error);
      Alert.alert('Lỗi', 'Không thể chọn video. Vui lòng thử lại sau.');
    }
  };
  
  // Handle selecting a document/file
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });
      
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        if (file.size > FILE_SIZE_LIMIT) {
          Alert.alert('Tệp quá lớn', 'Kích thước tệp không được vượt quá 10MB');
          return;
        }
        
        // Format file data for upload
        const formattedFile = {
          uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
          type: file.mimeType || 'application/octet-stream',
          name: file.name,
          size: file.size,
        };
        
        onFileSelect(formattedFile, 'FILE');
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Lỗi', 'Không thể chọn tệp. Vui lòng thử lại sau.');
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chia sẻ tệp</Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Icon name="close" size={24} color={colors.dark} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.option} onPress={handleTakePhoto}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.primary }]}>
            <Icon name="camera-alt" size={28} color={colors.white} />
          </View>
          <Text style={styles.optionText}>Chụp ảnh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.option} onPress={handlePickImage}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.success }]}>
            <Icon name="photo" size={28} color={colors.white} />
          </View>
          <Text style={styles.optionText}>Thư viện ảnh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.option} onPress={handlePickVideo}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.warning }]}>
            <Icon name="videocam" size={28} color={colors.white} />
          </View>
          <Text style={styles.optionText}>Video</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.option} onPress={handlePickDocument}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.info }]}>
            <Icon name="insert-drive-file" size={28} color={colors.white} />
          </View>
          <Text style={styles.optionText}>Tài liệu</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.noteText}>
          * Kích thước tối đa cho mỗi tệp là 10MB
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
  },
  closeButton: {
    padding: spacing.xs,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
  },
  option: {
    width: '25%',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  optionText: {
    fontSize: 13,
    color: colors.dark,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  noteText: {
    fontSize: 12,
    color: colors.gray,
    fontStyle: 'italic',
  },
});

export default FileUploadComponent;
