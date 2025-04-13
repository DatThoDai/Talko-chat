import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomAvatar from '../components/CustomAvatar';
import { colors, spacing, borderRadius } from '../styles';
import { formatConversationDate } from '../utils/dateUtils';
import socketService from '../utils/socketService';
import conversationApi from '../api/conversationApi';

const ConversationItem = ({ conversation, onPress }) => {
  const { user } = useSelector(state => state.auth);
  
  // Get the name and avatar for display
  let name = conversation.name;
  let avatar = conversation.avatar;
  let avatarColor = conversation.avatarColor;
  
  // For individual chats, show the other person's info
  if (!conversation.type && conversation.members && conversation.members.length > 0) {
    // Find the other member (not current user)
    const otherMember = conversation.members.find(member => member._id !== user._id);
    if (otherMember) {
      name = otherMember.name || 'User';
      avatar = otherMember.avatar;
      avatarColor = otherMember.avatarColor;
    }
  }
  
  // Format the last message
  const getLastMessageText = () => {
    const lastMessage = conversation.lastMessage;
    
    if (!lastMessage) {
      return 'Không có tin nhắn';
    }
    
    if (lastMessage.type === 'NOTIFY') {
      return lastMessage.content;
    }
    
    // For text messages
    if (lastMessage.type === 'TEXT') {
      if (lastMessage.userId === user._id) {
        return `Bạn: ${lastMessage.content}`;
      } else if (conversation.type) {
        // Group chat
        const sender = lastMessage.user?.name || 'User';
        return `${sender}: ${lastMessage.content}`;
      } else {
        return lastMessage.content;
      }
    }
    
    // For other message types
    if (lastMessage.type === 'IMAGE') return 'Đã gửi một hình ảnh';
    if (lastMessage.type === 'VIDEO') return 'Đã gửi một video';
    if (lastMessage.type === 'FILE') return 'Đã gửi một tập tin';
    
    return 'Tin nhắn mới';
  };
  
  // Format timestamp
  const timestamp = conversation.updatedAt ? formatConversationDate(conversation.updatedAt) : '';
  
  return (
    <TouchableOpacity 
      style={styles.conversationItem} 
      onPress={() => onPress(conversation)}
    >
      <CustomAvatar 
        size={50} 
        name={name}
        color={avatarColor}
        imageUrl={avatar}
      />
      
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.timeText}>{timestamp}</Text>
        </View>
        
        <View style={styles.messagePreviewContainer}>
          <Text style={styles.messagePreview} numberOfLines={1}>
            {getLastMessageText()}
          </Text>
          
          {conversation.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ConversationsScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' hoặc 'friends'
  
  const { user } = useSelector((state) => state.auth);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Function to navigate to friends screen
  const navigateToFriends = useCallback(() => {
    navigation.navigate('Friends');
  }, [navigation]);

  // Function to load conversations
  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await conversationApi.getConversations(searchText);
      setConversations(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [searchText]);

  // Effect to handle tab changes
  useEffect(() => {
    if (activeTab === 'friends') {
      // Navigate to Friends screen when Friends tab is selected
      navigateToFriends();
      // Reset back to chats tab for when we return
      setActiveTab('chats');
    }
  }, [activeTab, navigateToFriends]);

  // Initial load of conversations
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );
  
  // Handler for refreshing the list
  const handleRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };
  
  // Handler for conversation item press
  const handleConversationPress = (conversation) => {
    navigation.navigate('Message', {
      conversationId: conversation._id,
      name: conversation.name,
      isGroup: !!conversation.type,
      avatar: conversation.avatar,
      avatarColor: conversation.avatarColor
    });
  };
  
  // Handler for new conversation button
  const handleNewConversation = () => {
    navigation.navigate('NewConversation');
  };
  
  // Filter conversations based on search text
  const filteredConversations = searchText.trim() === '' 
    ? conversations 
    : conversations.filter(conversation => 
        conversation.name.toLowerCase().includes(searchText.toLowerCase())
      );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'chats' && styles.activeTab]}
            onPress={() => setActiveTab('chats')}
          >
            <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabText]}>Tin nhắn</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>Bạn bè</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.newButton}
          onPress={handleNewConversation}
        >
          <Icon name="edit" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={colors.gray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm cuộc trò chuyện"
          placeholderTextColor={colors.gray}
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={() => setSearchText('')}>
            <Icon name="cancel" size={20} color={colors.gray} />
          </TouchableOpacity>
        )}
      </View>
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải cuộc trò chuyện...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>
            Không thể tải cuộc trò chuyện.
          </Text>
          <Text style={styles.errorSubtext}>
            Vui lòng kiểm tra kết nối mạng và thử lại.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={loadConversations}
          >
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              onPress={handleConversationPress}
            />
          )}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="chat-bubble-outline" size={64} color={colors.gray} />
              <Text style={styles.emptyText}>
                {searchText.trim() !== '' 
                  ? `Không tìm thấy cuộc trò chuyện với "${searchText}"`
                  : 'Bạn chưa có cuộc trò chuyện nào'
                }
              </Text>
              {searchText.trim() === '' && (
                <TouchableOpacity 
                  style={styles.startButton} 
                  onPress={handleNewConversation}
                >
                  <Text style={styles.startButtonText}>Bắt đầu trò chuyện mới</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.md,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 18,
    color: colors.gray,
  },
  activeTabText: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.dark,
  },
  newButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: colors.dark,
  },
  clearButton: {
    padding: spacing.xs,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  conversationInfo: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: colors.gray,
  },
  messagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messagePreview: {
    fontSize: 14,
    color: colors.gray,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    paddingHorizontal: 6,
  },
  unreadText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    marginTop: spacing.md,
    color: colors.gray,
    fontSize: 16,
    textAlign: 'center',
  },
  startButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  startButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.gray,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default ConversationsScreen;
