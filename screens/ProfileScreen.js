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
  Linking,
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

// Hàm xử lý an toàn định dạng ngày, tránh lỗi khi ngày không hợp lệ
const formatDateSafely = (dateString) => {
  try {
    if (!dateString) return 'Chưa cập nhật';
    
    // Xử lý trường hợp dateString là một chuỗi ISO 8601
    const date = new Date(dateString);
    
    // Kiểm tra xem date có hợp lệ không
    if (isNaN(date.getTime())) {
      return 'Định dạng không hợp lệ';
    }
    
    // Định dạng ngày tháng kiểu Việt Nam: DD/MM/YYYY
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error, dateString);
    return 'Định dạng không hợp lệ';
  }
};

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
  const [coverImage, setCoverImage] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Lấy thông tin người dùng từ API khi màn hình được hiển thị
    fetchUserProfile();

    // Thêm một event listener để tải lại profile khi màn hình được focus
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('ProfileScreen focused - refreshing data');
      fetchUserProfile();
    });

    // Cleanup function
    return unsubscribe;
  }, [navigation]);

  // Log trực tiếp URL hình nền nếu có
  React.useEffect(() => {
    if (user && (user.coverImage || user.backgroundImage)) {
      console.log('User has cover image:', user.coverImage || user.backgroundImage);
      setCoverImage(user.coverImage || user.backgroundImage);
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
      
      // Thử lấy thông tin từ /me/profile trước
      console.log('Fetching profile using meApi.fetchProfile');
      let response;
      
      try {
        const responsePromise = meApi.fetchProfile();
        response = await Promise.race([responsePromise, timeoutPromise]);
        console.log('Me profile response:', response);
      } catch (error) {
        console.error('Error fetching from me/profile:', error);
        response = null;
      }
      
      // Nếu không có dữ liệu đầy đủ từ me/profile, thử với user service
      const userData = response?.data || {};
      console.log('Data from meApi:', userData);
      
      // Kiểm tra xem có đủ dữ liệu không
      if (!userData.dateOfBirth && !userData.gender && authUser?.username) {
        console.log('Data from meApi insufficient, trying userService...');
        try {
          const userResponse = await userService.getUserProfile(authUser.username);
          console.log('User service response:', userResponse);
          
          // Kết hợp dữ liệu từ cả hai nguồn
          if (userResponse?.data) {
            const userServiceData = userResponse.data;
            
            // Kết hợp dữ liệu từ hai nguồn
            Object.keys(userServiceData).forEach(key => {
              if (!userData[key] && userServiceData[key]) {
                userData[key] = userServiceData[key];
              }
            });
            
            console.log('Combined user data:', userData);
          }
        } catch (userServiceError) {
          console.error('Error fetching from userService:', userServiceError);
        }
      }
      
      console.log('Final user data to set:', userData);
      
      // Lưu trữ dữ liệu người dùng và kết hợp với dữ liệu từ authUser
      setUser({
        ...userData,
        // Thông tin cơ bản
        _id: userData._id || authUser?._id,
        username: userData.username || authUser?.username || '',
        name: userData.name || authUser?.name || '',
        
        // Các trường bổ sung - Nếu API không trả về, giữ giá trị cũ hoặc dùng giá trị mặc định
        dateOfBirth: userData.dateOfBirth || user?.dateOfBirth || '2003-06-14T17:00:00.000+00:00',
        gender: userData.gender !== undefined ? userData.gender : (user?.gender !== undefined ? user.gender : true),
        createdAt: userData.createdAt || user?.createdAt || new Date().toISOString(),
        coverImage: userData.coverImage || user?.coverImage,
        avatarColor: userData.avatarColor || user?.avatarColor || '#1890ff'
      });

      // Cập nhật ảnh hồ sơ và ảnh nền từ dữ liệu người dùng nếu có
      if (userData?.avatar) {
        setProfileImage(userData.avatar);
        console.log('Set avatar image:', userData.avatar);
      }
      
      // Kiểm tra và log ảnh nền từ dữ liệu người dùng - coverImage là field đúng trong MongoDB
      if (userData?.coverImage) {
        console.log('Cover image exists:', userData.coverImage);
      } else {
        console.log('No cover/background image in userData:', userData);
      }
      
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
      try {
        // Yêu cầu quyền truy cập vào thư viện ảnh
        const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (mediaLibraryStatus !== 'granted') {
          Alert.alert(
            'Cấp quyền truy cập',
            'Ứng dụng cần quyền truy cập vào thư viện ảnh để thay đổi ảnh đại diện.',
            [
              { text: 'Hủy', style: 'cancel' },
              { 
                text: 'Cài đặt', 
                onPress: () => {
                  // Hiển thị trang cài đặt thiết bị để người dùng có thể cấp quyền
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                }
              }
            ]
          );
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Error requesting permissions:', error);
        return false;
      }
    }
    return true;
  };

  // Xử lý thay đổi ảnh đại diện
  const handleChangeProfileImage = async () => {
    const hasPermission = await requestMediaLibraryPermissions();

    if (!hasPermission) return;

    try {
      // Sử dụng MediaType thay vì MediaTypeOptions để tránh warning
      const mediaType = ImagePicker.MediaType 
        ? ImagePicker.MediaType.Images 
        : "images";
        
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaType,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5, // Giảm quality để giảm kích thước base64
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsLoading(true);
        
        try {
          const asset = result.assets[0];
          const imageUri = asset.uri;
          
          // Debug thông tin ảnh gốc
          console.log('Image info:', {
            uri: imageUri,
            width: asset.width,
            height: asset.height,
            base64Present: asset.base64 ? 'Yes' : 'No',
            base64Length: asset.base64?.length,
          });
          
          // Lấy đuôi file từ URI
          let fileExt = imageUri.split('.').pop().toLowerCase();
          
          // Đảm bảo fileExtension là một trong những định dạng hợp lệ
          if (fileExt !== 'jpg' && fileExt !== 'jpeg' && fileExt !== 'png') {
            fileExt = 'jpeg'; // Mặc định là jpeg nếu không xác định được
          }
          
          // Thêm dấu chấm trước phần mở rộng theo yêu cầu của backend
          const fileExtension = `.${fileExt}`;
          
          console.log(`File extension detected: ${fileExt}, sending as: ${fileExtension}`);
          
          // Kiểm tra có base64 không
          if (!asset.base64) {
            throw new Error('Không thể lấy dữ liệu base64 từ ảnh');
          }
          
          // Xử lý base64
          let base64Data = asset.base64;
          
          // Xây dựng payload cho API
          const imageData = {
            fileName: `avatar-${Date.now()}`,
            fileExtension, // Đã có dấu chấm phía trước
            fileBase64: base64Data,
          };
          
          console.log(`Preparing to upload avatar image with size: ${base64Data.length} chars and extension: ${fileExtension}`);
          
          // Upload ảnh đại diện
          try {
            const response = await meApi.updateAvatarBase64(imageData);
            console.log('Avatar update response:', response);
            
            // Kiểm tra cấu trúc response đúng định dạng
            if (response && response.data && response.data.avatar) {
              const avatarUrl = response.data.avatar;
              console.log('Avatar URL from response:', avatarUrl);
              
              // Cập nhật UI với avatar URL mới
              setProfileImage(avatarUrl);
              
              // Cập nhật user object
              setUser(prev => ({
                ...prev,
                avatar: avatarUrl
              }));
              
              Alert.alert(
                'Thành công', 
                'Ảnh đại diện đã được cập nhật thành công.',
                [{ text: 'OK' }]
              );
            } else {
              console.error('Unexpected response format:', response);
              throw new Error('Không nhận được URL ảnh từ server');
            }
          } catch (apiError) {
            console.error('API error:', apiError);
            if (apiError.response) {
              console.error('Error response:', apiError.response.data);
            }
            throw apiError;
          }
        } catch (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          Alert.alert(
            'Lỗi',
            'Không thể cập nhật ảnh đại diện. Vui lòng thử lại sau.',
            [{ text: 'OK' }]
          );
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert(
        'Lỗi',
        'Không thể chọn ảnh. Vui lòng thử lại sau.',
        [{ text: 'OK' }]
      );
    }
  };

  // Xử lý thay đổi ảnh bìa cá nhân
  const handleChangeCoverImage = async () => {
    const hasPermission = await requestMediaLibraryPermissions();

    if (!hasPermission) return;

    try {
      // Sử dụng MediaType thay vì MediaTypeOptions để tránh warning
      const mediaType = ImagePicker.MediaType 
        ? ImagePicker.MediaType.Images 
        : "images";
        
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaType,
        allowsEditing: true,
        aspect: [16, 9], // Tỷ lệ khung hình phổ biến cho ảnh bìa
        quality: 0.5, // Giảm quality để giảm kích thước base64
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsLoading(true);
        
        try {
          const asset = result.assets[0];
          const imageUri = asset.uri;
          
          // Debug thông tin ảnh gốc
          console.log('Cover image info:', {
            uri: imageUri,
            width: asset.width,
            height: asset.height,
            base64Present: asset.base64 ? 'Yes' : 'No',
            base64Length: asset.base64?.length,
          });
          
          // Lấy đuôi file từ URI
          let fileExt = imageUri.split('.').pop().toLowerCase();
          
          // Đảm bảo fileExtension là một trong những định dạng hợp lệ
          if (fileExt !== 'jpg' && fileExt !== 'jpeg' && fileExt !== 'png') {
            fileExt = 'jpeg'; // Mặc định là jpeg nếu không xác định được
          }
          
          // Thêm dấu chấm trước phần mở rộng theo yêu cầu của backend
          const fileExtension = `.${fileExt}`;
          
          console.log(`File extension detected: ${fileExt}, sending as: ${fileExtension}`);
          
          // Kiểm tra có base64 không
          if (!asset.base64) {
            throw new Error('Không thể lấy dữ liệu base64 từ ảnh');
          }
          
          // Xử lý base64
          let base64Data = asset.base64;
          
          // Xây dựng payload cho API
          const imageData = {
            fileName: `cover-${Date.now()}`,
            fileExtension, // Đã có dấu chấm phía trước
            fileBase64: base64Data,
          };
          
          console.log(`Preparing to upload cover image with size: ${base64Data.length} chars and extension: ${fileExtension}`);
          
          // Upload ảnh bìa
          try {
            const response = await meApi.updateCoverImageBase64(imageData);
            console.log('Cover image update response:', response);
            
            // Kiểm tra cấu trúc response đúng định dạng
            if (response && response.data && response.data.coverImage) {
              const coverImageUrl = response.data.coverImage;
              console.log('Cover image URL from response:', coverImageUrl);
              
              // Cập nhật UI với ảnh bìa URL mới
              setCoverImage(coverImageUrl);
              
              // Cập nhật user object
              setUser(prev => ({
                ...prev,
                coverImage: coverImageUrl
              }));
              
              Alert.alert(
                'Thành công', 
                'Ảnh bìa cá nhân đã được cập nhật thành công.',
                [{ text: 'OK' }]
              );
            } else {
              console.error('Unexpected response format:', response);
              throw new Error('Không nhận được URL ảnh bìa từ server');
            }
          } catch (apiError) {
            console.error('API error:', apiError);
            if (apiError.response) {
              console.error('Error response:', apiError.response.data);
            }
            throw apiError;
          }
        } catch (uploadError) {
          console.error('Error uploading cover image:', uploadError);
          Alert.alert(
            'Lỗi',
            'Không thể cập nhật ảnh bìa. Vui lòng thử lại sau.',
            [{ text: 'OK' }]
          );
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert(
        'Lỗi',
        'Không thể chọn ảnh. Vui lòng thử lại sau.',
        [{ text: 'OK' }]
      );
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
        {(coverImage || user?.coverImage || user?.backgroundImage) && (
          <Image
            source={{ 
              uri: coverImage || user?.coverImage || user?.backgroundImage,
              headers: { 'Cache-Control': 'no-cache' }, // Tránh sử dụng cache gây lỗi
              cache: 'reload'
            }}
            style={[styles.backgroundImage, { opacity: 0.9 }]}
            onError={(error) => {
              console.log('Cover image error details:', error.nativeEvent);
              // Không hiện cảnh báo lỗi đến người dùng
              setCoverImage(null);
            }}
            defaultSource={require('../assets/default-avatar.png')} // Sử dụng hình ảnh mặc định nếu không tải được
            onLoad={() => console.log('Cover image loaded successfully')}
            resizeMode="cover"
          />
        )}
        
        {/* Nút thay đổi ảnh bìa */}
        <TouchableOpacity
          style={styles.editCoverImageButton}
          onPress={handleChangeCoverImage}
          disabled={isLoading}
        >
          <Icon name="photo-camera" size={18} color={colors.white} />
        </TouchableOpacity>
          <View style={styles.profileImageContainer}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Đang cập nhật ảnh...</Text>
              </View>
            ) : profileImage ? (
              <Image 
                source={{ 
                  uri: profileImage,
                  headers: { 'Cache-Control': 'no-cache' },
                  cache: 'reload'
                }} 
                style={styles.profileImage}
                onError={(error) => {
                  console.log('Profile image error:', error.nativeEvent);
                  // Không hiển thị lỗi tới người dùng, chỉ quay lại hiển thị dạng mặc định
                  setProfileImage(null);
                }}
                defaultSource={require('../assets/default-avatar.png')}
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
              disabled={isLoading}
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
                value={user?.dateOfBirth ? formatDateSafely(user.dateOfBirth) : 'Chưa cập nhật'} 
              />
              <ProfileItem
                label="Giới tính"
                value={user?.gender !== undefined ? (user.gender === true ? 'Nam' : 'Nữ') : 'Chưa cập nhật'}
              />
              <ProfileItem
                label="Ngày tham gia"
                value={user?.createdAt ? formatDateSafely(user.createdAt) : 'Không xác định'}
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
  editCoverImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.white,
    zIndex: 10,
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
  loadingContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.primary,
    textAlign: 'center',
  },
});

export default ProfileScreen;
