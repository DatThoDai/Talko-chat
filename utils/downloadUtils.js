import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

/**
 * Tải xuống file từ URL và lưu vào thiết bị
 * @param {string} fileUrl - URL của file cần tải xuống
 * @param {string} fileName - Tên file
 * @param {string} fileType - Loại file
 */
export const downloadFile = async (fileUrl, fileName, fileType) => {
  try {
    // Kiểm tra quyền truy cập thư viện phương tiện
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Cần quyền truy cập',
        'Ứng dụng cần quyền truy cập thư viện phương tiện để tải file.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Hiển thị thông báo đang tải
    Alert.alert('Đang tải xuống...', 'Vui lòng đợi trong giây lát');

    // Đảm bảo tên file hợp lệ
    const sanitizedFileName = fileName ? fileName.replace(/[^a-zA-Z0-9\._-]/g, '_') : `file-${Date.now()}`;
    
    // Tạo đường dẫn tệp tạm thời
    const fileUri = FileSystem.documentDirectory + sanitizedFileName;

    // Tạo callback để theo dõi tiến trình tải xuống
    const downloadResumable = FileSystem.createDownloadResumable(
      fileUrl,
      fileUri,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        console.log(`Download progress: ${progress * 100}%`);
      }
    );

    // Bắt đầu tải xuống
    const { uri } = await downloadResumable.downloadAsync();
    console.log('File downloaded to:', uri);

    // Tuỳ vào platform để lưu hoặc chia sẻ file
    if (Platform.OS === 'ios') {
      // Trên iOS, sử dụng Sharing để chia sẻ file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Lỗi', 'Thiết bị không hỗ trợ chia sẻ file');
      }
    } else {
      // Trên Android, lưu file vào bộ nhớ thiết bị
      try {
        const asset = await MediaLibrary.createAssetAsync(uri);
        // Lưu vào album Downloads (tạo mới nếu chưa có)
        const album = await MediaLibrary.getAlbumAsync('Downloads');
        if (album === null) {
          await MediaLibrary.createAlbumAsync('Downloads', asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
        Alert.alert('Thành công', 'File đã được tải xuống và lưu vào thư mục Downloads');
      } catch (err) {
        console.error('Error saving to media library:', err);
        // Fallback: Chia sẻ file nếu không thể lưu
        await Sharing.shareAsync(uri);
      }
    }
  } catch (error) {
    console.error('Lỗi khi tải file:', error);
    Alert.alert('Lỗi', 'Không thể tải xuống file. Vui lòng thử lại sau.');
  }
};

/**
 * Mở file với ứng dụng thích hợp
 * @param {string} fileUrl - URL của file cần mở
 * @param {string} fileName - Tên file
 */
export const openFile = async (fileUrl, fileName) => {
  try {
    // Đảm bảo tên file hợp lệ
    const sanitizedFileName = fileName ? fileName.replace(/[^a-zA-Z0-9\._-]/g, '_') : `file-${Date.now()}`;
    const fileUri = FileSystem.documentDirectory + sanitizedFileName;
    
    // Kiểm tra xem file đã tải về chưa
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
    if (!fileInfo.exists) {
      // Hiển thị thông báo đang tải
      Alert.alert('Đang chuẩn bị mở file...', 'Vui lòng đợi trong giây lát');
      
      const downloadResumable = FileSystem.createDownloadResumable(
        fileUrl,
        fileUri
      );
      
      const { uri } = await downloadResumable.downloadAsync();
      
      // Mở file với ứng dụng phù hợp
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Lỗi', 'Thiết bị không hỗ trợ mở file này');
      }
    } else {
      // File đã tồn tại, mở trực tiếp
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Lỗi', 'Thiết bị không hỗ trợ mở file này');
      }
    }
  } catch (error) {
    console.error('Lỗi khi mở file:', error);
    Alert.alert('Lỗi', 'Không thể mở file. Vui lòng thử lại sau.');
  }
};