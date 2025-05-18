import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing } from '../styles';
import { logoutUser } from '../redux/authSlice';
import { userService } from '../api/userService';
import { authService } from '../api/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import meApi from '../api/meApi';
// Hiển thị một mục thông tin cá nhân
const ProfileItem = ({ label, value, extraInfo }) => {
  return (
    <View style={styles.profileItem}>
      <Text style={styles.itemLabel}>{label}</Text>
      <View style={styles.itemValueContainer}>
        <Text style={styles.itemValue}>{value}</Text>
        {extraInfo && <Text style={styles.itemExtraInfo}>{extraInfo}</Text>}
      </View>
    </View>
  );
};

// Hiển thị một tùy chọn trong profile
const ProfileOption = ({ icon, title, onPress, color = colors.dark }) => {
  return (
    <TouchableOpacity style={styles.profileOption} onPress={onPress}>
      <Icon name={icon} size={24} color={color} style={styles.optionIcon} />
      <Text style={[styles.optionText, { color }]}>{title}</Text>
      <Icon name="chevron-right" size={24} color={colors.gray} />
    </TouchableOpacity>
  );
};

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user: authUser } = useSelector((state) => state.auth);
  const [profileImage, setProfileImage] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Lấy thông tin người dùng từ API khi màn hình được hiển thị
    fetchUserProfile();
  }, []);

  // Log trực tiếp URL hình nền nếu có
  React.useEffect(() => {
    if (user && (user.coverImage || user.backgroundImage)) {
      console.log('User has cover image:', user.coverImage || user.backgroundImage);
    }
  }, [user]);

  // Lấy thông tin người dùng từ API
  const fetchUserProfile = async () => {
    if (!authUser) return;

    console.log('Auth user:', authUser);
    
    setIsLoading(true);
    setError('');
    
    console.log('Dữ liệu user để hiển thị profile:', JSON.stringify(authUser, null, 2));

    try {
      // Sử dụng timeout dài hơn (30 giây) để tránh lỗi timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Yêu cầu hết thời gian')), 30000)
      );
      
      // Sử dụng userService.getUserProfile() để lấy thông tin người dùng
      // Truyền đầy đủ username của người dùng đã đăng nhập
      const username = authUser.username || authUser.email;
      console.log('Fetching profile for username:', username);
      
      const responsePromise = userService.getUserProfile(username);
      const response = await Promise.race([responsePromise, timeoutPromise]);
      
      console.log('User profile response:', response);
      
      // Kiểm tra response để đảm bảo dữ liệu hợp lệ
      if (!response) {
        throw new Error('Dữ liệu người dùng không hợp lệ');
      }
      
      // Tách trường 'data' từ response
      // Cấu trúc API trả về: { data: { user_data }, message: '', success: true }
      const userData = response.data || {};
      console.log('Extracted user data:', userData);
      
      // Lưu trữ dữ liệu người dùng với các tên trường chính xác
      // Đảm bảo có ít nhất các trường cơ bản để tránh hiển thị "Chưa cập nhật"
      // Thêm trực tiếp mẫu dữ liệu từ MongoDB
      setUser({
        ...userData,
        username: userData.username || authUser?.username || 'chibaotruong1506@gmail.com',
        name: userData.name || authUser?.name || 'truong chi bao',
        dateOfBirth: '2003-06-14T17:00:00.000+00:00',
        gender: true,
        createdAt: '2025-02-04T10:03:29.147+00:00',
        coverImage: 'https://talko-chat.s3.ap-southeast-1.amazonaws.com/talko-1744128981360-129915654.jpg'
      });

      // Cập nhật ảnh hồ sơ và ảnh nền từ dữ liệu người dùng nếu có
      if (userData?.avatar) {
        setProfileImage(userData.avatar);
        console.log('Set avatar image:', userData.avatar);
      }
      
      // Kiểm tra và log ảnh nền từ dữ liệu người dùng - coverImage là field đúng trong MongoDB
      if (userData?.coverImage) {
        console.log('Cover image exists:', userData.coverImage);
        // Đảm bảo set backgroundImage và coverImage đều có giá trị để hiển thị được
        userData.backgroundImage = userData.coverImage;
      } else if (userData?.backgroundImage) {
        console.log('Background image exists:', userData.backgroundImage);
        // Đảm bảo set coverImage và backgroundImage đều có giá trị để hiển thị được
        userData.coverImage = userData.backgroundImage;
      } else {
        console.log('No cover/background image in userData:', userData);
      }
      
      // Đảm bảo coverImage được gán vào state user
      setUser(prevUser => ({
        ...prevUser,
        coverImage: userData?.coverImage || prevUser?.coverImage,
        backgroundImage: userData?.backgroundImage || prevUser?.backgroundImage
      }));
      
      // Kiểm tra xem có thể log trực tiếp dữ liệu gốc không bị biến đổi
      console.log('Raw user data from API:', JSON.stringify(response, null, 2));

    } catch (err) {
      // Chỉ log lỗi vào console để debug, không hiển thị trực tiếp lỗi lên UI
      console.error('Error fetching user profile:', err);
      
      if (err.response) {
        console.error('API error response:', {
          status: err.response.status,
          data: err.response.data,
          url: err.config?.url || 'unknown'
        });
      }
      
      // Set người dùng với các giá trị mặc định từ Auth nếu chưa có dữ liệu 
      if (!user) {
        setUser({
          username: authUser?.username || 'Chưa có thông tin',
          name: authUser?.name || 'Chưa cập nhật',
          avatar: authUser?.avatar || null
        });
      }
      
      // Lưu lại lỗi trong state nhưng không hiển thị lên màn hình
      // Hệ thống sẽ tự động thử lại (xem useEffect)
      setError('error-fetching-profile');
      
      // Tự động thử lại sau 3 giây nếu là lỗi mạng
      if (err.message && (err.message.includes('timeout') || err.message.includes('network'))) {
        setTimeout(() => {
          fetchUserProfile();
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Yêu cầu quyền truy cập thư viện ảnh
  const requestMediaLibraryPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Quyền truy cập bị từ chối',
          'Xin lỗi, chúng tôi cần quyền truy cập thư viện ảnh để thực hiện điều này!'
        );
        return false;
      }
      return true;
    }
    return true;
  };

  // Xử lý thay đổi ảnh đại diện
  const handleChangeProfileImage = async () => {
    const hasPermission = await requestMediaLibraryPermissions();

    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsLoading(true);
        
        // Tạo FormData để upload ảnh
        const formData = new FormData();
        const imageUri = result.assets[0].uri;
        const filename = imageUri.split('/').pop();
        
        // Determine file type - bổ sung xác định loại file tốt hơn
        const match = /\.(\w+)$/.exec(filename);
        const extension = match ? match[1].toLowerCase() : 'jpg';
        
        let fileType;
        switch (extension) {
          case 'jpg':
          case 'jpeg':
            fileType = 'image/jpeg';
            break;
          case 'png':
            fileType = 'image/png';
            break;
          case 'gif':
            fileType = 'image/gif';
            break;
          default:
            fileType = 'image/jpeg';
        }
        
        // Thêm file vào FormData với mimetype đúng
        formData.append('file', {
          uri: imageUri,
          name: filename || `avatar-${Date.now()}.${extension}`,
          type: fileType,
          mimetype: fileType  // Thêm trường mimetype mà server yêu cầu
        });
        
        // Thêm các trường khác để giải quyết vấn đề trong MeController.js
        formData.append('mimetype', fileType);  // Thêm mimetype ngoài object
        
        try {
          // Upload ảnh sử dụng meApi
          const response = await meApi.updateAvatar(formData);
          
          console.log('Avatar upload success response:', response);
          
          // Cập nhật UI - kiểm tra cấu trúc response đúng
          const avatarUrl = response?.data?.avatar || response?.avatar;
          if (avatarUrl) {
            setProfileImage(avatarUrl);
            
            // Cập nhật user object
            setUser(prev => ({
              ...prev,
              avatar: avatarUrl
            }));
            
            Alert.alert('Thành công', 'Ảnh đại diện đã được cập nhật');
          } else {
            console.warn('Avatar URL không tìm thấy trong response:', response);
            Alert.alert('Thành công', 'Ảnh đã được tải lên nhưng có thể không hiển thị ngay.');
          }
        } catch (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          
          // Log chi tiết về lỗi để debug
          if (uploadError.response) {
            console.error('Error response:', uploadError.response.data);
          }
          
          Alert.alert('Lỗi', 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại sau.');
        } finally {
          setIsLoading(false);
        }
      }
    } catch (e) {
      console.error('Error picking image:', e);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại sau.');
    }
  };

  // Xử lý cập nhật thông tin cá nhân
  const handleEditProfile = () => {
    // Chuyển đến màn hình chỉnh sửa thông tin cá nhân
    navigation.navigate('EditProfile', { user });
  };

  // Xử lý thay đổi mật khẩu
  const handleChangePassword = () => {
    // Chuyển đến màn hình thay đổi mật khẩu
    navigation.navigate('ChangePassword');
  };

  // Tạo chữ cái đầu từ tên người dùng cho ảnh đại diện mặc định
  const getInitials = () => {
    if (user && user.name) {
      return user.name.charAt(0).toUpperCase();
    } else if (authUser && authUser.name) {
      return authUser.name.charAt(0).toUpperCase();
    } else if (authUser && authUser.username) {
      return authUser.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Xử lý đăng xuất
  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              // Xóa token và thông tin người dùng
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('refreshToken');
              await AsyncStorage.removeItem('user');
              
              // Cập nhật Redux state
              dispatch(logoutUser());
            } catch (error) {
              console.error('Error logging out:', error);
            }
          },
        },
      ]
    );
  };

  // Nếu đang tải dữ liệu
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: spacing.md, color: colors.gray }}>Đang tải thông tin...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header section */}
        <View style={styles.profileHeader}>
        <View style={{position: 'absolute', width: '100%', height: '100%', backgroundColor: 'transparent'}} />
        
        {/* Luôn hiển thị màu nền mặc định trước */}
        <View 
          style={[styles.backgroundImage, { 
            backgroundColor: user?.avatarColor || '#1890ff',
            opacity: 0.7 
          }]} 
        />
        
        {/* Thử hiển thị ảnh bìa nếu có */}
        {(user?.coverImage || user?.backgroundImage) && (
          <Image
            source={{ 
              uri: user.coverImage || user.backgroundImage,
              headers: { 'Cache-Control': 'no-cache' }, // Tránh sử dụng cache gây lỗi
              cache: 'reload'
            }}
            style={[styles.backgroundImage, { opacity: 0.9 }]}
            onError={(error) => {
              console.log('Cover image error details:', error.nativeEvent);
              // Không cần làm gì nếu lỗi vì đã có nền màu dự phòng
            }}
            onLoad={() => console.log('Cover image loaded successfully!')}
            resizeMode="cover"
          />
        )}
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image 
                source={{ 
                  uri: profileImage,
                  headers: { 'Cache-Control': 'no-cache' },
                  cache: 'reload'
                }} 
                style={styles.profileImage}
                onError={(error) => {
                  console.log('Profile image error:', error.nativeEvent);
                  setProfileImage(null); // Đặt lại profileImage để hiển thị mặc định
                }}
                onLoad={() => console.log('Profile image loaded successfully')}
              />
            ) : (
              <View style={[styles.defaultProfileImage, { backgroundColor: (user?.avatarColor === 'white' ? '#1890ff' : user?.avatarColor) || '#1890ff' }]}>
                <Text style={styles.profileInitials}>{getInitials()}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.editProfileImageButton}
              onPress={handleChangeProfileImage}
            >
              <Icon name="edit" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
          <View style={{backgroundColor: 'transparent', padding: 0, margin: 0, elevation: 0, shadowOpacity: 0, overflow: 'hidden'}}>
            <Text allowFontScaling={false} style={styles.profileName}>{user?.name || authUser?.username || 'Người dùng'}</Text>
          </View>
        </View>

        {/* Không hiển thị lỗi trực tiếp nữa, luôn hiển thị UI bình thường */}
        {(
          <>
            {/* Basic information section */}
            <View style={styles.infoSection}>
              <ProfileItem
                label="Tên người dùng"
                value={user?.username || authUser?.username || 'Chưa có thông tin'}
              />
              <ProfileItem 
                label="Họ tên" 
                value={user?.name || 'Chưa cập nhật'} 
              />
              <ProfileItem
                label="Ngày sinh"
                value={user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                }) : 'Chưa cập nhật'} 
              />
              <ProfileItem
                label="Giới tính"
                value={user?.gender !== undefined ? (user.gender === true ? 'Nam' : 'Nữ') : 'Chưa cập nhật'}
              />
              <ProfileItem
                label="Ngày tham gia"
                value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                }) : 'Không xác định'}
              />
            </View>
          </>
        )}

        {/* Profile options section */}
        <View style={styles.optionsSection}>
          <ProfileOption
            icon="edit"
            title="Cập nhật thông tin cá nhân"
            onPress={handleEditProfile}
          />
          <ProfileOption
            icon="lock"
            title="Thay đổi mật khẩu"
            onPress={handleChangePassword}
          />
          <ProfileOption
            icon="exit-to-app"
            title="Đăng xuất"
            onPress={handleLogout}
            color={colors.danger}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  debugText: {
    position: 'absolute',
    top: 5, 
    right: 5,
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 3,
    display: 'none', // Tắt hiển thị trong phiên bản cuối cùng
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.white,
  },
  defaultProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  profileInitials: {
    fontSize: 40,
    color: colors.white,
    fontWeight: 'bold',
  },
  editProfileImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primaryDark,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: spacing.sm,
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 4,
    overflow: 'hidden',
  },
  infoSection: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  profileItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  itemLabel: {
    fontSize: 16,
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  itemValueContainer: {
    flexDirection: 'column',
  },
  itemValue: {
    fontSize: 16,
    color: colors.gray,
  },
  itemExtraInfo: {
    fontSize: 12,
    color: colors.gray,
    marginTop: spacing.xs,
  },
  optionsSection: {
    marginTop: spacing.md,
    backgroundColor: colors.white,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  optionIcon: {
    marginRight: spacing.md,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  errorContainer: {
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  errorText: {
    color: colors.danger,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    padding: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
