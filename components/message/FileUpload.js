import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
  ToastAndroid
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing } from '../../styles';
import { MAX_FILE_SIZE } from '../../constants';

// Phương thức tĩnh để mở camera trực tiếp từ ngoài component
let fileSelectedCallback = null;

const FileUpload = ({ onFileSelected, isUploading = false, uploadProgress = 0 }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Show notification based on platform
  const showNotification = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Thông báo', message);
    }
  };
  
  // Check file size
  const checkFileSize = async (uri) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.size > MAX_FILE_SIZE) {
        showNotification(`Kích thước file quá lớn. Giới hạn ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking file size:', error);
      return false;
    }
  };
  
  // Xử lý khi chọn ảnh từ thư viện
  const handlePickImage = async () => {
    try {
      // Xin quyền truy cập thư viện ảnh
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Ứng dụng cần quyền truy cập thư viện ảnh để gửi hình ảnh.');
        return;
      }
      
      // Hiện thị thông báo đang tải
      showNotification('Đang tải ảnh...');
      
      // Mở picker để chọn ảnh
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Cho phép cả Images và Videos
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: false,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        
        // Check file size
        const validSize = await checkFileSize(selectedAsset.uri);
        if (!validSize) return;
        
        // Xác định loại media (hình ảnh hay video)
        const isVideo = selectedAsset.type && selectedAsset.type.startsWith('video');
        
        // Get file extension from URI
        const fileExtension = selectedAsset.uri.split('.').pop().toLowerCase();
        
        // Lấy dung lượng file
        const fileInfo = await FileSystem.getInfoAsync(selectedAsset.uri);
        const fileSize = fileInfo.size || selectedAsset.fileSize || 0;
        
        // Chuẩn bị thông tin file
        const fileData = {
          uri: selectedAsset.uri,
          name: isVideo ? `video_${Date.now()}.${fileExtension}` : `image_${Date.now()}.${fileExtension}`,
          type: isVideo ? `video/${fileExtension}` : `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
          size: fileSize,
          isImage: !isVideo,
          isVideo: isVideo,
        };
        
        setSelectedFile(fileData);
        onFileSelected(fileData);
        showNotification(isVideo ? 'Đã chọn video thành công' : 'Đã chọn ảnh thành công');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi chọn media. Vui lòng thử lại.');
    }
  };
  
  // Xử lý khi chọn file từ thiết bị
  const handlePickDocument = async () => {
    try {
      // Mở picker để chọn file
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false
      });
      
      if (result.type === 'success') {
        // Check file size
        const validSize = await checkFileSize(result.uri);
        if (!validSize) return;
        
        // Chuẩn bị thông tin file
        const fileInfo = {
          uri: result.uri,
          name: result.name,
          type: result.mimeType || 'application/octet-stream',
          size: result.size,
          isFile: true,
        };
        
        // Check supported file types
        const supportedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar'];
        const fileExtension = result.name.split('.').pop().toLowerCase();
        
        if (!supportedTypes.includes(fileExtension)) {
          showNotification(`Định dạng file ${fileExtension} không được hỗ trợ.`);
          return;
        }
        
        setSelectedFile(fileInfo);
        onFileSelected(fileInfo);
        showNotification('Đã chọn file thành công');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi chọn file. Vui lòng thử lại.');
    }
  };
  
  // Xử lý khi chụp ảnh từ camera
  const handleTakePhoto = async () => {
    try {
      // Xin quyền truy cập camera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Ứng dụng cần quyền truy cập camera để chụp ảnh.');
        return;
      }
      
      // Mở camera để chụp ảnh
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        
        // Check file size
        const validSize = await checkFileSize(selectedAsset.uri);
        if (!validSize) return;
        
        // Lấy dung lượng file
        const fileInfo = await FileSystem.getInfoAsync(selectedAsset.uri);
        const fileSize = fileInfo.size || 0;
        
        // Chuẩn bị thông tin file
        const fileData = {
          uri: selectedAsset.uri,
          name: `photo_${Date.now()}.jpg`,
          type: 'image/jpeg',
          size: fileSize,
          isImage: true,
        };
        
        setSelectedFile(fileData);
        onFileSelected(fileData);
        showNotification('Ảnh đã được chụp thành công');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi chụp ảnh. Vui lòng thử lại.');
    }
  };
  
  return (
    <View style={styles.container}>
      {isUploading ? (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.uploadingText}>
            Đang tải lên... {uploadProgress}%
          </Text>
        </View>
      ) : selectedFile ? (
        <View style={styles.previewContainer}>
          {selectedFile.isImage ? (
            <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} />
          ) : (
            <View style={styles.filePreview}>
              <Icon 
                name={selectedFile.isVideo ? "videocam" : "insert-drive-file"} 
                size={32} 
                color={colors.primary} 
              />
              <Text style={styles.fileName} numberOfLines={1}>
                {selectedFile.name}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.cancelButton} onPress={() => {
            setSelectedFile(null);
            // Gọi onFileSelected với null để hủy việc chọn file
            onFileSelected(null);
          }}>
            <Icon name="close" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.option} onPress={handlePickImage}>
            <Icon name="photo" size={24} color={colors.primary} />
            <Text style={styles.optionText}>Thư viện</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.option} onPress={handleTakePhoto}>
            <Icon name="camera-alt" size={24} color={colors.primary} />
            <Text style={styles.optionText}>Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.option} onPress={handlePickDocument}>
            <Icon name="attachment" size={24} color={colors.primary} />
            <Text style={styles.optionText}>File</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    padding: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  option: {
    alignItems: 'center',
    padding: spacing.small,
    borderRadius: 8,
    backgroundColor: colors.lightBackground,
    width: 80,
  },
  optionText: {
    marginTop: spacing.xsmall,
    fontSize: 12,
    color: colors.grey,
    textAlign: 'center',
  },
  uploadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.medium,
  },
  uploadingText: {
    marginLeft: spacing.small,
    fontSize: 14,
    color: colors.grey,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.small,
    backgroundColor: colors.lightBackground,
    borderRadius: 8,
    marginBottom: spacing.small,
  },
  previewImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.small,
    flex: 1,
  },
  fileName: {
    marginLeft: spacing.small,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  cancelButton: {
    padding: spacing.small,
  },
});

// Thêm phương thức tĩnh để mở camera từ bên ngoài
FileUpload.openCamera = async (callback) => {
  try {
    // Lưu callback để gọi sau khi chụp ảnh
    fileSelectedCallback = callback;
    
    // Xin quyền truy cập camera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Ứng dụng cần quyền truy cập camera để chụp ảnh.');
      return;
    }
    
    // Mở camera để chụp ảnh
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      
      // Kiểm tra dung lượng file
      if (selectedAsset.fileSize > MAX_FILE_SIZE) {
        Alert.alert('Thông báo', `Kích thước file quá lớn. Giới hạn ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
        return;
      }
      
      // Chuẩn bị thông tin file
      const fileInfo = {
        uri: selectedAsset.uri,
        name: `photo_${Date.now()}.jpg`,
        type: 'image/jpeg',
        size: selectedAsset.fileSize || 0,
        isImage: true,
      };
      
      // Gọi callback để trả về thông tin file
      if (typeof fileSelectedCallback === 'function') {
        fileSelectedCallback(fileInfo);
      }
    }
  } catch (error) {
    console.error('Error taking photo from static method:', error);
    Alert.alert('Lỗi', 'Đã xảy ra lỗi khi chụp ảnh. Vui lòng thử lại.');
  }
};

export default FileUpload;
