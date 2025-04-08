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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector, useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography } from '../styles';
import { logoutUser } from '../redux/authSlice';

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
  const { user } = useSelector((state) => state.auth);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    // Set profile image from user data if available
    if (user && user.avatar) {
      setProfileImage(user.avatar);
    }
  }, [user]);

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
        setProfileImage(result.assets[0].uri);
        // In a real app, upload image to server and update user data
        Alert.alert('Thành công', 'Ảnh đại diện đã được cập nhật');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thay đổi ảnh đại diện. Vui lòng thử lại sau.');
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleLogoutAll = () => {
    Alert.alert(
      'Đăng xuất khỏi các thiết bị khác',
      'Bạn có chắc chắn muốn đăng xuất khỏi tất cả các thiết bị khác?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          onPress: () => {
            // In a real app, make API call to logout from all devices
            Alert.alert('Thành công', 'Đã đăng xuất khỏi tất cả các thiết bị khác');
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: () => {
            dispatch(logoutUser());
          }
        }
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cá nhân</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.profileImageContainer}
            onPress={handleChangeProfileImage}
          >
            {profileImage ? (
              <Image 
                source={{ uri: profileImage }} 
                style={styles.profileImage} 
              />
            ) : (
              <View style={styles.defaultProfileImage}>
                <Text style={styles.profileInitials}>
                  {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
            <View style={styles.editProfileImageButton}>
              <Icon name="camera-alt" size={16} color={colors.white} />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.profileName}>
            {user.name || 'Hào Nguyễn'}
          </Text>
        </View>
        
        <View style={styles.infoSection}>
          <ProfileItem 
            label="Giới tính" 
            value={user.gender || 'Nam'} 
          />
          
          <ProfileItem 
            label="Ngày sinh" 
            value={user.birthdate || '20/11/2000'} 
          />
          
          <ProfileItem 
            label="Điện thoại" 
            value={user.phone || '0798662438'} 
            extraInfo="Số điện thoại của bạn chỉ hiển thị với bạn bè có lưu số của bạn trong danh bạ"
          />
        </View>
        
        <View style={styles.optionsSection}>
          <ProfileOption 
            icon="edit" 
            title="Đổi thông tin" 
            onPress={handleEditProfile} 
          />
          
          <ProfileOption 
            icon="lock" 
            title="Đổi mật khẩu" 
            onPress={handleChangePassword} 
          />
          
          <ProfileOption 
            icon="logout" 
            title="Đăng xuất ra khỏi các thiết bị khác" 
            onPress={handleLogoutAll} 
          />
          
          <ProfileOption 
            icon="exit-to-app" 
            title="Đăng xuất" 
            onPress={handleLogout} 
            color={colors.danger}
          />
        </View>
      </ScrollView>
      
      <View style={styles.bottomTabs}>
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Icon name="chat" size={24} color={colors.gray} />
          <Text style={styles.tabText}>Tin nhắn</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => navigation.navigate('Contact')}
        >
          <Icon name="people" size={24} color={colors.gray} />
          <Text style={styles.tabText}>Danh bạ</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.tabButton, styles.activeTab]}>
          <Icon name="person" size={24} color={colors.primary} />
          <Text style={styles.activeTabText}>Cá nhân</Text>
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
  bottomTabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.light,
    backgroundColor: colors.white,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: colors.gray,
    marginTop: spacing.xs,
  },
  activeTabText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
});

export default ProfileScreen;
