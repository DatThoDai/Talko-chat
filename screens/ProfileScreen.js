import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography } from '../styles';
import { logoutUser } from '../redux/authSlice';
import { userService } from '../api/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    if (!authUser || !authUser.username) return;

    console.log('Auth user:', authUser);
    // Username từ đối tượng auth user có thể không đúng với database
    // Thử dùng email đầy đủ nếu có, nếu không thì dùng username
    const username = authUser.email || authUser.username;
    console.log('Using username for API call:', username);

    setIsLoading(true);
    setError('');

    try {
      const response = await userService.getUserProfile(username);
      console.log('User profile response:', response);
      setUser(response);

      // Cập nhật ảnh hồ sơ từ dữ liệu người dùng nếu có
      if (response && response.avatar) {
        setProfileImage(response.avatar);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setIsLoading(false);
      setError('Không thể tải thông tin người dùng. Vui lòng kiểm tra username trong cấu hình.');
    }
  };

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

  const handleChangeProfileImage = async () => {
    const hasPermission = await requestMediaLibraryPermissions();

    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);

        // Tạm thởi chỉ cập nhật UI, cần triển khai API upload avatar sau
        Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thay đổi ảnh đại diện. Vui lòng thử lại sau.');
    }
  };

  const handleEditProfile = () => {
    // Chuyển đến màn hình EditProfile
    Alert.alert('Thông báo', 'Chức năng đang được phát triển');
    // navigation.navigate('EditProfile');
  };

  const handleChangePassword = () => {
    // Chuyển đến màn hình ChangePassword
    navigation.navigate('ChangePassword');
  };

  // Tạo chữ cái đầu từ tên người dùng cho ảnh đại diện mặc định
  const getInitials = () => {
    if (user && user.name) {
      return user.name.charAt(0).toUpperCase();
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
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          onPress: async () => {
            try {
              // Xóa token từ AsyncStorage
              await AsyncStorage.removeItem('token');
              await AsyncStorage.removeItem('refreshToken');
              
              // Đăng xuất thông qua Redux - điều này sẽ tự động kích hoạt chuyển sang AuthStack
              // vì AppNavigator sẽ hiển thị AuthStackNavigator khi isAuthenticated = false
              dispatch(logoutUser());
              
              // KHÔNG cần gọi navigation.reset vì AppNavigator sẽ tự động xử lý điều hướng
              // dựa trên giá trị isAuthenticated trong Redux state
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
        <Text style={{ marginTop: 20, color: colors.gray }}>Đang tải thông tin...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông tin cá nhân</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile header with image and name */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.defaultProfileImage}>
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
              <ProfileItem label="Họ tên" value={user?.name || 'Chưa cập nhật'} />
              <ProfileItem
                label="Trạng thái"
                value={user?.isActived ? 'Đã kích hoạt' : 'Chưa kích hoạt'}
                extraInfo={user?.isActived ? 'Tài khoản đang hoạt động bình thường' : 'Cần xác thực để kích hoạt tài khoản'}
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

      {/* Footer navigation */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerItem} onPress={() => navigation.navigate('Home')}>
          <Icon name="chat" size={24} color={colors.gray} />
          <Text style={styles.footerText}>Tin nhắn</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.footerItem} onPress={() => navigation.navigate('Contact')}>
          <Icon name="groups" size={24} color={colors.gray} />
          <Text style={styles.footerText}>Danh bạ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.footerItem, styles.footerItemActive]}>
          <Icon name="person" size={24} color={colors.primary} />
          <Text style={styles.footerTextActive}>Cá nhân</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
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
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.light,
    backgroundColor: colors.white,
  },
  footerItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  footerItemActive: {
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  footerText: {
    fontSize: 12,
    color: colors.gray,
    marginTop: spacing.xs,
  },
  footerTextActive: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: spacing.xs,
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
