import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomAvatar from '../components/CustomAvatar';
import { colors, spacing, typography, borderRadius } from '../styles';
import { userService, friendService, conversationService } from '../api';
import { formatDate } from '../utils/dateUtils';

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
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFriendDetails();
  }, [friendId]);

  const fetchFriendDetails = async () => {
    if (!friendId) {
      setError('Không thể tải thông tin người dùng: Thiếu ID');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Add timeout for API call
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Yêu cầu hết thời gian')), 10000)
      );
      
      // Fetch friend details
      const fetchPromise = userService.fetchUser(friendId);
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (response) {
        setFriend(response);
      } else {
        setError('Không tìm thấy thông tin người dùng');
      }
    } catch (err) {
      console.error('Error fetching friend details:', err);
      
      if (err.message === 'Yêu cầu hết thời gian') {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.');
      } else if (err.response && err.response.status === 404) {
        setError('Không tìm thấy thông tin người dùng');
      } else {
        setError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async () => {
    try {
      // Create or get a conversation with this friend
      const response = await conversationService.createConversationIndividual(friendId);
      
      if (response && response._id) {
        // Navigate to the message screen
        navigation.navigate('MessageScreen', {
          conversationId: response._id,
          conversationName: friend?.name || 'Người dùng',
          avatar: friend?.avatar,
          avatarColor: friend?.avatarColor,
          isGroupChat: false,
          participants: [friend]
        });
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Lỗi', 'Không thể bắt đầu cuộc trò chuyện. Vui lòng thử lại sau.');
    }
  };

  const handleUnfriend = () => {
    Alert.alert(
      'Xác nhận',
      `Bạn có chắc chắn muốn xóa ${friend?.name || 'người dùng này'} khỏi danh sách bạn bè?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendService.deleteFriend(friendId);
              Alert.alert('Thành công', 'Đã xóa khỏi danh sách bạn bè');
              navigation.goBack();
            } catch (error) {
              console.error('Error unfriending:', error);
              Alert.alert('Lỗi', 'Không thể xóa bạn bè. Vui lòng thử lại sau.');
            }
          },
        },
      ]
    );
  };

  const handleBlock = () => {
    Alert.alert(
      'Xác nhận',
      `Bạn có chắc chắn muốn chặn ${friend?.name || 'người dùng này'}?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Chặn',
          style: 'destructive',
          onPress: () => {
            // In real app, call API to block user
            Alert.alert('Tính năng đang phát triển', 'Chức năng này sẽ sớm được hỗ trợ.');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="error-outline" size={60} color={colors.danger} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchFriendDetails}
        >
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!friend) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Icon name="person-off" size={60} color={colors.gray} />
        <Text style={styles.errorText}>Không tìm thấy thông tin người dùng</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.white} barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin bạn bè</Text>
        <View style={styles.emptySpace} />
      </View>

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
              <Text style={styles.infoValue}>{formatDate(friend.dateAdded)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Tùy chọn</Text>
          
          <OptionItem
            icon="person-remove"
            title="Xóa bạn"
            color={colors.danger}
            onPress={handleUnfriend}
          />
          
          <OptionItem
            icon="block"
            title="Chặn liên hệ"
            color={colors.danger}
            onPress={handleBlock}
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
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.md,
    marginTop: spacing.md,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.md,
    marginTop: spacing.md,
  },
  backButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default FriendDetailsScreen;
