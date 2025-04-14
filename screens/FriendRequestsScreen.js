import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomAvatar from '../components/CustomAvatar';
import { colors, spacing, borderRadius } from '../styles';
import friendApi from '../api/friendApi';

const RequestItem = ({ request, onAccept, onDecline }) => {
  return (
    <View style={styles.requestItem}>
      <CustomAvatar 
        size={50} 
        name={request.name}
        color={request.avatarColor}
        imageUrl={request.avatar}
      />
      
      <View style={styles.requestInfo}>
        <Text style={styles.requestName} numberOfLines={1}>
          {request.name || 'Người dùng'}
        </Text>
        <Text style={styles.requestTime} numberOfLines={1}>
          {request.username || ''}
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => onAccept(request._id || request.sender._id)}
        >
          <Text style={styles.actionButtonText}>Đồng ý</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => onDecline(request._id || request.sender._id)}
        >
          <Text style={styles.declineButtonText}>Từ chối</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SentRequestItem = ({ request, onCancel }) => {
  return (
    <View style={styles.requestItem}>
      <CustomAvatar 
        size={50} 
        name={request.name}
        color={request.avatarColor}
        imageUrl={request.avatar}
      />
      
      <View style={styles.requestInfo}>
        <Text style={styles.requestName} numberOfLines={1}>
          {request.name || 'Người dùng'}
        </Text>
        <Text style={styles.requestTime} numberOfLines={1}>
          {request.username || ''}
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => onCancel(request)}
        >
          <Text style={styles.cancelButtonText}>Hủy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const FriendRequestsScreen = ({ navigation }) => {
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'
  
  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Load received requests
      const receivedResponse = await friendApi.fetchFriendRequests();
      setReceivedRequests(receivedResponse.data || []);
      
      // Load sent requests
      const sentResponse = await friendApi.fetchMyFriendRequests();
      setSentRequests(sentResponse.data || []);
    } catch (error) {
      console.error('Error loading friend requests:', error);
      Alert.alert('Lỗi', 'Không thể tải lời mời kết bạn. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load friend requests when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );
  
  const handleAccept = useCallback(async (userId) => {
    try {
      await friendApi.acceptFriend(userId);
      await loadRequests();
      Alert.alert('Thành công', 'Đã chấp nhận lời mời kết bạn');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Lỗi', 'Không thể chấp nhận lời mời kết bạn. Vui lòng thử lại sau.');
    }
  }, [loadRequests]);
  
  const handleDecline = useCallback(async (userIdOrRequest) => {
    try {
      const userId = typeof userIdOrRequest === 'object' 
        ? (userIdOrRequest._id || userIdOrRequest.sender._id)
        : userIdOrRequest;
      
      if (!userId) {
        throw new Error('Invalid user ID');
      }
      
      await friendApi.deleteFriendRequest(userId);
      await loadRequests();
      Alert.alert('Thành công', 'Đã từ chối lời mời kết bạn');
    } catch (error) {
      console.error('Error declining friend request:', error);
      Alert.alert('Lỗi', 'Không thể từ chối lời mời kết bạn. Vui lòng thử lại sau.');
    }
  }, [loadRequests]);
  
  const handleCancel = useCallback(async (userIdOrRequest) => {
    try {
      const userId = typeof userIdOrRequest === 'object' 
        ? (userIdOrRequest._id || userIdOrRequest.receiver._id)
        : userIdOrRequest;
      
      if (!userId) {
        throw new Error('Invalid user ID');
      }
      
      await friendApi.deleteMyFriendRequest(userId);
      await loadRequests();
      Alert.alert('Thành công', 'Đã hủy lời mời kết bạn');
    } catch (error) {
      console.error('Error canceling friend request:', error);
      Alert.alert('Lỗi', 'Không thể hủy lời mời kết bạn. Vui lòng thử lại sau.');
    }
  }, [loadRequests]);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lời mời kết bạn</Text>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'received' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('received')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'received' && styles.activeTabButtonText
            ]}
          >
            Đã nhận {receivedRequests.length > 0 ? `(${receivedRequests.length})` : ''}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'sent' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('sent')}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'sent' && styles.activeTabButtonText
            ]}
          >
            Đã gửi {sentRequests.length > 0 ? `(${sentRequests.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải lời mời kết bạn...</Text>
        </View>
      ) : (
        activeTab === 'received' ? (
          <FlatList
            data={receivedRequests}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <RequestItem 
                request={item} 
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={loadRequests}
                colors={[colors.primary]}
              />
            }
            contentContainerStyle={
              receivedRequests.length === 0 
                ? styles.emptyContainer 
                : styles.listContent
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="person-add-disabled" size={80} color={colors.gray} />
                <Text style={styles.emptyText}>
                  Bạn không có lời mời kết bạn nào
                </Text>
              </View>
            }
          />
        ) : (
          <FlatList
            data={sentRequests}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <SentRequestItem 
                request={item} 
                onCancel={handleCancel}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={loadRequests}
                colors={[colors.primary]}
              />
            }
            contentContainerStyle={
              sentRequests.length === 0 
                ? styles.emptyContainer 
                : styles.listContent
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="person-add-disabled" size={80} color={colors.gray} />
                <Text style={styles.emptyText}>
                  Bạn chưa gửi lời mời kết bạn nào
                </Text>
              </View>
            }
          />
        )
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
    padding: spacing.xs,
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 16,
    color: colors.gray,
  },
  activeTabButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  requestInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  requestName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
  },
  requestTime: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  acceptButton: {
    backgroundColor: colors.primary,
  },
  declineButton: {
    borderWidth: 1,
    borderColor: colors.light,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.light,
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  declineButtonText: {
    color: colors.dark,
  },
  cancelButtonText: {
    color: colors.dark,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.primary,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default FriendRequestsScreen;
