import React, {useState} from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Video} from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

const {width, height} = Dimensions.get('window');

const ViewImageModal = ({imageProps, setImageProps}) => {
  const {isVisible, userName, content, isImage} = imageProps;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [videoRef, setVideoRef] = useState(null);

  // Close the modal
  const handleClose = () => {
    if (videoRef) {
      videoRef.stopAsync();
    }
    setImageProps({
      isVisible: false,
      userName: '',
      content: [],
      isImage: true,
    });
    setCurrentIndex(0);
  };

  // Download the current image or video
  const handleDownload = async () => {
    try {
      setIsLoading(true);
      
      // Request permissions
      const {status} = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Cần cấp quyền truy cập thư viện để lưu tệp');
        setIsLoading(false);
        return;
      }
      
      // Get the current file URL
      let fileUrl;
      if (isImage) {
        fileUrl = content[currentIndex]?.url;
      } else {
        fileUrl = content;
      }
      
      if (!fileUrl) {
        alert('Không thể tải xuống tệp này');
        setIsLoading(false);
        return;
      }
      
      // Generate a local file path
      const fileExtension = fileUrl.split('.').pop();
      const fileName = `talko_${Date.now()}.${fileExtension}`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      // Download the file
      const downloadResult = await FileSystem.downloadAsync(fileUrl, fileUri);
      
      if (downloadResult.status === 200) {
        // Save to media library
        if (isImage) {
          await MediaLibrary.saveToLibraryAsync(fileUri);
          alert('Đã lưu ảnh vào thư viện');
        } else {
          await MediaLibrary.saveToLibraryAsync(fileUri);
          alert('Đã lưu video vào thư viện');
        }
      } else {
        alert('Không thể tải xuống tệp');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Có lỗi xảy ra khi tải xuống tệp');
      setIsLoading(false);
    }
  };

  // Share the current image or video
  const handleShare = async () => {
    try {
      setIsLoading(true);
      
      // Get the current file URL
      let fileUrl;
      if (isImage) {
        fileUrl = content[currentIndex]?.url;
      } else {
        fileUrl = content;
      }
      
      if (!fileUrl) {
        alert('Không thể chia sẻ tệp này');
        setIsLoading(false);
        return;
      }
      
      // Generate a local file path
      const fileExtension = fileUrl.split('.').pop();
      const fileName = `talko_${Date.now()}.${fileExtension}`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      // Download the file
      const downloadResult = await FileSystem.downloadAsync(fileUrl, fileUri);
      
      if (downloadResult.status === 200) {
        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri);
        } else {
          alert('Chia sẻ không được hỗ trợ trên thiết bị này');
        }
      } else {
        alert('Không thể tải xuống tệp để chia sẻ');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error sharing file:', error);
      alert('Có lỗi xảy ra khi chia sẻ tệp');
      setIsLoading(false);
    }
  };

  // Navigate to the next image
  const handleNext = () => {
    if (isImage && content.length > 1 && currentIndex < content.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Navigate to the previous image
  const handlePrevious = () => {
    if (isImage && content.length > 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Render image content
  const renderImageContent = () => {
    if (!content || (Array.isArray(content) && content.length === 0)) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="image-outline" size={48} color="#888" />
          <Text style={styles.errorText}>Không thể tải ảnh</Text>
        </View>
      );
    }

    if (isImage) {
      const currentImage = content[currentIndex];
      return (
        <View style={styles.imageContainer}>
          <Image
            source={{uri: currentImage?.url}}
            style={styles.image}
            resizeMode="contain"
          />
          
          {content.length > 1 && (
            <View style={styles.navigationContainer}>
              <TouchableOpacity
                style={[styles.navButton, currentIndex === 0 && styles.disabledNavButton]}
                onPress={handlePrevious}
                disabled={currentIndex === 0}>
                <Icon name="chevron-back" size={24} color="#FFF" />
              </TouchableOpacity>
              
              <Text style={styles.pageIndicator}>
                {currentIndex + 1}/{content.length}
              </Text>
              
              <TouchableOpacity
                style={[styles.navButton, currentIndex === content.length - 1 && styles.disabledNavButton]}
                onPress={handleNext}
                disabled={currentIndex === content.length - 1}>
                <Icon name="chevron-forward" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    } else {
      return (
        <Video
          ref={ref => setVideoRef(ref)}
          source={{uri: content}}
          style={styles.video}
          useNativeControls
          resizeMode="contain"
          shouldPlay
          isLooping
        />
      );
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent={false}
      animationType="fade"
      onRequestClose={handleClose}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Icon name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <Text style={styles.userName} numberOfLines={1}>
            {userName || 'Ảnh'}
          </Text>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleDownload}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Icon name="download-outline" size={24} color="#FFF" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleShare}
              disabled={isLoading}>
              <Icon name="share-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.content}>
          {renderImageContent()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginHorizontal: 16,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width,
    height: height - 120,
  },
  video: {
    width,
    height: height - 120,
  },
  navigationContainer: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  disabledNavButton: {
    opacity: 0.5,
  },
  pageIndicator: {
    color: '#FFF',
    fontSize: 16,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#888',
    fontSize: 16,
    marginTop: 8,
  },
});

export default ViewImageModal;
