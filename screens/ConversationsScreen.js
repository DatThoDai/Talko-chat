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
  Platform,
  Vibration
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomAvatar from '../components/CustomAvatar';
import { colors, spacing, borderRadius } from '../styles';
import { formatConversationDate } from '../utils/dateUtils';
import { initiateSocket, getSocket } from '../utils/socketService';
import conversationApi from '../api/conversationApi';
import notificationService from '../utils/notificationService';
import userService from '../api/userService'; // Đảm bảo import userService từ '../api/userService'

const ConversationItem = ({ conversation, onPress }) => {
  const { user } = useSelector(state => state.auth);
  
  // Get the name and avatar for display
  let name = conversation.name;
  let avatarColor = conversation.avatarColor;
  
  // Xử lý avatar để đảm bảo nó là một chuỗi hợp lệ
  let avatar = "";
  if (conversation.avatar) {
    // Nếu avatar là mảng, lấy phần tử đầu tiên (nếu có)
    if (Array.isArray(conversation.avatar) && conversation.avatar.length > 0) {
      avatar = typeof conversation.avatar[0] === 'string' ? conversation.avatar[0] : "";
    } 
    // Nếu avatar là string
    else if (typeof conversation.avatar === 'string') {
      avatar = conversation.avatar;
    }
    
    // Log để debug
    console.log(`Avatar for ${name}:`, typeof avatar === 'string' ? 'Valid string URL' : 'Invalid format');
  }
  
  // For individual chats, show the other person's info
  if (!conversation.type && conversation.members && conversation.members.length > 0) {
    // Find the other member (not current user)
    const otherMember = conversation.members.find(member => member._id !== user._id);
    if (otherMember) {
      name = otherMember.name || 'User';
      avatarColor = otherMember.avatarColor;
      
      // Xử lý avatar của member
      if (otherMember.avatar) {
        // Kiểm tra nếu là mảng
        if (Array.isArray(otherMember.avatar) && otherMember.avatar.length > 0) {
          avatar = typeof otherMember.avatar[0] === 'string' ? otherMember.avatar[0] : "";
        } 
        // Nếu là string
        else if (typeof otherMember.avatar === 'string') {
          avatar = otherMember.avatar;
        }
      }
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
        imageUrl={typeof avatar === 'string' ? avatar : null}
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
  // States hiện tại...
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Thêm states mới
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [processedMessageIds] = useState(new Set());  // Để tránh xử lý trùng lặp
  const [socketConnected, setSocketConnected] = useState(false);
  const [realUserId, setRealUserId] = useState(null);
  
  const isFocused = useIsFocused();
  
  const { user } = useSelector((state) => state.auth);
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to load conversations
  // Dữ liệu mẫu để phát triển UI trong khi API chưa sẵn sàng
  
  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Fetching conversations...');
      
      // Trực tiếp xử lý axios fetch bên trong component thay vì qua service
      const response = await conversationApi.fetchConversations({search: searchText});
      
      /* 
       * Lưu ý: Dựa vào memory, chúng ta cần hết sức cẩn thận với việc extract response.data
       * Vì axios.js đã có interceptor trả về response.data,
       * nên ở đây response chính là data mặc dù API trả về { success, message, data }
       */
      
      // Kiểm tra nếu response là array hoặc object có data property
      const conversationsData = Array.isArray(response) ? response : 
                               (response && response.data ? response.data : []);
      
      console.log('Formatted conversations data:', 
                 Array.isArray(conversationsData) ? 
                 `Array with ${conversationsData.length} items` : 
                 'Not an array');
                 
      setConversations(Array.isArray(conversationsData) ? conversationsData : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      
      // Luôn sử dụng dữ liệu mẫu cho tất cả các lỗi mạng (404, Network Error, CORS, v.v.)
      // Điều này giúp phát triển UI/UX khi backend chưa hoàn thiện
      
      // Chỉ sử dụng dữ liệu mẫu trong môi trường dev, đặt false khi release
      const useMockData = true;
      
      if (err.response && err.response.status === 404) {
        console.log('API conversations not found (404) - Using mock data for development');
      } else if (err.message === 'Network Error') {
        console.log('Network error detected - Backend may not be fully implemented yet');
        console.log('Using mock data for UI development...');
      } else {
        console.log('Unknown error when fetching conversations:', err.message);
      }
      
      if (useMockData) {
        // Sử dụng dữ liệu mẫu để phát triển UI
        setConversations(mockConversations);
        console.log('Using mock data:', mockConversations.length, 'conversations');
        setError(null); // Không hiển thị lỗi cho người dùng khi dùng mock data
      } else {
        // Trong production mà không dùng mock data, hiển thị lỗi cho người dùng
        console.warn('Production mode - Showing error to user');
        setConversations([]);
        setError(err.message === 'Network Error' 
          ? 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng!'
          : 'Không thể tải cuộc trò chuyện. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [searchText]);

  // Effect to initialize socket - cải thiện từ hiện tại
  useEffect(() => {
    // Cài đặt âm thanh thông báo
    notificationService.setupSound();
    
    // Khởi tạo socket khi component mount
    const initializeSocket = async () => {
      try {
        const userId = user?._id;
        if (userId) {
          console.log('🔌 CONV: Initializing socket with userId:', userId);
          
          // Khởi tạo socket với Promise
          initiateSocket(userId)
            .then(socket => {
              if (socket && socket.connected) {
                console.log('🔌 CONV: Socket connected successfully, id:', socket.id);
                setSocketConnected(true);
                
                // Join vào các cuộc trò chuyện ngay sau khi kết nối
                if (conversations?.length > 0) {
                  const conversationIds = conversations.map(conv => conv._id);
                  console.log(`🔌 CONV: Joining ${conversationIds.length} conversations`);
                  socket.emit('join-conversations', conversationIds);
                }
              }
            })
            .catch(err => {
              console.error('🔌 CONV: Error initializing socket:', err);
            });
        }
      } catch (error) {
        console.error('❌ CONV: Error initializing socket:', error);
      }
    };
    
    initializeSocket();
    
    return () => {
      // Dọn dẹp khi unmount
      notificationService.unloadSound();
      
      // Chỉ hủy listeners, không disconnect socket
      const socket = getSocket();
      if (socket) {
        socket.off('new-message');
      }
    };
  }, [user?._id]);

  // Đăng ký sự kiện socket cho tin nhắn mới - cải thiện từ hiện tại
  useEffect(() => {
    const socketInstance = getSocket();
    const currentUserId = realUserId || user?._id;
    
    if (socketInstance && socketInstance.connected) {
      console.log('🔌 CONV: Setting up new-message listener with currentUserId:', currentUserId);
      
      const handleMessageReceived = (conversationId, message) => {
        // Xử lý tin nhắn mới
        console.log('📩 CONV: New message received:', {
          conversationId,
          messageId: message?._id,
          content: message?.content?.substring(0, 20) || '[non-text]',
          sender: message?.sender?._id
        });
        
        // Tránh xử lý trùng lặp
        if (message._id && processedMessageIds.has(message._id)) {
          console.log('📩 CONV: Skipping already processed message:', message._id);
          return;
        }
        
        // Đánh dấu đã xử lý
        if (message._id) {
          processedMessageIds.add(message._id);
        }
        
        // Kiểm tra xem tin nhắn có phải của mình hay không
        const isOwnMessage = 
          (message.sender && message.sender._id === user?._id) ||
          (realUserId && message.sender && message.sender._id === realUserId) ||
          message.isMyMessage === true ||
          message.forceMyMessage === true;
        
        console.log('📩 CONV: Message ownership check:', {
          isOwnMessage,
          senderId: message.sender?._id,
          currentId: user?._id,
          realId: realUserId
        });
        
        // Nếu không phải tin nhắn từ mình và màn hình hiện tại không phải MessageScreen
        if (!isOwnMessage && !navigation.isFocused('MessageScreen')) {
          console.log('📩 CONV: Message from other user, showing notification');
          
          // Cập nhật UI
          setHasNewMessage(true);
          
          // Phát âm thanh và rung
          notificationService.playNotificationSound();
          if (Platform.OS === 'android' || Platform.OS === 'ios') {
            Vibration.vibrate(300);
          }
        }
        
        // Cập nhật danh sách cuộc trò chuyện
        setConversations(prevConversations => {
          return prevConversations.map(conversation => {
            if (conversation._id === conversationId) {
              // Cập nhật cuộc trò chuyện với tin nhắn mới
              return {
                ...conversation,
                lastMessage: message,
                updatedAt: new Date().toISOString(),
                // Tăng số tin nhắn chưa đọc nếu không phải tin nhắn của mình
                unreadCount: !isOwnMessage ? (conversation.unreadCount || 0) + 1 : conversation.unreadCount || 0
              };
            }
            return conversation;
          });
        });
      };
      
      // Đăng ký lắng nghe sự kiện new-message
      socketInstance.on('new-message', handleMessageReceived);
      
      // Thêm sự kiện check-online-status để nắm bắt trạng thái kết nối
      socketInstance.on('connect', () => {
        console.log('🔌 CONV: Socket connected event');
        setSocketConnected(true);
      });
      
      socketInstance.on('disconnect', () => {
        console.log('🔌 CONV: Socket disconnected event');
        setSocketConnected(false);
      });
      
      return () => {
        socketInstance.off('new-message', handleMessageReceived);
        socketInstance.off('connect');
        socketInstance.off('disconnect');
      };
    } else {
      console.log('❌ CONV: Socket not connected when setting up listeners');
    }
  }, [realUserId, user?._id, socketConnected]);
  
  // Thêm useEffect để join vào các conversation khi danh sách thay đổi
  useEffect(() => {
    const socket = getSocket();
    if (socket && socket.connected && conversations?.length > 0) {
      const conversationIds = conversations.map(conv => conv._id);
      console.log(`🔌 CONV: Joining ${conversationIds.length} conversations after update`);
      socket.emit('join-conversations', conversationIds);
    }
  }, [conversations, socketConnected]);
  
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
    // Reset thông báo tin nhắn mới khi vào cuộc hội thoại
    setHasNewMessage(false);
    
    // Reset số lượng tin nhắn chưa đọc cho cuộc trò chuyện này
    setConversations(prevConversations => {
      return prevConversations.map(conv => {
        if (conv._id === conversation._id) {
          return {
            ...conv,
            unreadCount: 0 // Reset unreadCount
          };
        }
        return conv;
      });
    });
    
    // Điều hướng đến MessageScreen
    navigation.navigate('MessageScreen', {
      conversationId: conversation._id,
      name: conversation.name,
      isGroup: !!conversation.type,
      avatar: conversation.avatar,
      avatarColor: conversation.avatarColor
    });
  };
  
  // Handler for new conversation button
  const handleNewConversation = () => {
    // Sử dụng đúng tên màn hình đã được đăng ký trong MainStackNavigator
    navigation.navigate('NewConversationScreen');
  };
  
  // Filter conversations based on search text
  const filteredConversations = searchText.trim() === '' 
    ? conversations 
    : conversations.filter(conversation => 
        conversation.name.toLowerCase().includes(searchText.toLowerCase())
      );
  
  // Thêm useEffect để lấy realUserId
  useEffect(() => {
    const fetchRealUserId = async () => {
      if (user && user._id && user._id.includes('@')) {
        try {
          // Đảm bảo import userService từ '../api/userService'
          const userId = await userService.getUserIdByEmail(user._id);
          if (userId) {
            console.log('🔑 CONV: Found real user ID:', userId);
            setRealUserId(userId);
          }
        } catch (error) {
          console.error('❌ CONV: Error fetching real user ID:', error);
        }
      }
    };
    
    fetchRealUserId();
  }, [user]);
  
  // Cập nhật phần return trong component để hiển thị thông báo
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Tin nhắn</Text>
          {hasNewMessage && (
            <View style={styles.newMessageIndicator}>
              <Text style={styles.newMessageDot}>●</Text>
              <Text style={styles.newMessageText}>Mới</Text>
            </View>
          )}
          {!socketConnected && (
            <View style={styles.connectionStatusContainer}>
              <Text style={styles.disconnectedText}>Đang kết nối...</Text>
            </View>
          )}
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
          )
          }
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
              <Icon name="chat-bubble-outline" size={80} color={colors.lightGray} />
              <Text style={styles.emptyText}>
                {searchText.trim() !== '' 
                  ? `Không tìm thấy cuộc trò chuyện với "${searchText}"`
                  : 'Hộp tin nhắn của bạn đang trống'
                }
              </Text>
              
              {searchText.trim() === '' && (
                <>
                  <Text style={styles.emptySubText}>
                    Tạo cuộc trò chuyện mới để kết nối với bạn bè và đồng nghiệp
                  </Text>
                  <TouchableOpacity 
                    style={styles.startButton} 
                    onPress={handleNewConversation}
                  >
                    <Text style={styles.startButtonText}>Bắt đầu cuộc trò chuyện</Text>
                  </TouchableOpacity>
                </>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
  },
  newMessageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 132, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 5,
  },
  newMessageDot: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  newMessageText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  connectionStatusContainer: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 173, 51, 0.1)',
    borderRadius: 10,
  },
  disconnectedText: {
    color: '#FF9500',
    fontSize: 10,
    fontWeight: 'bold',
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
