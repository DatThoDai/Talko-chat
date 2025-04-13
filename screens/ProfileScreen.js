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
import meApi from '../api/meApi';
import authApi from '../api/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Lấy thông tin người dùng từ API
  const fetchUserProfile = async () => {
    if (!authUser) return;

    console.log('Auth user:', authUser);
    
    setIsLoading(true);
    setError('');

    try {
      // Sử dụng timeout để tránh chờ vô hạn
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Yêu cầu hết thời gian')), 10000)
      );
      
      // Gọi API lấy thông tin người dùng với timeout
      const responsePromise = meApi.fetchProfile();
      const response = await Promise.race([responsePromise, timeoutPromise]);
      
      console.log('User profile response:', response);
      
      // Kiểm tra response để đảm bảo dữ liệu hợp lệ
      if (!response) {
        throw new Error('Dữ liệu người dùng không hợp lệ');
      }
      
      setUser(response);

      // Cập nhật ảnh hồ sơ từ dữ liệu người dùng nếu có
      if (response && response.avatar) {
        setProfileImage(response.avatar);
      }

    } catch (err) {
      console.error('Error fetching user profile:', err);
      
      // Xử lý các loại lỗi khác nhau
      if (err.message === 'Yêu cầu hết thời gian') {
        setError('Yêu cầu hết thời gian. Vui lòng kiểm tra kết nối mạng và thử lại.');
      } else if (err.response && err.response.status === 401) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        // Có thể trigger refresh token ở đây
      } else if (err.response && err.response.status === 404) {
        setError('Không tìm thấy thông tin người dùng.');
      } else {
        setError(err.message || 'Không thể tải thông tin người dùng. Vui lòng thử lại sau.');
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
        
        // Determine file type
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';
        
        formData.append('file', {
          uri: imageUri,
          name: filename,
          type
        });
        
        try {
          // Upload ảnh sử dụng meApi
          const response = await meApi.updateAvatar(formData);
          
          // Cập nhật UI
          setProfileImage(response.avatar || imageUri);
          
          // Cập nhật user object
          setUser(prev => ({
            ...prev,
            avatar: response.avatar || imageUri
          }));
          
          Alert.alert('Thành công', 'Ảnh đại diện đã được cập nhật');
        } catch (uploadError) {
          console.error('Error uploading avatar:', uploadError);
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
        <Text style={{ marginTop: spacing.md }}>Đang tải thông tin...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header section */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.defaultProfileImage, user?.avatarColor ? { backgroundColor: user.avatarColor } : null]}>
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
          <Text style={styles.profileName}>{user?.name || authUser?.username || 'Người dùng'}</Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
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
                value={user?.gender !== undefined ? (user.gender ? 'Nam' : 'Nữ') : 'Chưa cập nhật'}
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
    backgroundColor: colors.primary,
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
    color: colors.white,
    marginTop: spacing.sm,
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
