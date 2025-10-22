import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  StatusBar,
  Platform,
  Vibration 
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomAvatar from '../components/CustomAvatar';
import { fetchConversations } from '../redux/chatSlice';
import { colors, spacing, typography } from '../styles';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Audio } from 'expo-av'; // Sử dụng expo-av thay thế

import { registerStore, getSocket, initiateSocket } from '../utils/socketService';
import store from '../redux/store';
import notificationService from '../utils/notificationService';

// Format message time helper
const formatTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  if (isToday(date)) {
    return format(date, 'HH:mm', { locale: vi });
  } else if (isYesterday(date)) {
    return 'Hôm qua';
  } else {
    return format(date, 'dd/MM/yyyy', { locale: vi });
  }
};

// Format last message content
const formatLastMessage = (message) => {
  if (!message) return '';
  
  switch (message.type) {
    case 'TEXT':
      return message.content;
    case 'IMAGE':
      return '[Hình ảnh]';
    case 'VIDEO':
      return '[Video]';
    case 'FILE':
      return '[Tệp đính kèm]';
    case 'VOTE':
      return '[Bình chọn]';
    case 'NOTIFICATION':
      return message.content || '[Thông báo]';
    default:
      return message.content || '';
  }
};

const ConversationItem = ({ item, onPress, currentUserId }) => {
  React.useEffect(() => {
    if (item.lastMessage) {
      console.log(`🔄 HOME: Rendering conversation item ${item.name || 'Unknown'}:`, {
        lastMessage: formatLastMessage(item.lastMessage).substring(0, 20),
        time: item.lastMessage.createdAt ? 
          new Date(item.lastMessage.createdAt).toLocaleTimeString() : 'unknown',
        unreadCount: item.unreadMessages?.length || 0
      });
    }
  }, [item.lastMessage]);
  
  const unreadCount = item.unreadMessages?.length || 0;
  
  const lastMessageTime = item.lastMessage?.createdAt 
    ? formatTime(item.lastMessage.createdAt)
    : '';
  
  const lastMessageContent = formatLastMessage(item.lastMessage);
  
  const isGroup = item.isGroup || item.participants?.length > 2;
  
  const senderPrefix = isGroup && item.lastMessage && item.lastMessage.sender?._id !== currentUserId
    ? `${item.lastMessage.sender?.name || 'Ai đó'}: `
    : '';
  
  return (
    <TouchableOpacity 
      style={[
        styles.conversationItem,
        unreadCount > 0 && styles.unreadConversation
      ]} 
      onPress={() => onPress(item)}
    >
      <CustomAvatar 
        size={50} 
        name={item.name || ''} 
        imageUrl={item.avatar} 
        avatarColor={item.avatarColor || colors.primary}
        online={item.isOnline} 
      />
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName} numberOfLines={1}>
            {item.name || 'Cuộc trò chuyện'}
          </Text>
          <Text style={styles.conversationTime}>{lastMessageTime}</Text>
        </View>
        
        <Text 
          style={[
            styles.conversationMessage,
            unreadCount > 0 && styles.unreadMessage
          ]}
          numberOfLines={1}
        >
          {senderPrefix}{lastMessageContent || 'Bắt đầu cuộc trò chuyện mới'}
        </Text>
      </View>
      
      {unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { conversations, loading } = useSelector(state => state.chat);
  const { user } = useSelector(state => state.auth);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  
  // Register Redux store with socketService
  useEffect(() => {
    registerStore(store);
    notificationService.setupSound();
    
    // THÊM: Khởi tạo socket đúng cách với userId
    if (user?._id) {
      console.log('🔌 HOME: Initializing socket with userId:', user._id);
      initiateSocket(user._id);
      
      // THÊM: Join vào tất cả các cuộc trò chuyện hiện có để nhận thông báo
      const socket = getSocket();
      if (socket && conversations?.length > 0) {
        const conversationIds = conversations.map(conv => conv._id);
        console.log(`🔌 HOME: Joining ${conversationIds.length} conversations`);
        socket.emit('join-conversations', conversationIds);
      }
    }
    
    return () => {
      notificationService.unloadSound();
    };
  }, [user?._id]);
  
  useEffect(() => {
    const socket = getSocket();
    if (socket && socket.connected && conversations?.length > 0) {
      const conversationIds = conversations.map(conv => conv._id);
      console.log(`🔌 HOME: Joining ${conversationIds.length} conversations after update`);
      socket.emit('join-conversations', conversationIds);
    }
  }, [conversations]);
  
  // Fetch conversations when component mounts
  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);
  
  useEffect(() => {
    const socket = getSocket();
    
    if (socket) {
      console.log('🔌 HOME: Socket connected and ready in HomeScreen');
      
      // Listen for new messages
      socket.on('new-message', (conversationId, message) => {
        console.log('📩 HOME: New message received:', {
          conversationId,
          messageId: message?._id,
          content: message?.content?.substring(0, 20) || '[non-text]',
          type: message?.type,
          senderId: message?.sender?._id,
          currentUserId: user?._id
        });
        
        // Log thêm điều kiện kiểm tra
        console.log('📩 HOME: Message sender check:', {
          hasSender: !!message.sender,
          senderIdMatch: message.sender?._id === user?._id,
          willProcess: message.sender && message.sender._id !== user?._id
        });
        
        // Nếu là tin nhắn từ người khác
        if (message.sender && message.sender._id !== user?._id) {
          console.log('📩 HOME: Processing message from other user');
          // Cập nhật UI
          setHasNewMessage(true);
          
          // Phát âm thanh và rung
          notificationService.playNotificationSound();
          notificationService.vibrate();
          
          // Cập nhật danh sách cuộc trò chuyện
          console.log('📩 HOME: Dispatching fetchConversations()');
          dispatch(fetchConversations());
        } else {
          console.log('📩 HOME: Ignoring message from current user');
          // SỬA: Thêm vào đây để cập nhật cuộc hội thoại khi người dùng gửi tin nhắn
          console.log('📩 HOME: But still updating conversations for self messages');
          dispatch(fetchConversations());
        }
      });
      
      // Clean up listener when component unmounts
      return () => {
        console.log('🔌 HOME: Removing socket listeners in HomeScreen');
        socket.off('new-message');
      };
    } else {
      console.log('❌ HOME: Socket connection not available in HomeScreen');
    }
  }, [dispatch, user]);
  
  useEffect(() => {
    console.log(`🗂️ HOME: Conversations updated: ${conversations?.length || 0} conversations`);
    if (conversations?.length > 0) {
      console.log('🗂️ HOME: Last conversation:', {
        name: conversations[0].name,
        lastMessage: formatLastMessage(conversations[0].lastMessage),
        time: conversations[0].lastMessage?.createdAt ? 
          new Date(conversations[0].lastMessage.createdAt).toLocaleTimeString() : 'unknown'
      });
    }
  }, [conversations]);
  
  const handleConversationPress = (conversation) => {
    console.log('👆 HOME: Conversation pressed:', {
      id: conversation._id,
      name: conversation.name,
      lastMessage: formatLastMessage(conversation.lastMessage)
    });
    
    // Reset new message indicator when entering a conversation
    setHasNewMessage(false);
    
    // Navigate to message screen
    navigation.navigate('MessageScreen', {
      conversationId: conversation._id,
      conversationName: conversation.name,
      avatar: conversation.avatar,
      avatarColor: conversation.avatarColor,
      isGroupChat: conversation.isGroup,
      participants: conversation.participants
    });
  };
  
  const handleAddNew = () => {
    navigation.navigate('ContactScreen');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.white} barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Tin nhắn {hasNewMessage && <Text style={styles.newMessageDot}>●</Text>}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('SearchScreen')}
          >
            <Icon name="search" size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleAddNew}
          >
            <Icon name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        data={conversations}
        renderItem={({ item }) => (
          <ConversationItem 
            item={item} 
            onPress={handleConversationPress}
            currentUserId={user?._id}
          />
        )
        }
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Không có cuộc trò chuyện nào
              </Text>
              <TouchableOpacity 
                style={styles.startChatButton}
                onPress={handleAddNew}
              >
                <Text style={styles.startChatButtonText}>
                  Bắt đầu trò chuyện mới
                </Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
      
      <View style={styles.bottomTabs}>
        <TouchableOpacity 
          style={[styles.tabButton, styles.activeTab]}
          onPress={() => navigation.navigate('Home')}
        >
          <Icon name="chat" size={24} color={colors.primary} />
          <Text style={styles.activeTabText}>Tin nhắn</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => navigation.navigate('Contact')}
        >
          <Icon name="people" size={24} color={colors.gray} />
          <Text style={styles.tabText}>Danh bạ</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => navigation.navigate('Friends')}
        >
          <Icon name="person-add" size={24} color={colors.gray} />
          <Text style={styles.tabText}>Bạn bè</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Icon name="person" size={24} color={colors.gray} />
          <Text style={styles.tabText}>Cá nhân</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.primary,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: spacing.md,
    padding: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  conversationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
  },
  conversationTime: {
    fontSize: 12,
    color: colors.gray,
  },
  conversationMessage: {
    fontSize: 14,
    color: colors.gray,
  },
  unreadConversation: {
    backgroundColor: 'rgba(0, 132, 255, 0.05)',
  },
  unreadMessage: {
    fontWeight: 'bold',
    color: colors.dark,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.gray,
    marginBottom: spacing.md,
  },
  startChatButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.md,
  },
  startChatButtonText: {
    color: colors.white,
    fontWeight: 'bold',
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
  newMessageDot: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
