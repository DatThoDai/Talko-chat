import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { colors } from '../styles';

const { width, height } = Dimensions.get('window');

const ImageViewer = ({ route, navigation }) => {
  const { uri } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Xử lý tải xuống ảnh
  const handleDownload = async () => {
    try {
      // Kiểm tra quyền truy cập media library
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập', 'Cần quyền truy cập để lưu ảnh');
        return;
      }

      // Hiển thị thông báo đang tải xuống
      Alert.alert('Đang tải xuống', 'Vui lòng đợi trong giây lát...');

      // Tạo tên file random
      const fileName = `talko_image_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + fileName;

      // Tải file về thiết bị
      const downloadResult = await FileSystem.downloadAsync(uri, fileUri);

      if (downloadResult.status === 200) {
        // Lưu vào Media Library
        await MediaLibrary.saveToLibraryAsync(fileUri);
        Alert.alert('Thành công', 'Đã lưu ảnh vào thư viện');
      } else {
        Alert.alert('Lỗi', 'Không thể tải ảnh');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Lỗi', 'Không thể tải ảnh: ' + error.message);
    }
  };

  // Xử lý chia sẻ ảnh
  const handleShare = async () => {
    try {
      // Tạo tên file random
      const fileName = `talko_image_${Date.now()}.jpg`;
      const fileUri = FileSystem.documentDirectory + fileName;

      // Tải file về thiết bị trước khi chia sẻ
      const downloadResult = await FileSystem.downloadAsync(uri, fileUri);

      if (downloadResult.status === 200) {
        await Share.share({
          url: fileUri,
          message: 'Chia sẻ từ Talko Chat',
        });
      } else {
        Alert.alert('Lỗi', 'Không thể tải ảnh để chia sẻ');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Lỗi', 'Không thể chia sẻ ảnh: ' + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="black" barStyle="light-content" />

      {/* Thanh công cụ phía trên */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Icon name="share" size={24} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleDownload} style={styles.actionButton}>
            <Icon name="file-download" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Nội dung ảnh */}
      <View style={styles.imageContainer}>
        {loading && (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        )}
        
        {error && (
          <View style={styles.errorContainer}>
            <Icon name="broken-image" size={64} color="white" />
          </View>
        )}
        
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="contain"
          onLoadStart={() => setLoading(true)}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    marginLeft: 8,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height - 100,
  },
  loader: {
    position: 'absolute',
    zIndex: 10,
  },
  errorContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
});

export default ImageViewer;