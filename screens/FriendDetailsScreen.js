import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomAvatar from '../components/CustomAvatar';
import { colors, spacing, typography, borderRadius } from '../styles';

// Mock friend details for demonstration
const mockFriendData = {
  id: '1',
  name: 'Nguyễn Tuấn Anh',
  email: 'tuananh@example.com',
  phone: '0912345678',
  avatar: null,
  status: 'online',
  statusMessage: 'Đang bận',
  mutualFriends: 12,
  dateAdded: '15/05/2023',
};

const OptionItem = ({ icon, title, onPress, color = colors.dark }) => {
  return (
    <TouchableOpacity style={styles.optionItem} onPress={onPress}>
      <Icon name={icon} size={24} color={color} style={styles.optionIcon} />
      <Text style={[styles.optionText, { color }]}>{title}</Text>
      <Icon name="chevron-right" size={24} color={colors.gray} />
    </TouchableOpacity>
  );
};

const FriendDetailsScreen = ({ route, navigation }) => {
  const { friendId, name } = route.params || {};
  const [friend, setFriend] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to get friend details
    const fetchFriendDetails = async () => {
      // In a real app, replace with actual API call using friendId
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFriend(mockFriendData);
      setIsLoading(false);
    };

    fetchFriendDetails();
  }, [friendId]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleStartChat = () => {
    if (friend) {
      navigation.navigate('Message', { 
        conversationId: friend.id,
        name: friend.name,
        avatar: friend.avatar
      });
    }
  };

  const handleBlockFriend = () => {
    Alert.alert(
      'Chặn liên hệ',
      `Bạn có chắc chắn muốn chặn ${friend?.name || 'người này'}?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Chặn',
          style: 'destructive',
          onPress: () => {
            // Handle blocking logic here
            // In a real app, make API call to block user
            Alert.alert('Đã chặn', `Bạn đã chặn ${friend?.name || 'người này'}`);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleRemoveFriend = () => {
    Alert.alert(
      'Xóa bạn',
      `Bạn có chắc chắn muốn xóa ${friend?.name || 'người này'} khỏi danh sách bạn bè?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            // Handle remove friend logic here
            // In a real app, make API call to remove friend
            Alert.alert('Đã xóa', `Bạn đã xóa ${friend?.name || 'người này'} khỏi danh sách bạn bè`);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.white} barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin bạn bè</Text>
        <View style={styles.emptySpace} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text>Đang tải...</Text>
        </View>
      ) : friend ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileSection}>
            <CustomAvatar
              size={100}
              name={friend.name}
              source={friend.avatar}
              online={friend.status === 'online'}
            />
            <Text style={styles.profileName}>{friend.name}</Text>
            <Text style={styles.profileStatus}>
              {friend.status === 'online' ? 'Đang hoạt động' : 'Không hoạt động'}
              {friend.statusMessage ? ` - ${friend.statusMessage}` : ''}
            </Text>
            
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleStartChat}
              >
                <Icon name="chat" size={24} color={colors.white} />
                <Text style={styles.actionButtonText}>Nhắn tin</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
            
            <View style={styles.infoItem}>
              <Icon name="email" size={20} color={colors.gray} style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{friend.email}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Icon name="phone" size={20} color={colors.gray} style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Số điện thoại</Text>
                <Text style={styles.infoValue}>{friend.phone}</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Icon name="people" size={20} color={colors.gray} style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Bạn chung</Text>
                <Text style={styles.infoValue}>{friend.mutualFriends} người</Text>
              </View>
            </View>
            
            <View style={styles.infoItem}>
              <Icon name="date-range" size={20} color={colors.gray} style={styles.infoIcon} />
              <View>
                <Text style={styles.infoLabel}>Đã kết bạn từ</Text>
                <Text style={styles.infoValue}>{friend.dateAdded}</Text>
              </View>
            </View>
          </View>

          <View style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>Tùy chọn</Text>
            
            <OptionItem
              icon="block"
              title="Chặn liên hệ"
              color={colors.danger}
              onPress={handleBlockFriend}
            />
            
            <OptionItem
              icon="person-remove"
              title="Xóa bạn"
              color={colors.danger}
              onPress={handleRemoveFriend}
            />
          </View>
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không thể tải thông tin người dùng</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    flex: 1,
    textAlign: 'center',
    color: colors.dark,
  },
  emptySpace: {
    width: 40, // Same width as back button for alignment
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  profileName: {
    ...typography.h1,
    color: colors.dark,
    marginTop: spacing.md,
  },
  profileStatus: {
    ...typography.body,
    color: colors.gray,
    marginTop: spacing.xs,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  actionButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.md,
    marginHorizontal: spacing.sm,
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
  infoSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  optionsSection: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.dark,
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoIcon: {
    marginRight: spacing.md,
    width: 24,
    alignItems: 'center',
  },
  infoLabel: {
    ...typography.caption,
    color: colors.gray,
  },
  infoValue: {
    ...typography.body,
    color: colors.dark,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  optionIcon: {
    marginRight: spacing.md,
  },
  optionText: {
    ...typography.body,
    flex: 1,
  },
});

export default FriendDetailsScreen;
