import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, Linking, Share, Platform } from 'react-native';
import { useSelector, useStore } from 'react-redux';
import { colors, spacing, typography } from '../styles';
import { messageType } from '../constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

const FileScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('image'); // 'image', 'video', 'file'
  
  // Thêm code debug để xem cấu trúc Redux store
  const store = useStore();
  useEffect(() => {
    const state = store.getState();
    console.log('Redux state keys:', Object.keys(state));
  }, []);
  
  // Sửa selector để truy cập đúng đường dẫn và xử lý an toàn
  const files = useSelector(state => {
    // Kiểm tra từng cấp của state để tránh lỗi
    if (!state) return [];
    
    // Trường hợp 1: files nằm trực tiếp trong state.chat
    if (state.chat?.files) {
      return Array.isArray(state.chat.files) ? state.chat.files : [];
    }
    
    // Trường hợp 2: files nằm trong state.message
    if (state.message?.files) {
      return Array.isArray(state.message.files) ? state.message.files : [];
    }
    
    // Trường hợp mặc định: trả về mảng rỗng
    return [];
  });
  
  // Tương tự cho loading
  const loading = useSelector(state => 
    state?.chat?.loading || state?.message?.loading || false
  );
  
  // Cập nhật phương thức lọc files
  const imageFiles = files.filter(file => file.type === 'IMAGE');
  const videoFiles = files.filter(file => file.type === 'VIDEO');
  const docFiles = files.filter(file => file.type === 'FILE');

  // Debug để xác nhận số lượng files trong từng loại
  useEffect(() => {
    console.log('Total files:', files.length);
    console.log('Images:', imageFiles.length);
    console.log('Videos:', videoFiles.length);
    console.log('Documents:', docFiles.length);
  }, [files, imageFiles, videoFiles, docFiles]);
  
  const renderTab = (title, tabKey, count) => (
    <TouchableOpacity 
      style={[styles.tab, activeTab === tabKey && styles.activeTab]} 
      onPress={() => setActiveTab(tabKey)}
    >
      <Text style={[styles.tabText, activeTab === tabKey && styles.activeTabText]}>
        {title} ({count})
      </Text>
    </TouchableOpacity>
  );
  
  // Cập nhật renderImageItem
  const renderImageItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.imageContainer}
      onPress={() => {
        navigation.navigate('ImageViewer', { uri: item.url || item.content });
      }}
    >
      <Image 
        source={{ uri: item.url || item.content }} 
        style={styles.image} 
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
  
  // Cập nhật renderVideoItem
  const renderVideoItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.videoContainer}
      onPress={() => {
        navigation.navigate('VideoPlayer', { uri: item.url || item.content });
      }}
    >
      <Image 
        source={{ uri: item.thumbnailUrl || item.url || item.content }} 
        style={styles.videoThumbnail}
        resizeMode="cover"
      />
      <View style={styles.playIconContainer}>
        <Icon name="play-arrow" size={30} color={colors.white} />
      </View>
    </TouchableOpacity>
  );
  
  const renderFileItem = ({ item }) => {
    // Trích xuất tên file từ URL
    const getFileName = (url) => {
      if (!url) return 'Tệp đính kèm';
      // Lấy phần cuối của URL sau dấu "/"
      const parts = url.split('/');
      const fullFileName = parts[parts.length - 1];
      
      // Xóa timestamp nếu có
      const fileNameParts = fullFileName.split('-');
      if (fileNameParts.length > 2) {
        // Trả về tất cả trừ phần timestamp giữa
        return fileNameParts.slice(2).join('-');
      }
      
      return fullFileName;
    };
    
    // Trích xuất kích thước file (giả lập vì API không trả về)
    const getFileSize = () => {
      return '~100 KB'; // Giá trị mặc định
    };
    
    // Lấy icon phù hợp với loại file
    const getFileIcon = (fileName) => {
      if (!fileName) return 'insert-drive-file';
      
      const extension = fileName.split('.').pop().toLowerCase();
      
      switch (extension) {
        case 'pdf':
          return 'picture-as-pdf';
        case 'doc':
        case 'docx':
          return 'description';
        case 'xls':
        case 'xlsx':
          return 'table-chart';
        case 'ppt':
        case 'pptx':
          return 'slideshow';
        case 'zip':
        case 'rar':
          return 'folder-zip';
        default:
          return 'insert-drive-file';
      }
    };
    
    const fileName = getFileName(item.content);
    const fileIcon = getFileIcon(fileName);
    
    return (
      <TouchableOpacity 
        style={styles.fileContainer}
        onPress={() => {
          // Xử lý khi nhấn vào file - tải xuống hoặc mở
          Alert.alert(
            'Tệp đính kèm',
            'Bạn muốn làm gì với tệp này?',
            [
              { text: 'Hủy', style: 'cancel' },
              { 
                text: 'Mở', 
                onPress: () => Linking.openURL(item.content)
              },
              {
                text: 'Tải xuống',
                onPress: () => downloadFile(item.content, fileName)
              }
            ]
          );
        }}
      >
        <Icon name={fileIcon} size={24} color={colors.primary} style={styles.fileIcon} />
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
          <Text style={styles.fileSize}>
            {getFileSize()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Sửa renderContent để thêm key cho mỗi FlatList
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    
    switch (activeTab) {
      case 'image':
        return imageFiles.length > 0 ? (
          <FlatList
            key="image-grid"  // Thêm key duy nhất
            data={imageFiles}
            renderItem={renderImageItem}
            keyExtractor={item => item._id || Math.random().toString()}
            numColumns={3}
            contentContainerStyle={styles.gridContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có ảnh nào</Text>
          </View>
        );
        
      case 'video':
        return videoFiles.length > 0 ? (
          <FlatList
            key="video-grid"  // Thêm key duy nhất
            data={videoFiles}
            renderItem={renderVideoItem}
            keyExtractor={item => item._id || Math.random().toString()}
            numColumns={2}
            contentContainerStyle={styles.gridContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có video nào</Text>
          </View>
        );
        
      case 'file':
        return docFiles.length > 0 ? (
          <FlatList
            key="file-list"  // Thêm key duy nhất
            data={docFiles}
            renderItem={renderFileItem}
            keyExtractor={item => item._id || Math.random().toString()}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có tệp đính kèm nào</Text>
          </View>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        {renderTab('Ảnh', 'image', imageFiles.length)}
        {renderTab('Video', 'video', videoFiles.length)}
        {renderTab('File', 'file', docFiles.length)}
      </View>
      
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
    </View>
  );
};

// Thêm hàm tải file
const downloadFile = async (url, fileName) => {
  try {
    // Kiểm tra quyền truy cập
    let { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần quyền truy cập để tải file');
      return;
    }
    
    // Hiển thị thông báo đang tải
    Alert.alert('Đang tải xuống', 'Vui lòng đợi trong giây lát...');
    
    // Tạo tên file nếu không có
    const fileNameToSave = fileName || `talko-file-${Date.now()}`;
    
    // Đường dẫn lưu file
    const fileUri = FileSystem.documentDirectory + fileNameToSave;
    
    // Tải file
    const downloadResult = await FileSystem.downloadAsync(url, fileUri);
    
    if (downloadResult.status === 200) {
      // Android: Lưu vào thư viện
      if (Platform.OS === 'android') {
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        await MediaLibrary.createAlbumAsync('Download', asset, false);
      } 
      // iOS: Chia sẻ file
      else {
        await Share.share({
          url: fileUri,
          message: 'Tải xuống từ Talko Chat'
        });
      }
      
      Alert.alert('Thành công', `Đã tải file ${fileNameToSave} thành công`);
    } else {
      Alert.alert('Lỗi', 'Không thể tải file');
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    Alert.alert('Lỗi', 'Không thể tải file: ' + error.message);
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.gray,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  gridContainer: {
    padding: spacing.xs,
  },
  listContainer: {
    padding: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.gray,
  },
  imageContainer: {
    flex: 1/3,
    aspectRatio: 1,
    padding: spacing.xs,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  videoContainer: {
    flex: 1/2,
    aspectRatio: 16/9,
    padding: spacing.xs,
    position: 'relative',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  playIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    margin: spacing.xs,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  fileIcon: {
    marginRight: spacing.md,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    ...typography.body,
    fontWeight: '500',
  },
  fileSize: {
    ...typography.caption,
    color: colors.gray,
  },
});

export default FileScreen;