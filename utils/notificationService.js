import { Platform, Vibration } from 'react-native';
import { Audio } from 'expo-av';

// ⚠️ Không sử dụng expo-notifications, sử dụng giải pháp thay thế

// Tạo biến lưu sound
let notificationSound = null;

// Cấu hình và tải âm thanh
const setupSound = async () => {
  try {
    // Đăng ký audio mode
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
    
    // Tải âm thanh thông báo
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/notification.mp3'),
      { shouldPlay: false, volume: 1.0 }
    );
    
    notificationSound = sound;
    console.log('Notification sound loaded successfully');
    return true;
  } catch (error) {
    console.log('Failed to load notification sound:', error);
    return false;
  }
};

// Phát âm thanh khi có tin nhắn mới
const playNotificationSound = async () => {
  try {
    if (!notificationSound) {
      await setupSound();
    }
    
    // Đảm bảo âm thanh được phát từ đầu
    await notificationSound.stopAsync();
    await notificationSound.setPositionAsync(0);
    await notificationSound.playAsync();
    return true;
  } catch (error) {
    console.log('Error playing notification sound:', error);
    return false;
  }
};

// Giải phóng tài nguyên
const unloadSound = async () => {
  if (notificationSound) {
    try {
      await notificationSound.unloadAsync();
      notificationSound = null;
    } catch (error) {
      console.log('Error unloading sound:', error);
    }
  }
};

// Rung thiết bị khi có tin nhắn mới
const vibrate = () => {
  try {
    if (Platform.OS === 'android') {
      Vibration.vibrate(300);
    } else {
      Vibration.vibrate([0, 300]);
    }
    return true;
  } catch (error) {
    console.log('Error vibrating device:', error);
    return false;
  }
};

export default {
  setupSound,
  playNotificationSound,
  unloadSound,
  vibrate
};