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
    console.log('Starting download for:', fileUrl);
    
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

    // Đảm bảo fileName và phần mở rộng file hợp lệ
    let sanitizedFileName = fileName || `file-${Date.now()}`;
    
    // Đảm bảo file có phần mở rộng
    if (!sanitizedFileName.includes('.')) {
      // Thêm phần mở rộng dựa vào fileType hoặc URL
      const extension = getExtensionFromTypeOrUrl(fileUrl, fileType);
      sanitizedFileName = `${sanitizedFileName}.${extension}`;
    }
    
    console.log('Saving file as:', sanitizedFileName);
    
    // Tạo đường dẫn tệp tạm thời với tên file đúng
    const fileUri = FileSystem.documentDirectory + sanitizedFileName;
    console.log('Saving to:', fileUri);

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
        // Đối với file không phải media (không hỗ trợ bởi MediaLibrary)
        if (!isMediaFile(sanitizedFileName)) {
          // Sử dụng Sharing API thay vì MediaLibrary
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(uri);
            return;
          }
        }
        
        // Thử lưu vào MediaLibrary cho file media
        const asset = await MediaLibrary.createAssetAsync(uri);
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
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('Thông báo', 'File đã được tải xuống nhưng không thể lưu vào thư viện. Đường dẫn: ' + uri);
        }
      }
    }
  } catch (error) {
    console.error('Lỗi khi tải file:', error);
    Alert.alert('Lỗi', 'Không thể tải xuống file. Vui lòng thử lại sau.');
  }
};

// Hàm phụ trợ để xác định phần mở rộng file từ fileType hoặc URL
function getExtensionFromTypeOrUrl(fileUrl, fileType) {
  // Thử lấy phần mở rộng từ URL trước
  if (fileUrl && typeof fileUrl === 'string') {
    const urlParts = fileUrl.split('?')[0].split('.');
    if (urlParts.length > 1) {
      const ext = urlParts.pop().toLowerCase();
      if (ext && ext.length >= 2 && ext.length <= 5) { // Chỉ lấy phần mở rộng hợp lệ
        return ext;
      }
    }
  }
  
  // Xác định phần mở rộng dựa vào fileType
  const typeMap = {
    'PDF': 'pdf',
    'DOC': 'doc',
    'EXCEL': 'xlsx',
    'PPT': 'pptx',
    'IMAGE': 'jpg',
    'VIDEO': 'mp4',
    'FILE': 'dat'
  };
  
  return typeMap[fileType] || 'bin';
}

// Kiểm tra xem file có phải là media file không
function isMediaFile(fileName) {
  const mediaExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'mp3', 'wav'];
  const extension = fileName.split('.').pop().toLowerCase();
  return mediaExtensions.includes(extension);
}

/**
 * Mở file với ứng dụng thích hợp
 * @param {string} fileUrl - URL của file cần mở
 * @param {string} fileName - Tên file
 */
export const openFile = async (fileUrl, fileName) => {
  try {
    console.log('Opening file:', fileUrl);
    
    // Đảm bảo fileName và phần mở rộng file hợp lệ
    let sanitizedFileName = fileName || `file-${Date.now()}`;
    
    // Đảm bảo file có phần mở rộng
    if (!sanitizedFileName.includes('.')) {
      // Thêm phần mở rộng dựa vào URL
      const extension = getExtensionFromTypeOrUrl(fileUrl);
      sanitizedFileName = `${sanitizedFileName}.${extension}`;
    }
    
    const fileUri = FileSystem.documentDirectory + sanitizedFileName;
    
    // Kiểm tra xem file đã tải về chưa
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    
    let finalUri;
    if (!fileInfo.exists) {
      // Hiển thị thông báo đang tải
      Alert.alert('Đang chuẩn bị mở file...', 'Vui lòng đợi trong giây lát');
      
      const downloadResumable = FileSystem.createDownloadResumable(
        fileUrl,
        fileUri
      );
      
      const result = await downloadResumable.downloadAsync();
      finalUri = result.uri;
    } else {
      finalUri = fileUri;
    }
    
    // Mở file với ứng dụng phù hợp
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(finalUri);
    } else {
      Alert.alert('Lỗi', 'Thiết bị không hỗ trợ mở file này');
    }
  } catch (error) {
    console.error('Lỗi khi mở file:', error);
    Alert.alert('Lỗi', 'Không thể mở file. Vui lòng thử lại sau.');
  }
};