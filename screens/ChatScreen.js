import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { messageApi } from '../api/messageApi';
import conversationApi from '../api/conversationApi';
import socketService from '../utils/socketService';
import { colors, spacing } from '../styles';
import { formatMessageDate } from '../utils/dateUtils';
import userUtils from '../utils/userUtils';

// Import message components
import MessageInput from '../components/message/MessageInput';
import SenderMessage from '../components/message/SenderMessage';
import ReceiverMessage from '../components/message/ReceiverMessage';
import MessageDivider from '../components/message/MessageDivider';
import PinnedMessage from '../components/message/PinnedMessage';

const ChatScreen = ({ route, navigation }) => {
  const { conversationId } = route.params || {};
  const currentUser = useSelector(state => state.auth.user);
  
  // States
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  
  // Refs
  const flatListRef = useRef();
  const pageSize = 20; // Number of messages to load per page

  // Initial data loading
  useEffect(() => {
    if (!conversationId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin cuộc trò chuyện');
      navigation.goBack();
      return;
    }
    
    loadConversation();
    loadMessages();
    
    // Connect to socket for this conversation
    if (currentUser?._id) {
      socketService.initiateSocket(currentUser._id).then(() => {
        socketService.joinConversation(conversationId);
      });
    }
    
    // Cleanup on unmount
    return () => {
      socketService.leaveConversation(conversationId);
    };
  }, [conversationId, currentUser]);
  
  // Socket message handlers
  useEffect(() => {
    // Setup socket event listeners for new messages
    const handleNewMessage = (newMessage) => {
      if (newMessage.conversationId === conversationId) {
        setMessages(prev => [newMessage, ...prev]);
      }
    };
    
    const handleMessageUpdated = (updatedMessage) => {
      if (updatedMessage.conversationId === conversationId) {
        setMessages(prev => 
          prev.map(msg => msg._id === updatedMessage._id ? updatedMessage : msg)
        );
      }
    };
    
    const handleMessageDeleted = (data) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => 
          prev.filter(msg => msg._id !== data.messageId)
        );
      }
    };
    
    const handleTyping = (data) => {
      if (data.conversationId === conversationId && data.user?._id !== currentUser?._id) {
        if (data.isTyping) {
          setTypingUsers(prev => {
            // Add user to typing list if not already there
            if (!prev.find(u => u._id === data.user._id)) {
              return [...prev, data.user];
            }
            return prev;
          });
        } else {
          setTypingUsers(prev => prev.filter(u => u._id !== data.user._id));
        }
      }
    };
    
    // Setup event listeners
    document.addEventListener('socket:new-message', handleNewMessage);
    document.addEventListener('socket:message-updated', handleMessageUpdated);
    document.addEventListener('socket:message-deleted', handleMessageDeleted);
    document.addEventListener('socket:typing', handleTyping);
    
    return () => {
      // Remove event listeners on cleanup
      document.removeEventListener('socket:new-message', handleNewMessage);
      document.removeEventListener('socket:message-updated', handleMessageUpdated);
      document.removeEventListener('socket:message-deleted', handleMessageDeleted);
      document.removeEventListener('socket:typing', handleTyping);
    };
  }, [conversationId, currentUser]);
  
  // Load conversation details
  const loadConversation = async () => {
    try {
      const response = await conversationApi.fetchConversation(conversationId);
      setConversation(response.data);
      
      // Load pinned messages if any
      if (response.data.pinMessageIds && response.data.pinMessageIds.length > 0) {
        // Implement pinned messages loading
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin cuộc trò chuyện');
    }
  };
  
  // Load messages
  const loadMessages = async (refresh = false) => {
    try {
      const currentPage = refresh ? 1 : page;
      setLoading(true);
      
      const response = await messageApi.fetchMessage(conversationId, {
        page: currentPage,
        limit: pageSize
      });
      
      const newMessages = response.data || [];
      
      if (refresh) {
        setMessages(newMessages);
        setPage(1);
      } else {
        setMessages(prev => [...prev, ...newMessages]);
        setPage(currentPage + 1);
      }
      
      setHasMore(newMessages.length === pageSize);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadMessages(true);
  };
  
  // Load more messages
  const loadMore = () => {
    if (hasMore && !loading) {
      loadMessages();
    }
  };
  
  // Send a text message
  const handleSendMessage = async (text) => {
    if (!text || !text.trim()) return;
    
    try {
      // Generate a temporary ID for the message
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create valid sender info from current user
      const currentUserInfo = {
        _id: currentUser?._id || 'current-user',
        name: currentUser?.name || currentUser?.username?.split('@')[0] || 'You',
        username: currentUser?.username || '',
        email: currentUser?.email || currentUser?.username || '',
        avatar: currentUser?.avatar || ''
      };
      
      // Create a temporary message object
      const tempMessage = {
        _id: tempId,
        content: text.trim(),
        type: 'TEXT',
        createdAt: new Date().toISOString(),
        sender: currentUserInfo,
        conversationId: conversationId,
        forceMyMessage: true,  // Force this to display as a message from current user
        isTemp: true,
        status: 'sending'
      };
      
      // Add to messages state for immediate display
      setMessages(prev => [tempMessage, ...prev]);
      
      // Prepare data for API
      const messageData = {
        conversationId: conversationId,
        content: text.trim(),
        type: 'TEXT',
        tempId: tempId
      };
      
      // Send the message
      const response = await messageApi.sendMessage(messageData);
      
      if (response && response.data) {
        // Replace temp message with real one, but preserve our user info
        const responseData = response.data;
        const serverSenderInfo = responseData.sender || {};
        
        // If the server returned unknown/empty sender info, use our cached user info
        if (!serverSenderInfo._id || serverSenderInfo._id === 'unknown' || !serverSenderInfo.name || serverSenderInfo.name === 'Unknown User') {
          responseData.sender = currentUserInfo;
        }
        
        // Always mark as our message
        responseData.forceMyMessage = true;
        
        setMessages(prev => 
          prev.map(msg => 
            msg._id === tempId 
              ? { ...responseData, status: 'sent' } 
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Mark message as failed but keep it in the UI
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId 
            ? { ...msg, status: 'failed' } 
            : msg
        )
      );
    }
  };

  // Handle file upload
  const handleSendFile = async (file) => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      });
      
      const params = {
        conversationId,
        type: file.isImage ? 'image' : 'file',
      };
      
      const uploadProgressCallback = (progress) => {
        setUploadProgress(progress);
      };
      
      const response = await messageApi.sendFileBase64Message(
        formData,
        params,
        uploadProgressCallback
      );
      
      // Add message to state (temporarily until socket updates)
      const newMessage = response.data;
      setMessages(prev => [newMessage, ...prev]);
    } catch (error) {
      console.error('Error sending file:', error);
      Alert.alert('Lỗi', 'Không thể gửi file. Vui lòng thử lại sau.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  // Handle reply to message
  const handleReplyToMessage = (message) => {
    setReplyTo(message);
  };
  
  // Cancel reply
  const handleCancelReply = () => {
    setReplyTo(null);
  };
  
  // Render message item 
  const renderMessage = ({ item, index }) => {
    // Reset lại toàn bộ logic xác định tin nhắn của mình
    
    // Ensure sender name is valid
    if (item.sender) {
      item.sender.name = userUtils.getSafeDisplayName(item.sender);
    }
    
    // Log thông tin chi tiết về user và message sender
    console.log('Current user details:', {
      _id: currentUser?._id,
      email: currentUser?.email,
      username: currentUser?.username, 
      name: currentUser?.name
    });
    
    console.log('Message sender details:', {
      _id: item.sender?._id,
      name: item.sender?.name,
      userId: item.userId
    });
    
    // CÁCH 1: Tin nhắn tạm thời (gửi từ client này) luôn là của mình
    const isTemporaryMessage = item._id && String(item._id).startsWith('temp-');
    
    // CÁCH 2: Tin nhắn đã được đánh dấu là của mình
    const isMarkedAsMine = !!item.isMyMessage || !!item.forceMyMessage;
    
    // CÁCH 3: Sử dụng utility function để so sánh người dùng
    const isMatchingUser = userUtils.isMatchingUser(currentUser, item.sender) || 
                          userUtils.isMatchingUser(currentUser, item.userId);
    
    // Kiểm tra theo tên nếu trùng khớp chính xác
    const myName = currentUser?.name;
    const senderName = item.sender?.name;
    const sameName = myName && senderName && myName === senderName;
    
    // --------- CHẨN ĐOÁN LỖI -----------
    console.log(`Chat message rendering - ID: ${item._id}, temp: ${isTemporaryMessage}, marked: ${isMarkedAsMine}, matchingUser: ${isMatchingUser}, sameName: ${sameName}, sender: ${item.sender?.name}`);
    
    // --------- QUYẾT ĐỊNH CUỐI CÙNG ----------
    // Tin nhắn là của mình nếu phù hợp VỚI BẤT KỲ tiêu chí nào
    const isMyMessage = isTemporaryMessage || isMarkedAsMine || isMatchingUser || sameName;
    
    const messageDate = new Date(item.createdAt || Date.now());
    const formattedTime = formatMessageDate(messageDate);
    const showDateDivider = index === messages.length - 1 || 
      new Date(messages[index + 1]?.createdAt || Date.now()).toDateString() !== messageDate.toDateString();
    
    return (
      <>
        {isMyMessage ? (
          <SenderMessage
            message={item}
            content={item.content}
            time={formattedTime}
            reactVisibleInfo={`${item.reacts?.length || 0}`}
            reactLength={item.reacts?.length || 0}
            handleViewImage={(url) => {}}
            navigation={navigation}
            conversationId={conversationId}
            currentUserId={currentUser?._id}
            onReply={handleReplyToMessage}
          />
        ) : (
          <ReceiverMessage
            message={item}
            content={item.content}
            time={formattedTime}
            reactVisibleInfo={`${item.reacts?.length || 0}`}
            reactLength={item.reacts?.length || 0}
            handleViewImage={(url) => {}}
            navigation={navigation}
            conversationId={conversationId}
            currentUserId={currentUser?._id}
            onReply={handleReplyToMessage}
          />
        )}
        
        {showDateDivider && (
          <MessageDivider date={messageDate} />
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Chat header - can be moved to a separate component */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle} numberOfLines={1}>
          {conversation?.name || 'Chat'}
        </Text>
        
        <TouchableOpacity style={styles.headerButton}>
          <Icon name="more-vert" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      {/* Pinned messages */}
      {pinnedMessages.length > 0 && (
        <PinnedMessage 
          message={pinnedMessages[0]} 
          onPress={() => {}} 
        />
      )}
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messagesList}
            inverted
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListFooterComponent={loading && messages.length > 0 ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.footerLoader} />
            ) : null}
            ListEmptyComponent={!loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không có tin nhắn nào</Text>
              </View>
            ) : null}
          />
        )}
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>
              {typingUsers.map(user => user.name).join(', ')} đang nhập...
            </Text>
          </View>
        )}
        
        <MessageInput
          conversationId={conversationId}
          onSendMessage={handleSendMessage}
          onSendFile={handleSendFile}
          replyTo={replyTo}
          onCancelReply={handleCancelReply}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />
      </KeyboardAvoidingView>
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
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginHorizontal: spacing.small,
  },
  headerButton: {
    padding: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesList: {
    padding: spacing.medium,
    paddingTop: 40, // Extra padding on top for pull to refresh
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.medium,
    color: colors.grey,
  },
  footerLoader: {
    marginVertical: spacing.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    color: colors.grey,
    fontSize: 16,
  },
  typingContainer: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  typingText: {
    fontSize: 12,
    color: colors.grey,
    fontStyle: 'italic',
  },
});

export default ChatScreen; 