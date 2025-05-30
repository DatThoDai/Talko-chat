import React, {useEffect, useRef, useState} from 'react';
import {
  BackHandler,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableWithoutFeedback,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import {useSelector} from 'react-redux';
import AnimatedEllipsis from '../components/AnimatedEllipsis';
import ChatMessage from '../components/message/ChatMessage';
import MessageInput from '../components/message/MessageInput';
import MessageHeaderLeft from '../components/message/MessageHeaderLeft';
import PinnedMessage from '../components/message/PinnedMessage';
import StickyBoard from '../components/StickyBoard';
import MessageDivider from '../components/message/MessageDivider';
import ReactionModal from '../components/modal/ReactionModal';
import ImagePickerModal from '../components/modal/ImagePickerModal';
import MessageModal from '../components/modal/MessageModal';
import ViewImageModal from '../components/modal/ViewImageModal';
import MessageDetailModal from '../components/modal/MessageDetailModal';
import {colors, spacing} from '../styles';
import {
  initiateSocket,
  joinConversation,
  emitTyping,
  disconnectSocket,
  getSocket,
  leaveConversation,
  markConversationAsViewed,
  subscribeCallVideo,
  subscribeCallAudio,
} from '../utils/socketService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch} from 'react-redux';
import {addNewMessage, updateMessage} from '../redux/chatSlice';
import { conversationApi, conversationService } from '../api';
// REMOVED: Duplicate import fixed to avoid 'Identifier has already been declared' error
import userUtils from '../utils/userUtils';
import { userService } from '../api/userService';
import { messageApi } from '../api/messageApi';
// Thêm import VoteMessage vào đầu file
import VoteMessage from '../components/message/VoteMessage';
// Thêm import này vào đầu file
import voteApi from '../api/voteApi';
import socketService from '../utils/socketService';
import pinMessagesApi from '../api/pinMessagesApi';
// Thêm vào đầu file
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { REACTIONS } from '../constants/index';
import SystemNotificationMessage from '../components/message/SystemNotificationMessage';
// Thêm imports
// import { 
//   bulkCacheNotificationUsers,
//   cacheNotificationUser
// } from '../redux/chatSlice';
// Thêm import
import IncomingCallModal from '../components/modal/IncomingCallModal';
// Constants for default values - matching zelo_mobile implementation
const DEFAULT_MESSAGE_MODAL_VISIBLE = {
  isVisible: false,
  isRecall: false,
  isMyMessage: false,
  messageId: '',
  messageContent: '',
  type: '',
};

const DEFAULT_REACTION_MODAL_VISIBLE = {
  isVisible: false,
  messageId: '',
  reactions: [],
};

const DEFAULT_MESSAGE_DETAIL_MODAL = {
  isVisible: false,
  message: null,
};

const DEFAULT_IMAGE_MODAL = {
  isVisible: false,
  imageUrl: '',
  imageUrls: [],
};

const DEFAULT_REPLY_MESSAGE = {
  isReply: false,
  message: null,
};

const DEFAULT_STICKER_BOARD = {
  isVisible: false,
};

const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 30;

// Add message recall text constant
const MESSAGE_RECALL_TEXT = 'Tin nhắn đã được thu hồi';

const MessageScreen = ({navigation, route}) => {
  // Props and Redux state
  const {conversationId, conversationName: initialConversationName, participants, avatar, avatarColor, isGroupChat} = route.params || {};
  const {user} = useSelector((state) => state.auth);
  const {keyboardHeight} = useSelector((state) => state.global || {keyboardHeight: 0});

  // Thêm đoạn này để hiện debug log
  useEffect(() => {
    console.log('MessageScreen route params:', route.params);
    console.log('isGroup from route:', route.params?.isGroup);
    console.log('isGroupChat from route:', isGroupChat);
  }, []);

  // Tạo biến để xác định đúng loại cuộc trò chuyện
  const actualIsGroupChat = isGroupChat || route.params?.isGroup || false;

  // State variables
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [modalVisible, setModalVisible] = useState(DEFAULT_MESSAGE_MODAL_VISIBLE);
  const [reactProps, setReactProps] = useState(DEFAULT_REACTION_MODAL_VISIBLE);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [stickyBoardVisible, setStickyBoardVisible] = useState(false);
  const [imageProps, setImageProps] = useState(DEFAULT_IMAGE_MODAL);
  const [messageDetailProps, setMessageDetailProps] = useState(DEFAULT_MESSAGE_DETAIL_MODAL);
  const [replyMessage, setReplyMessage] = useState(DEFAULT_REPLY_MESSAGE);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [typingUsers, setTypingUsers] = useState({});
  
  // State để kiểm soát việc cuộn tin nhắn tự động
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [userScrolled, setUserScrolled] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  // State cho việc upload file
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadingFile, setCurrentUploadingFile] = useState(null);

  // Thêm state mới để lưu trữ userId thực
  const [realUserId, setRealUserId] = useState(null);

  // Thêm vào đầu component MessageScreen trong phần khai báo state
  const [incomingCall, setIncomingCall] = useState({
    visible: false,
    caller: null,
  });

  const dispatch = useDispatch(); 


  // References
  const flatListRef = useRef(null);

  // Tạo một Set để theo dõi ID tin nhắn đã xử lý
  const [processedMessageIds] = useState(new Set());

  // Add state for conversation name
  const [conversationName, setConversationName] = useState(initialConversationName);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused && route.params?.conversationName !== conversationName) {
      setConversationName(route.params.conversationName);
    }
  }, [route.params?.conversationName, isFocused]);
  // Thêm vào sau phần khai báo state, trước các useEffect
  const currentUserId = realUserId || user?._id;

  // Phương thức cuộn đến tin nhắn mới nhất ở dưới cùng - cải tiến để không tự động nhảy
  const scrollToBottom = (animated = false, force = false) => {
    if (flatListRef.current && messages.length > 0) {
      // Chỉ cuộn xuống nếu có force=true hoặc người dùng chưa scroll lên trên
      if (force || shouldAutoScroll) {
        requestAnimationFrame(() => {
          flatListRef.current.scrollToEnd({animated});
          console.log('Scrolled to bottom - force:', force, 'shouldAutoScroll:', shouldAutoScroll);
        });
      } else {
        console.log('Skip auto-scroll - user has scrolled up');
      }
    }
  };
  
  // Xử lý sự kiện scroll của người dùng
  const handleScroll = (event) => {
    // Lấy thông tin vị trí scroll hiện tại
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    
    // Tính toán xem có đang ở cuối cùng hay không (với ngưỡng 20px)
    const atBottom = contentHeight <= layoutHeight || 
                   offsetY + layoutHeight >= contentHeight - 20;
                    
    // Đánh dấu là người dùng đã scroll
    setUserScrolled(true);
    
    // Nếu đang ở cuối cùng, bật lại auto-scroll
    if (atBottom) {
      setShouldAutoScroll(true);
      setIsAtBottom(true);
    } else {
      setShouldAutoScroll(false);
      setIsAtBottom(false);
    }
  };
  
  // Hàm thử lại gửi tin nhắn khi gặp lỗi
  const handleRetryMessage = (failedMessage) => {
    if (!failedMessage || !failedMessage.isTemp) return;
    
    // Cập nhật trạng thái tin nhắn thành đang gửi lại
    setMessages(prev => 
      prev.map(msg => msg._id === failedMessage._id ? {...msg, status: 'sending'} : msg)
    );
    
    // Tạo dữ liệu gửi lại
    const messageData = {
      conversationId,
      content: failedMessage.content,
      replyToId: failedMessage.replyToId,
      tempId: failedMessage._id
    };
    
    // Gửi lại tin nhắn
    console.log('Gửi lại tin nhắn:', failedMessage.content);
    conversationService.sendTextMessage(messageData)
      .then(response => {
        console.log('Gửi lại tin nhắn thành công:', response);
        if (response && response.data) {
          // Cập nhật tin nhắn trong danh sách
          setMessages(prev => 
            prev.map(msg => 
              msg._id === failedMessage._id 
                ? {...response.data, isTemp: false, status: 'sent'}
                : msg
            )
          );
        }
      })
      .catch(error => {
        console.error('Lỗi khi gửi lại tin nhắn:', error);
        // Đổi trạng thái lại thành lỗi
        setMessages(prev => 
          prev.map(msg => msg._id === failedMessage._id ? {...msg, status: 'failed'} : msg)
        );
      });
  };

  // Setup socket connection when conversation changes
  useEffect(() => {
    if (conversationId && user?._id) {
      // Initialize socket connection
      
      initiateSocket(user?._id, conversationId);
      
      // Load initial messages
      loadMessages();
      
      // Chỉ tải tin nhắn ghim nếu là nhóm trò chuyện
      // Xác định loại cuộc trò chuyện từ actualIsGroupChat đã được thiết lập ở trên
      if (actualIsGroupChat) {
        console.log('Loading pinned messages for group chat');
        fetchPinnedMessages();
      } else {
        console.log('Skipping pinned messages for private chat');
        // Đặt pinnedMessages thành mảng rỗng cho cuộc trò chuyện đơn
        setPinnedMessages([]);
      }
      
      // Setup socket event listener for real-time message deletion
      const handleMessageDeleted = (data) => {
        const messageId = data.messageId || data.id;
        
        console.log('Socket delete event received in MessageScreen:', messageId);
        if (messageId) {
          // Filter out the deleted message from state
          setMessages(prevMessages => 
            prevMessages.filter(msg => msg._id !== messageId)
          );
        }
      };
      
      const handleNewMessage = (msgConversationId, message) => {
        console.log('Socket new-message received:', message?._id, 'type:', message?.type);
        
        if (msgConversationId === conversationId) {
          setMessages(prevMessages => {
            // 1. Kiểm tra ID đã xử lý
            if (processedMessageIds.has(message._id)) {
              console.log('Message already in processedIds, skipping:', message._id);
              return prevMessages;
            }
            
            // 2. THÊM: Kiểm tra nếu tin nhắn này là của chính người dùng hiện tại
            const isOwnMessage = message.sender?._id === user?._id || 
                                message.sender?._id === realUserId;
            
            // 3. Kiểm tra tin nhắn tạm thời đã được gửi thành công
const matchingTempMessage = prevMessages.find(msg => {
  // Nếu là tin nhắn văn bản, so sánh content
  if (message.type === 'TEXT' && msg.content === message.content) {
    return Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 30000;
  }
  
  // NẾU TIN NHẮN DẠNG FILE - so sánh URL hoặc mediaUrl
  if ((message.type === 'IMAGE' || message.type === 'FILE' || message.type === 'VIDEO') && 
      (msg.type === message.type)) {
    
    // So sánh fileUrl/url/mediaUrl từ cả hai phía
    const msgUrl = msg.fileUrl || msg.url || msg.mediaUrl || '';
    const newMsgUrl = message.fileUrl || message.url || message.mediaUrl || '';
    
    // So sánh phần cuối của URL (vì đôi khi URL đầy đủ sẽ khác nhau)
    const msgUrlEnd = msgUrl.split('/').pop();
    const newMsgUrlEnd = newMsgUrl.split('/').pop();
    
    console.log('File matching check:', {
      msgUrl: msgUrlEnd,
      newUrl: newMsgUrlEnd,
      match: msgUrlEnd === newMsgUrlEnd && msgUrlEnd !== ''
    });
    
    // Nếu tên file giống nhau hoặc thời gian gửi gần nhau -> đây là tin nhắn trùng lặp
    return (msgUrlEnd === newMsgUrlEnd && msgUrlEnd !== '') || 
           (Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 20000);
  }
  
  return false;
});
            
            if (matchingTempMessage) {
              console.log('Found matching temp message, skipping socket message');
              // Đánh dấu ID này để không xử lý nữa
              processedMessageIds.add(message._id);
              return prevMessages;
            }
            
            // Kiểm tra tin nhắn trùng lặp như cũ
            const exists = prevMessages.some(msg => {
              // Logic hiện tại của bạn
              if (msg._id === message._id) return true;
              // ...
            });
            
            if (exists) {
              console.log('Duplicate message detected, skipping:', message._id);
              return prevMessages;
            }
            
            // Xử lý thông tin người gửi
            let enhancedMessage = {...message};
            
            // 4. QUAN TRỌNG: Đảm bảo tin nhắn từ socket luôn có sender đầy đủ
if (!enhancedMessage.sender || !enhancedMessage.sender._id || !enhancedMessage.sender.name) {
  // Xác định ID người gửi từ nhiều nguồn có thể
  const senderId = enhancedMessage.sender?._id || enhancedMessage.userId || enhancedMessage.user?._id;
  
  // Tìm thông tin người gửi từ danh sách participants
  const senderInfo = participants?.find(p => p._id === senderId);
  
  if (senderInfo) {
    // Nếu tìm thấy trong participants, sử dụng thông tin từ đó
    console.log(`Found sender info for ${senderId} in participants:`, senderInfo.name);
    enhancedMessage.sender = {
      _id: senderId,
      name: senderInfo.name || senderInfo.username || 'Người dùng',
      avatar: senderInfo.avatar || '',
      avatarColor: senderInfo.avatarColor || '#1194ff'
    };
  } else if (isOwnMessage) {
    // Nếu là tin nhắn của người dùng hiện tại
    enhancedMessage.sender = {
      _id: user._id,
      name: user.name || user.username || 'Bạn',
      avatar: user.avatar || '',
      avatarColor: user.avatarColor || '#1194ff'
    };
  } else if (senderId && senderId !== 'unknown') {
    // Set temporary name
    enhancedMessage.sender = {
      _id: senderId,
      name: 'Đang tải...',  // Thay vì "Người dùng khác"
      avatar: '',
    };
    
    // Fetch real user info without blocking (async)
    setTimeout(async () => {
      try {
        // Sử dụng searchByUsername thay vì getUserById
        const userResponse = await userService.getUserById(senderId);
        
        if (userResponse && userResponse.data) {
          // Trích xuất dữ liệu người dùng
          const userData = Array.isArray(userResponse.data) ? userResponse.data[0] : userResponse.data;
          
          if (userData) {
            console.log(`Found user info for ${senderId}:`, userData.name);
            
            // Cập nhật tin nhắn với thông tin đầy đủ từ API
            setMessages(prevMsgs => 
              prevMsgs.map(msg => 
                msg._id === enhancedMessage._id ? {
                  ...msg, 
                  sender: {
                    _id: userData._id || senderId,
                    name: userData.name || userData.username || 'Người dùng',
                    avatar: userData.avatar || '',
                    avatarColor: userData.avatarColor || '#1194ff'
                  }
                } : msg
              )
            );
          }
        }
      } catch (error) {
        console.log('Error searching user info:', error);
      }
    }, 100);
  } else {
    // Fallback nếu không có ID
    enhancedMessage.sender = {
      _id: 'unknown',
      name: 'Người dùng không xác định',
      avatar: '',
    };
  }
}
            
            // 5. QUAN TRỌNG: Đánh dấu đúng nếu là tin nhắn của mình
            if (isOwnMessage) {
              enhancedMessage.isMyMessage = true;
              enhancedMessage.forceMyMessage = true;
            }
            
            processedMessageIds.add(message._id);
            return [...prevMessages, enhancedMessage];
          });
        }
      };
        // Define the EMOJI_MAP for reaction conversion
      const EMOJI_MAP = {
        1: '👍',
        2: '❤️',
        3: '😂',
        4: '😮',
        5: '😢',
        6: '😡'
      };

      // Handle incoming reaction from socket
      const handleAddReactionFromSocket = (data) => {
        console.log('📢 Socket add-reaction received in MessageScreen:', data);
        
        const { messageId, user: reactionUser, type, conversationId: reactionConversationId } = data;
        
        // Kiểm tra để tránh xử lý reaction của chính mình
        if (reactionUser._id === (realUserId || user._id)) {
          console.log('🚫 Skipping own reaction from socket to avoid duplication');
          return;
        }
        
        // Kiểm tra xem reaction có phải cho cuộc trò chuyện hiện tại không
        if (reactionConversationId !== conversationId) {
          console.log('Bỏ qua reaction từ cuộc trò chuyện khác');
          return;
        }
        
        // Convert numeric type to emoji
        const emoji = typeof type === 'number' ? EMOJI_MAP[type] || '👍' : type;
        
        console.log('🔄 Converting reaction type:', {
          originalType: type,
          typeOfType: typeof type,
          convertedEmoji: emoji
        });
        
        setMessages(prevMessages => {
          return prevMessages.map(msg => {
            if (msg._id === messageId) {
              // Update both reactions and reacts arrays for compatibility
              const updatedReactions = [...(msg.reactions || [])];
              const updatedReacts = [...(msg.reacts || [])];
              
              // Check if user already has a reaction on this message
              const existingReactionIndex = updatedReactions.findIndex(
                r => r.userId === reactionUser._id || (r.user && r.user._id === reactionUser._id)
              );
              
              const newReaction = {
                user: reactionUser,
                userId: reactionUser._id,
                userName: reactionUser.name || reactionUser.username || 'Người dùng',
                userAvatar: reactionUser.avatar || '',
                userAvatarColor: reactionUser.avatarColor || '#1194ff',
                type: emoji,
                createdAt: new Date().toISOString()
              };
              
              const newReact = {
                user: reactionUser,
                type: type,
                createdAt: new Date().toISOString()
              };
              
              if (existingReactionIndex >= 0) {
                // Replace existing reaction
                updatedReactions[existingReactionIndex] = newReaction;
                updatedReacts[existingReactionIndex] = newReact;
                console.log('🔄 Updated existing reaction via socket');
              } else {
                // Add new reaction
                updatedReactions.push(newReaction);
                updatedReacts.push(newReact);
                console.log('➕ Added new reaction via socket');
              }
              
              console.log('📊 Final reactions for message:', {
                messageId: msg._id?.substring(0, 8),
                totalReactions: updatedReactions.length,
                reactionTypes: updatedReactions.map(r => r.type)
              });
              
              return {
                ...msg,
                reactions: updatedReactions,
                reacts: updatedReacts
              };
            }
            return msg;
          });
        });
      };

      const socketInstance = getSocket();
      if (socketInstance) {
        socketInstance.on('delete-message', handleMessageDeleted);
        socketInstance.on('message-deleted', handleMessageDeleted);
        socketInstance.on('new-message', handleNewMessage);
        socketInstance.on('add-reaction', handleAddReactionFromSocket);
        
        // Chỉ lắng nghe sự kiện ghim/bỏ ghim nếu đây là nhóm trò chuyện
        if (actualIsGroupChat) {
          // Listen for pin-message events
          socketInstance.on('action-pin-message', (conversationId) => {
            console.log('Pin message event received for conversation:', conversationId);
            fetchPinnedMessages(); // Refresh pinned messages
          });
        }
      }
      
      // Thêm lắng nghe sự kiện new-user-call
      const handleIncomingCall = async (data) => {
        console.log('Có người gọi vào với peerId:', data.peerId);
        
        // Kiểm tra xem cuộc gọi này có phải cho đoạn chat hiện tại không
        if (data.conversationId !== conversationId) {
          console.log('Bỏ qua thông báo cuộc gọi từ đoạn chat khác:', data.conversationId);
          return;
        }
        
        // Nếu người gọi không phải là mình
        if (data.newUserId !== user._id && data.newUserId !== realUserId) {
          // Tạo thông tin người gọi tạm thời để hiển thị ngay
          let callerInfo = {
            _id: data.newUserId,
            name: 'Đang tải...',
            avatar: '',
            avatarColor: colors.primary
          };
          
          // Hiển thị modal cuộc gọi đến với thông tin tạm thời trước
          setIncomingCall({
            visible: true,
            caller: callerInfo,
            peerId: data.peerId,
            conversationId: data.conversationId
          });
          
          // Tìm thông tin người gọi từ danh sách participants
          const participantInfo = participants?.find(p => p._id === data.newUserId);
          
          if (participantInfo) {
            // Nếu tìm thấy trong participants, cập nhật ngay
            callerInfo = {
              _id: data.newUserId,
              name: participantInfo.name || 'Người dùng',
              avatar: participantInfo.avatar || '',
              avatarColor: participantInfo.avatarColor || colors.primary
            };
            
            // Cập nhật lại modal với thông tin đầy đủ
            setIncomingCall(prev => ({
              ...prev,
              caller: callerInfo
            }));
          } else {
            // Nếu không tìm thấy trong participants, gọi API
            try {
              const response = await userService.getUserById(data.newUserId);
              
              if (response && response.data) {
                const userData = response.data;
                callerInfo = {
                  _id: data.newUserId,
                  name: userData.name || userData.username || 'Người gọi',
                  avatar: userData.avatar || '',
                  avatarColor: userData.avatarColor || colors.primary
                };
                
                // Cập nhật lại modal với thông tin từ API
                setIncomingCall(prev => ({
                  ...prev,
                  caller: callerInfo
                }));
              }
            } catch (error) {
              console.error('Lỗi khi lấy thông tin người gọi:', error);
            }
          }
        }
      };
      
      // Đăng ký lắng nghe sự kiện cuộc gọi đến
      socketService.on('incoming-video-call', (data) => {
        console.log('📹 INCOMING VIDEO CALL:', data);
        
        // Kiểm tra xem cuộc gọi này có phải cho đoạn chat hiện tại không
        if (data.conversationId !== conversationId) {
          console.log('Bỏ qua thông báo cuộc gọi từ đoạn chat khác:', data.conversationId);
          return;
        }
        
        // Nếu người gọi không phải là mình
        if (data.caller && data.caller.userId !== user._id && data.caller.userId !== realUserId) {
          // Tạo thông tin người gọi từ dữ liệu nhận được
          let callerInfo = {
            _id: data.caller.userId,
            name: data.caller.name || 'Người gọi',
            avatar: data.caller.avatar || '',
            avatarColor: colors.primary
          };
          
          // Hiển thị modal cuộc gọi đến
          setIncomingCall({
            visible: true,
            caller: callerInfo,
            conversationId: data.conversationId
          });
        }
      });
      
      // Ưu tiên lấy tên từ route.params trước
      const actualName = route.params?.name || conversationName || 'Cuộc trò chuyện';
      const actualAvatar = typeof avatar === 'string' ? avatar : (Array.isArray(avatar) ? '' : avatar || '');
      const actualAvatarColor = avatarColor || colors.primary;
      
      // Xác định đúng loại cuộc trò chuyện
      const isGroupConversation = isGroupChat || route.params?.isGroup || actualIsGroupChat || false;
      
      console.log('Setting conversation header with:', {
        name: actualName,
        isGroup: isGroupConversation,
        avatar: actualAvatar?.substring(0, 30) + '...',
      });
      
      // Thiết lập header với đầy đủ props
      navigation.setOptions({
        headerShown: true,
        headerLeft: () => (
          <MessageHeaderLeft
            conversationName={actualName}
            avatar={actualAvatar}
            avatarColor={actualAvatarColor}
            isGroup={isGroupConversation} // Thêm prop này
            onBack={() => navigation.goBack()}
            onPress={() => handleGoToOptionScreen()}
            onVideoCall={handleStartVideoCall} // Thêm dòng này
          />
        ),
        headerTitle: () => null,
        headerRight: () => null,
      });
      
      // Setup socket event listener for group rename
      const handleRenameConversation = (conversationId, newName, message) => {
        console.log(`Conversation ${conversationId} renamed to ${newName}`);
        if (conversationId === route.params.conversationId) {
          // Update the conversation name in state
          setConversationName(newName);
          
          // Update the navigation parameters
          navigation.setParams({ conversationName: newName });
          
          // Add the notification message to the messages list if provided
          if (message) {
            const newNotifyMessage = {
              ...message,
              isTemp: false,
              status: 'sent'
            };
            
            setMessages(prevMessages => {
              // Check if the message already exists to avoid duplicates
              if (!prevMessages.some(msg => msg._id === message._id)) {
                return [newNotifyMessage, ...prevMessages];
              }
              return prevMessages;
            });
          }
        }
      };
      
      // Subscribe to rename-conversation event
      const socket = getSocket();
      if (socket) {
        socket.on('rename-conversation', handleRenameConversation);
      }
        // Cleanup socket when unmounting
      return () => {
        if (socketInstance) {
          socketInstance.off('delete-message', handleMessageDeleted);
          socketInstance.off('message-deleted', handleMessageDeleted);
          socketInstance.off('new-message', handleNewMessage);
          socketInstance.off('add-reaction', handleAddReactionFromSocket);
          
          // Chỉ hủy lắng nghe các sự kiện ghim nếu đây là nhóm trò chuyện
          if (actualIsGroupChat) {
            socketInstance.off('action-pin-message');
          }
        }
        
        if (conversationId) {
          console.log('Leaving conversation:', conversationId);
          leaveConversation(conversationId);
        }
        
        // Remove the rename-conversation event listener
        if (socket) {
          socket.off('rename-conversation', handleRenameConversation);
        }
        
        // Clean up
        socketService.off('new-user-call', handleIncomingCall);
        socketService.off('incoming-video-call'); // Thêm dòng này
      };
    }
  }, [conversationId, user?._id, route.params.conversationId]);

  // Thêm useEffect để fetch userId thực từ email khi component mount
  useEffect(() => {
    const fetchRealUserId = async () => {
      // Kiểm tra xem user._id có phải là email không
      if (user && user._id && user._id.includes('@')) {
        try {
          // Gọi API để lấy userId thực từ email
          const userId = await userService.getUserIdByEmail(user._id);
          
          if (userId) {
            console.log('Found real user ID:', userId);
            setRealUserId(userId);
          }
        } catch (error) {
          console.error('Error fetching real user ID:', error);
        }
      }
    };
    
    fetchRealUserId();
  }, [user]);

  // Handle back button
  useEffect(() => {
    const backAction = () => {
      handleGoBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  // Handle go back
  const handleGoBack = () => {
    try {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
    return true;
  };

  // Handle navigation to conversation details
  const handleGoToOptionScreen = () => {
    // Kiểm tra xem có là nhóm không bằng nhiều nguồn
    const isGroup = isGroupChat || route.params?.isGroup || actualIsGroupChat || false;
    
    console.log('Navigating to options with params:', {
      conversationId,
      name: conversationName,
      avatar: avatar,
      isGroupChat: isGroup
    });
    
    // Sử dụng navigate thay vì push để tránh stack navigation
    navigation.navigate('ConversationOptionsScreen', {
      conversationId,
      name: conversationName,
      avatar: typeof avatar === 'string' ? avatar : (Array.isArray(avatar) ? '' : avatar || ''),
      avatarColor,
      isGroupChat: isGroup,
      type: isGroup ? 'group' : 'private'
    });
  };

  // Handle reply to message - hỗ trợ cả ID và đối tượng tin nhắn đầy đủ
  const handleOnReplyMessagePress = messageParam => {
    console.log('handleOnReplyMessagePress called with param type:', typeof messageParam);
    
    // Xử lý trường hợp messageParam là một đối tượng tin nhắn đầy đủ
    if (typeof messageParam === 'object' && messageParam !== null && messageParam._id) {
      console.log('Message object passed directly:', messageParam._id);
      
      // Kiểm tra xem tin nhắn này đã có trong state messages chưa
      const existingMessage = messages.find(msg => msg._id === messageParam._id);
      
      // Nếu tin nhắn đã có trong state, sử dụng phiên bản từ state
      // Nếu không, sử dụng đối tượng được truyền vào
      const finalMessage = existingMessage || messageParam;
      
      console.log('Setting reply message with content:', finalMessage.content?.substring(0, 20));
      setReplyMessage({
        isReply: true,
        message: finalMessage,
      });
      console.log('Reply message set from object, isReply:', true);
    } 
    // Xử lý trường hợp messageParam là ID (chuỗi)
    else {
      const messageId = messageParam;
      console.log('Looking for message with ID:', messageId);
      const messageToReply = messages.find(msg => msg._id === messageId);
      console.log('Message to reply found:', !!messageToReply);
      
      if (messageToReply) {
        console.log('Setting reply message with content:', messageToReply.content?.substring(0, 20));
        setReplyMessage({
          isReply: true,
          message: messageToReply,
        });
        // Thêm log để xác nhận replyMessage đã được cập nhật
        console.log('Reply message set from ID, isReply:', true);
      } else {
        console.error('Could not find message with ID:', messageId);
      }
    }
  };

  // Load messages with improved scrolling
  const loadMessages = async (refresh = false) => {
    if (loading && !refresh) return;
    
    try {
      // Show loading indicator
      setLoading(true);
      
      // Reset messages if refreshing
      if (refresh) {
        setPage(0);
        setMessages([]);
      }
      
      // Set user ID for message API request
      const currentUserId = user?._id;
      
      // Fetch messages from API
      console.log(`Loading messages for conversation ${conversationId}, page ${page}, size ${DEFAULT_PAGE_SIZE}`);
      const response = await conversationService.getMessages(
        conversationId,
        page,
        DEFAULT_PAGE_SIZE,
        currentUserId
      );
      
      if (response && response.data) {
        // Process message data after fetching
        let messageData = response.data.map(msg => {
          // Convert replyMessage from backend to replyToMessage for frontend if needed
          if (msg.replyMessage && 
              msg.replyMessage._id && 
              typeof msg.replyMessage._id === 'string' && 
              !msg.replyToMessage) {
            console.log('Converting replyMessage to replyToMessage for message:', msg._id);
            msg.replyToMessage = {
              ...msg.replyMessage,
              // Ensure sender data is mapped correctly
              sender: msg.replyMessage.user || { 
                _id: msg.replyMessage.userId,
                name: 'Người dùng',
              }
            };
          }
          return msg;
        });
        
        // Log thông tin về tin nhắn đã chuẩn hóa
        console.log(`Standardized ${messageData.length} messages`);
        
        // Sắp xếp tin nhắn theo thời gian tăng dần (cũ đến mới) - đảm bảo tin nhắn cũ ở trên, tin nhắn mới ở dưới
        messageData = messageData.sort((a, b) => {
          return new Date(a.createdAt) - new Date(b.createdAt);
        });

        // Process reply information for messages
        const messagesMap = new Map();
        
        // First, create a map of all messages by ID
        messageData.forEach(msg => {
          messagesMap.set(msg._id, msg);
        });
        
        // Then, for each message with a replyToId, find the original message and associate it
        messageData.forEach(msg => {
          if (msg.replyToId) {
            const originalMessage = messagesMap.get(msg.replyToId);
            if (originalMessage) {
              msg.replyToMessage = originalMessage;
            }
          }
        });
        
        console.log('Messages after sorting by time:', 
          messageData.slice(0, 3).map(m => ({ 
            id: m._id?.substring(0, 8) || 'unknown', 
            time: new Date(m.createdAt).toLocaleTimeString(),
            content: m.content?.substring(0, 10) || 'empty'
          }))
        );
        
        if (refresh) {
          // Xóa tin nhắn cũ và tải mới
          setMessages(messageData);
        } else if (Array.isArray(messages)) {
          // Thêm tin nhắn mới vào cuối danh sách hiện tại
          setMessages(prevMessages => [...prevMessages, ...messageData]);
        } else {
          // Nếu messages hiện tại không phải là một mảng
          console.warn('Current messages is not an array, resetting to new data');
          setMessages(messageData);
        }
        
        // Chỉ cho tải thêm nếu có đủ tin nhắn theo kích thước trang
        const hasMore = Array.isArray(messageData) && messageData.length === DEFAULT_PAGE_SIZE;
        setHasMoreMessages(hasMore);
        setPage(page + 1); // Tăng page lên 1 để lần sau load tin nhắn tiếp theo
        
        // Force scroll to bottom on initial load only
        if (page === 0) {
          // Use a slightly longer delay to ensure rendering is complete
          setTimeout(() => {
            // Reset user scroll state since this is a fresh load
            setUserScrolled(false);
            setShouldAutoScroll(true);
            scrollToBottom(true, true);
          }, 500);
        }
        
        // Sau khi cập nhật messages
        setTimeout(() => {
          loadVoteDetails(); // Tải thông tin chi tiết của vote
        }, 500);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Lỗi', 'Không thể tải tin nhắn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Sửa hàm loadVoteDetails trong MessageScreen.js
const loadVoteDetails = async () => {
  try {
    // Lọc ra các tin nhắn kiểu VOTE
    const voteMessages = messages.filter(msg => msg.type === 'VOTE');
    
    if (voteMessages.length === 0) return;
    
    console.log(`Loading details for ${voteMessages.length} vote messages`);
    
    // Gọi API để lấy thông tin chi tiết của các vote
    const response = await voteApi.getVotesByConversationId(conversationId);
    
    // In ra để debug cấu trúc dữ liệu
    console.log('Vote API response structure:', 
      response ? 
      `data: ${typeof response.data}, isArray: ${Array.isArray(response.data)}` : 
      'undefined');
    
    // Xử lý nhiều kiểu cấu trúc dữ liệu có thể có
    let voteDetailsArray = [];
    
    if (response && response.data) {
      // Kiểm tra xem response.data có phải là mảng không
      if (Array.isArray(response.data)) {
        voteDetailsArray = response.data;
      }
      // Kiểm tra xem response.data.data có phải là mảng không
      else if (response.data.data && Array.isArray(response.data.data)) {
        voteDetailsArray = response.data.data;
      }
      // Nếu response.data là object với thuộc tính _id, đó có thể là một vote duy nhất
      else if (typeof response.data === 'object' && response.data._id) {
        voteDetailsArray = [response.data];
      }
      
      console.log('Vote details processed:', voteDetailsArray.length || 0);
      
      if (voteDetailsArray.length > 0) {
        // Cập nhật tin nhắn vote trong state với thông tin chi tiết
        setMessages(prevMessages => 
          prevMessages.map(msg => {
            if (msg.type === 'VOTE') {
              // Tìm thông tin chi tiết cho vote này
              const voteDetail = voteDetailsArray.find(v => v._id === msg._id);
              
              if (voteDetail) {
                console.log(`Found details for vote ${msg._id.substring(0, 8)}`);
                return {
                  ...msg,
                  options: voteDetail.options || msg.options,
                  userOptions: voteDetail.userOptions || msg.userOptions
                };
              }
            }
            return msg;
          })
        );
      }
    }
  } catch (error) {
    console.error('Error loading vote details:', error);
  }
};

  // Load more messages khi kéo lên trên cùng (lịch sử tin nhắn cũ hơn)
  const goToNextPage = () => {
    if (loading || !hasMoreMessages) return;
    
    console.log('Loading older messages...');
    // Không tự động cuộn sau khi load tin nhắn cũ hơn
    const nextPage = page + 1;
    loadMessages();
  };

  // Handle showing last viewers
  const handleShowLastView = async messageId => {
    try {
      const response = await conversationService.getLastViewers(conversationId, messageId);
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching last viewers:', error);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (content) => {
    if (!content || !content.trim()) return;

    try {
      // Create unique temporary ID for the message
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${user?._id?.substring(0, 8) || ''}`;
      
      // Format display name from email if needed
      let displayName = user?.name;
      if (!displayName && user?.username && user.username.includes('@')) {
        // Extract username part from email (e.g., extract "john" from "john@example.com")
        displayName = user.username.split('@')[0];
        // Make it Title Case (e.g., "john.doe" becomes "John Doe")
        displayName = displayName
          .replace(/\./g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      
      // Ensure we have valid user information for the temporary message
      const currentUserInfo = {
        _id: user?._id || 'current-user',
        name: displayName || 'You', // Use formatted display name
        username: user?.username || '',
        email: user?.email || user?.username || '',
        avatar: user?.avatar || ''
      };
      
      // Create a temporary message object to show immediately in the UI
      const tempMessage = {
        _id: tempId,
        content: content.trim(),
        type: 'TEXT',
        conversationId: conversationId,
        createdAt: new Date().toISOString(),
        sender: {
          _id: user?._id,  // Đảm bảo có _id
          name: user?.name || user?.username || 'Bạn',
          avatar: user?.avatar || ''
        },
        isTemp: true,
        isMyMessage: true,
        forceMyMessage: true, // Đảm bảo flag này được thiết lập
        status: 'sending',
      };

      // Add reply information if this is a reply message
      if (replyMessage.isReply && replyMessage.message) {
        tempMessage.replyToMessage = replyMessage.message;
        tempMessage.replyToId = replyMessage.message._id;
      }
      
      // Add temporary message to the messages list for immediate display
      setMessages((prevMessages) => [...prevMessages, tempMessage]);
      
      // Reset reply state if needed
      if (replyMessage.isReply) {
        setReplyMessage(DEFAULT_REPLY_MESSAGE);
      }
      
      // Cuộn xuống dưới cùng ngay lập tức
      setTimeout(() => scrollToBottom(), 50);
      
      // Send the actual message to the server
      const messageData = {
        conversationId: conversationId,
        content: content.trim(),
        type: 'TEXT', // Explicitly set the type for the server
        tempId: tempId, // Include the temp ID for tracking
        replyToId: replyMessage.isReply ? replyMessage.message._id : null,
      };
      
      // Call the API to send the message
      console.log(`Sending message (tempId: ${tempId}):`, content.trim());
      const response = await conversationService.sendTextMessage(messageData);
      
      // Handle successful response
      if (response && response.data) {
        // Đánh dấu ID này là đã xử lý để tránh socket thêm lại lần nữa
        processedMessageIds.add(response.data._id);
        
        // Đánh dấu cả nội dung tin nhắn để tránh socket trả lại trùng lặp
        const messageKey = `${user._id}-${content.trim()}`;
        processedMessageIds.add(messageKey);
        
        // Đảm bảo thông tin người gửi đầy đủ
        const responseData = {
          ...response.data,
          sender: {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
          },
          isMyMessage: true,
          forceMyMessage: true
        };
        
        // Convert replyMessage from backend to replyToMessage for frontend if needed
        if (responseData.replyMessage && 
            responseData.replyMessage._id && 
            typeof responseData.replyMessage._id === 'string' && 
            !responseData.replyToMessage) {
          console.log('Converting server replyMessage to replyToMessage:', responseData.replyMessage);
          responseData.replyToMessage = {
            ...responseData.replyMessage,
            // Ensure sender data is mapped correctly
            sender: responseData.replyMessage.user || { 
              _id: responseData.replyMessage.userId,
              name: 'Người dùng',
            }
          };
        }
        // Preserve the replyToMessage data if this was a reply
        else if (tempMessage.replyToMessage && 
                tempMessage.replyToMessage._id && 
                typeof tempMessage.replyToMessage._id === 'string') {
          responseData.replyToMessage = tempMessage.replyToMessage;
        }
        
        // Cập nhật tin nhắn trong state
        setMessages((prevMessages) => 
          prevMessages.map((msg) => 
            msg._id === tempId ? responseData : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Keep the message in the UI but mark it as failed
      setMessages((prevMessages) => 
        prevMessages.map((msg) => 
          msg._id === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
      
      // Add retry functionality
      const retryHandler = () => {
        // Update UI to show retrying
        setMessages((prevMessages) => 
          prevMessages.map((msg) => 
            msg._id === tempId ? { ...msg, status: 'retrying' } : msg
          )
        );
        
        // Re-attempt to send
        conversationService.sendTextMessage(messageData)
          .then(response => {
            if (response && response.data) {
              const responseData = response.data;
              
              // Preserve our user display name again on retry
              if (responseData.sender) {
                responseData.sender = {
                  ...responseData.sender,
                  name: currentUserInfo.name,
                };
              } else {
                responseData.sender = currentUserInfo;
              }
              
              responseData.isMyMessage = true;
              responseData.forceMyMessage = true;
              
              setMessages((prevMessages) => 
                prevMessages.map((msg) => 
                  msg._id === tempId ? { 
                    ...responseData, 
                    status: 'sent',
                    forceMyMessage: true
                  } : msg
                )
              );
            }
          })
          .catch(() => {
            // Mark as failed again
            setMessages((prevMessages) => 
              prevMessages.map((msg) => 
                msg._id === tempId ? { ...msg, status: 'failed' } : msg
              )
            );
          });
      };
      
      // Store retry handler with the message
      setMessages((prevMessages) => 
        prevMessages.map((msg) => 
          msg._id === tempId ? { ...msg, retryHandler } : msg
        )
      );
    }
  };
const handleSendSticker = async (stickerUrl) => {
  if (!stickerUrl) {
    console.error('Invalid sticker URL');
    return;
  }
  
  console.log('Sending sticker as image:', stickerUrl);
  
  // Tạo ID tạm thời cho tin nhắn sticker
  const tempId = `temp-sticker-${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${user?._id?.substring(0, 8) || ''}`;
  
  try {
    // Tạo tin nhắn tạm để hiển thị ngay - GIỐNG NHƯ GỬI ẢNH
    const tempMessage = {
      _id: tempId,
      conversationId: conversationId,
      type: 'IMAGE', // Đặt type là IMAGE để hiển thị như ảnh
      fileUrl: stickerUrl, // Sử dụng fileUrl như ảnh
      content: '', // Để trống content
      sender: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar
      },
      createdAt: new Date().toISOString(),
      isTemp: true,
      status: 'sending',
      isMyMessage: true,
      forceMyMessage: true,
    };
    
    // Thêm tin nhắn tạm vào danh sách
    setMessages(prevMessages => [...prevMessages, tempMessage]);
    
    // Cuộn xuống dưới cùng
    setTimeout(() => scrollToBottom(), 50);
    
    // Import messageApi để gửi như file ảnh
    const messageApiModule = await import('../api/messageApi');
    const { messageApi } = messageApiModule;
    
    // Tạo object file giả từ URL sticker
    const stickerFile = {
      uri: stickerUrl,
      type: 'image/png', // Giả định sticker là PNG
      name: `sticker_${Date.now()}.png`,
      isImage: true,
      size: 0 // Không biết size chính xác
    };
    
    // Gửi sticker như một file ảnh
    const response = await messageApi.sendFileMessage({
      file: stickerFile,
      conversationId: conversationId,
      type: 'IMAGE'
    });
    
    console.log('Sticker sent successfully:', response);
    
    if (response && response.data) {
      // Đánh dấu ID này là đã xử lý
      processedMessageIds.add(response.data._id);
      
      // Đánh dấu cả fileUrl để tránh trùng lặp
      const fileUrl = response.data.fileUrl || response.data.url || response.data.mediaUrl;
      if (fileUrl) {
        processedMessageIds.add(fileUrl);
      }
      
      // Cập nhật tin nhắn tạm thành tin nhắn chính thức
      const updatedMessage = {
        ...response.data,
        type: 'IMAGE', // Đảm bảo type vẫn là IMAGE
        fileUrl: response.data.fileUrl || response.data.url || response.data.mediaUrl || stickerUrl,
        sender: {
          _id: user._id,
          name: user.name,
          avatar: user.avatar
        },
        isMyMessage: true,
        forceMyMessage: true,
        status: 'sent'
      };
      
      console.log('Updated sticker message:', {
        id: updatedMessage._id,
        type: updatedMessage.type,
        fileUrl: updatedMessage.fileUrl
      });
      
      // Cập nhật tin nhắn trong state
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === tempId ? updatedMessage : msg
        )
      );
    }
  } catch (error) {
    console.error('Error sending sticker:', error);
    
    // Cập nhật trạng thái tin nhắn thành lỗi
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg._id === tempId ? { ...msg, status: 'failed' } : msg
      )
    );
    
    Alert.alert('Lỗi', 'Không thể gửi sticker. Vui lòng thử lại sau.');
  }
};
  // Sửa lại hàm handleSendFileMessage
const handleSendFileMessage = async (file) => {
  if (!file) return;
  
  // Tạo ID tạm thởi cho tin nhắn file
  const tempId = `temp-file-${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${user?._id?.substring(0, 8) || ''}`;
  
  try {
    // Start tracking upload progress
    setIsUploading(true);
    setUploadProgress(0);
    setCurrentUploadingFile(file);
    
    // Xác định loại file
    let fileType = 'FILE';
    if (file.isImage || (file.type && file.type.includes('image'))) {
      fileType = 'IMAGE';
    } else if (file.type && file.type.includes('video')) {
      fileType = 'VIDEO';
    }
    
    console.log('Processing file:', {
      uri: file.uri,
      type: file.type,
      name: file.name,
      size: file.size,
      fileType: fileType
    });
    
    // Tạo tin nhắn tạm thởi
    const tempMessage = {
      _id: tempId,
      conversationId,
      sender: {
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar
      },
      createdAt: new Date().toISOString(),
      type: fileType,
      fileName: file.name,
      fileSize: file.size,
      fileUrl: file.uri, // URI tạm thởi cho preview
      isTemp: true,
      status: 'uploading',
      uploadProgress: 0,
      isMyMessage: true,
      forceMyMessage: true,
    };
    
    // Thêm tin nhắn tạm thởi
    setMessages(prevMessages => [...prevMessages, tempMessage]);
    
    // Progress tracking
    const updateProgress = (progress) => {
      setUploadProgress(progress);
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId 
            ? {...msg, uploadProgress: progress} 
            : msg
        )
      );
    };
    
    // Import và sử dụng messageApi
    const messageApiModule = await import('../api/messageApi');
    const { messageApi } = messageApiModule;
    
    console.log('Sending file with conversation ID:', conversationId);
    
    // Gọi API sendFileMessage
    const response = await messageApi.sendFileMessage({
      file,
      conversationId,
      type: fileType
    }, updateProgress);
    
    console.log('Response received:', response);
    
    if (response && response.data) {
      // Đánh dấu ID này là đã xử lý để tránh socket thêm lại
      processedMessageIds.add(response.data._id);
      
      // Đánh dấu cả URL để tránh trùng lặp
      const fileUrl = response.data.fileUrl || response.data.url || response.data.mediaUrl;
      if (fileUrl) {
        processedMessageIds.add(fileUrl); // Đánh dấu cả URL
      }
      
      // Giải phóng ID này sau 30 giây
      setTimeout(() => {
        processedMessageIds.delete(response.data._id);
        if (fileUrl) processedMessageIds.delete(fileUrl);
      }, 30000);
      
      // Log để debug
      console.log('File response from server:', response.data);
      
      // Tạo object với đầy đủ thông tin cần thiết
      const updatedMessage = {
        ...response.data,
        // Đảm bảo type là IMAGE cho hình ảnh
        type: fileType || 'IMAGE',
        // Đảm bảo có fileUrl cho hiển thị
        fileUrl: response.data.fileUrl || response.data.url || response.data.mediaUrl || file.uri,
        // Thông tin khác
        isMyMessage: true,
        forceMyMessage: true,
        status: 'sent'
      };
      
      console.log('Updated image message:', {
        id: updatedMessage._id,
        type: updatedMessage.type,
        fileUrl: updatedMessage.fileUrl
      });
      
      setMessages(prev => 
        prev.map(msg => 
          msg._id === tempId ? updatedMessage : msg
        )
      );
    }
    
    setIsUploading(false);
    setUploadProgress(0);
    setCurrentUploadingFile(null);
  } catch (error) {
    console.error('Error sending file message:', error);
    
    // Cập nhật trạng thái tin nhắn thành lỗi
    setMessages(prev => 
      prev.map(msg => 
        msg._id === tempId 
          ? {...msg, status: 'failed'} 
          : msg
      )
    );
    
    Alert.alert('Lỗi', 'Không thể gửi file. Vui lòng thử lại sau.');
    setIsUploading(false);
    setUploadProgress(0);
    setCurrentUploadingFile(null);
  }
};

  // Xóa tin nhắn (chỉ xóa ở phiên bản của mình)
  const handleDeleteMessage = async (messageId) => {
    try {
      console.log('Deleting message client side:', messageId);
      
      // Gọi API trước
      await messageApi.deleteMessage(messageId);
      
      // Sau khi API thành công, cập nhật UI
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg._id !== messageId)
      );
      
      // Đóng modal
      setModalVisible(DEFAULT_MESSAGE_MODAL_VISIBLE);
      
      // Hiển thị thông báo thành công
      Alert.alert('Thành công', 'Tin nhắn đã được xóa');
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Lỗi', 'Không thể xóa tin nhắn. Vui lòng thử lại sau.');
    }
  };
  
  // Thu hồi tin nhắn cho tất cả người dùng (tương đương với redoMessage)
  const handleRecallMessage = async (messageId) => {
    try {
      const messageToRecall = messages.find(msg => msg._id === messageId);
      if (!messageToRecall) {
        console.error('Message not found for recall:', messageId);
        return;
      }
      
      // Cập nhật giao diện ngay lập tức để hiển thị "Tin nhắn đã được thu hồi"
      const updatedMessages = messages.map(msg => {
        if (msg._id === messageId) {
          return {
            ...msg,
            content: MESSAGE_RECALL_TEXT,
            status: 'recalled',
            isRecalled: true,
            isDeleted: false // Ensure message is not deleted
          };
        }
        return msg;
      });
      
      setMessages(updatedMessages);
      
      // Gọi API để thu hồi tin nhắn cho tất cả người dùng
      await messageApi.recallMessage(messageId);
      console.log('Message recalled successfully:', messageId);
      
      // Đóng modal nếu đang mở
      setModalVisible(DEFAULT_MESSAGE_MODAL_VISIBLE);
    } catch (error) {
      console.error('Error recalling message:', error);
      Alert.alert('Lỗi', 'Không thể thu hồi tin nhắn. Vui lòng thử lại sau.');
    }
  };

  // Handle add reaction
  const handleAddReaction = async (messageId, type) => {
    try {
      // Chuyển đổi emoji sang số nếu cần
      let reactionNumber;
      if (typeof type === 'string') {
        const index = REACTIONS.findIndex(emoji => emoji === type);
        reactionNumber = index !== -1 ? index + 1 : 1;
        console.log(`Converting emoji ${type} to reaction number ${reactionNumber}`);
      } else {
        // Nếu đã là số thì giữ nguyên
        reactionNumber = type;
      }
      
      // Vẫn giữ emoji gốc để hiển thị trong UI
      const optimisticReaction = {
        userId: user._id,
        userName: user.name || user.username || 'Bạn',
        userAvatar: user.avatar || '',
        userAvatarColor: user.avatarColor || '#1194ff',
        type: type, // Vẫn lưu emoji trong local state để hiển thị
        createdAt: new Date().toISOString()
      };
      
      // Cập nhật UI ngay lập tức
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg._id === messageId) {
            const reactions = msg.reactions || [];
            // Tìm kiếm reaction có cùng userId và type
            const existingIndex = reactions.findIndex(
              r => r.userId === user._id && r.type === type
            );
            
            let updatedReactions;
            if (existingIndex >= 0) {
              // Xóa reaction nếu đã có
              updatedReactions = [...reactions];
              updatedReactions.splice(existingIndex, 1);
            } else {
              // Thêm reaction mới
              updatedReactions = [...reactions, optimisticReaction];
            }
            
            return { ...msg, reactions: updatedReactions };
          }
          return msg;
        })
      );
      
      // Gọi API với reactionNumber thay vì emoji
      await messageApi.addReaction(messageId, reactionNumber);
      
      // Đóng modal reaction nếu đang mở
      setReactProps(DEFAULT_REACTION_MODAL_VISIBLE);
    } catch (error) {
      console.error('Error adding reaction:', error);
      Alert.alert('Lỗi', 'Không thể thêm biểu cảm. Vui lòng thử lại sau.');
    }
  };

  // Thêm hàm handlePreviewImage vào MessageScreen component
  // Thêm vào cùng khu vực với các hàm xử lý khác

  // Hàm xử lý xem trước hình ảnh khi click vào tin nhắn dạng ảnh
  const handlePreviewImage = (imageUrl, allUrls = []) => {
    // Đảm bảo imageUrl không bị null hoặc undefined
    if (!imageUrl) {
      console.warn('Attempted to preview image with empty URL');
      return;
    }
    
    // Hiển thị modal xem hình ảnh
    setImageProps({
      isVisible: true,
      imageUrl: imageUrl,
      imageUrls: allUrls.length > 0 ? allUrls : [imageUrl]
    });
    
    console.log('Previewing image:', imageUrl);
  };

  // Function to scroll to a specific message by ID
  const scrollToMessage = (messageId) => {
    // Find the message in the list
    const messageIndex = messages.findIndex(msg => msg._id === messageId);
    
    if (messageIndex !== -1) {
      // The message exists, scroll to it
      console.log(`Scrolling to message at index ${messageIndex}`);
      
      // Use flatListRef to scroll to the specific index
      // Note: We need to calculate the position because the list is sorted from old to new (bottom to top)
      flatListRef.current?.scrollToIndex({
        index: messageIndex,
        animated: true,
        viewPosition: 0.5, // Center the item in the view
      });
      
      // Highlight the message temporarily
      // We could add a temporary highlight effect here if desired
    } else {
      console.log(`Message with ID ${messageId} not found for scrolling`);
    }
  };

// Xử lý khi người dùng chọn một option trong vote
const handleVoteOption = async (voteId, optionName, isChecked) => {
  try {
    if (isChecked) {
      // Người dùng chọn option
      await voteApi.selectOption(voteId, { options: [optionName] });
    } else {
      // Người dùng bỏ chọn option
      await voteApi.deleteSelectOption(voteId, { options: [optionName] });
    }
    
    // Cập nhật lại danh sách tin nhắn sau khi vote
    loadMessages(true);
  } catch (error) {
    console.error('Error voting:', error);
    Alert.alert('Lỗi', 'Không thể bình chọn. Vui lòng thử lại sau.');
  }
};

  // Cập nhật hàm renderMessage để xử lý tin nhắn hệ thống
  const renderMessage = (message, index) => {
    // Đảm bảo tin nhắn hợp lệ
    if (!message) return null;
    // Bổ sung thông tin người gửi nếu thiếu
    if (message.sender && !message.sender.name) {
      // Tìm thông tin người gửi từ danh sách participants
      const sender = participants?.find(p => p._id === message.sender._id);
      if (sender) {
        // Cập nhật thông tin người gửi
        message = {
          ...message,
          sender: {
            ...message.sender,
            name: sender.name || sender.username || 'Người dùng',
            avatar: sender.avatar || message.sender.avatar,
            avatarColor: sender.avatarColor || message.sender.avatarColor
          }
        };
      } else if (message.sender._id) {
        // Nếu không tìm thấy trong participants, sử dụng ID làm tên
        message = {
          ...message,
          sender: {
            ...message.sender,
            name: message.sender._id.substring(0, 8) + '...',
          }
        };
      }
    }
    
    // Lấy ID của người dùng hiện tại
    const currentUser = user || {};
    
    // Kiểm tra xem ID người dùng là ObjectID hay email
    const isCurrentUserIdEmail = currentUser._id && 
        (currentUser._id.includes('@') || currentUser._id.length > 30);
    
    // Kiểm tra xem message.sender._id có phải là ObjectID không
    const isSenderIdObjectId = message.sender && message.sender._id && 
        !message.sender._id.includes('@') && message.sender._id.length < 30;
    
    // Xác định isMyMessage dựa trên ID hoặc email
    const currentUserId = realUserId || user?._id;
    
    // Xác định isMyMessage như trước đó
    const isMyMessage = (
      message.isMyMessage === true || 
      message.forceMyMessage === true || 
      message.isTemp === true || 
      (message.sender && message.sender._id === currentUserId) ||
      (realUserId && message.sender && message.sender._id === realUserId) ||
      (isCurrentUserIdEmail && isSenderIdObjectId && 
       (message.sender.username === currentUser._id || 
        message.sender.email === currentUser._id))
    );

    // Log thêm thông tin để debug
    console.log(`Message ${message._id?.substring(0, 8)} ownership check:`, {
      isMyMessage,
      senderId: message.sender?._id,
      currentId: currentUserId,
      realId: realUserId
    });

  
    // Xử lý các tin nhắn hệ thống
    if (message.type === 'NOTIFICATION' || 
        message.isNotification === true || 
        message.isSystemMessage === true) {
      return (
        <SystemNotificationMessage 
          key={message._id || `notification-${index}`}
          message={message}
        />
      );
    }
    
    // Kiểm tra nếu là tin nhắn vote
    if (message.type === 'VOTE') {
      // Đảm bảo message có cấu trúc hợp lệ trước khi render
      const enhancedMessage = {
        ...message,
        options: Array.isArray(message.options) ? message.options : []
      };
      
      return (
        <VoteMessage
          key={message._id || index}
          message={enhancedMessage} // Sử dụng tin nhắn đã được kiểm tra
          navigation={navigation}
          onViewVoteDetailModal={(options) => {
            // Xử lý hiển thị chi tiết bình chọn
            setMessageDetailProps({
              isVisible: true,
              message: message
            });
          }}
          userId={currentUserId}
          isMyMessage={isMyMessage}
          conversationId={conversationId}
          onPressEmoji={(messageId, emoji) => handleAddReaction(messageId, emoji)}
          handleShowReactDetails={(messageId) => handleShowReactDetails(messageId)}
          onPressDelete={(messageId) => handleDeleteMessage(messageId)}
          previewImage={handlePreviewImage}
          scrollToMessage={scrollToMessage}
          handleVoteOption={handleVoteOption}
        />
      );
    }
    
    // Các loại tin nhắn khác sử dụng ChatMessage
    return (
      <ChatMessage
        key={message._id || index}
        message={message}
        userId={currentUserId}
        isMyMessage={isMyMessage}
        navigation={navigation}
        conversationId={conversationId}
        onPressEmoji={(messageId, emoji) => handleAddReaction(messageId, emoji)}
        handleShowReactDetails={(messageId) => handleShowReactDetails(messageId)}
        onPressDelete={(messageId) => handleDeleteMessage(messageId)}
        onPressEdit={(messageContent, messageId) => handleEditMessage(messageContent, messageId)}
        previewImage={handlePreviewImage}
        onReply={(messageId) => handleOnReplyMessagePress(messageId)}
        onPressRecall={(messageId) => handleRecallMessage(messageId)}
      />
    );
  };

  // Fetch pinned messages for this conversation
  const fetchPinnedMessages = async () => {
    try {
      if (!actualIsGroupChat) {
        console.log('Skipping pinned messages for private chat');
        setPinnedMessages([]);
        return;
      }
      
      console.log('Fetching pinned messages for group conversation:', conversationId);
      const response = await pinMessagesApi.fetchPinMessages(conversationId);
      
      if (response && response.data) {
        const fetchedPinnedMessages = response.data;
        console.log('Pinned messages fetched:', fetchedPinnedMessages.length);

        // Tìm tin nhắn thông báo ghim cho mỗi tin nhắn được ghim
        const pinnedMessagesWithPinner = await Promise.all(fetchedPinnedMessages.map(async pinnedMsg => {
          try {
            // Lấy tất cả tin nhắn của cuộc trò chuyện để tìm tin nhắn thông báo
            const notificationsResponse = await conversationService.getMessages(
              conversationId,
              0,
              100,  // Lấy 100 tin nhắn gần nhất
              user?._id
            );

            let pinNotifications = [];
            if (notificationsResponse && notificationsResponse.data) {
              // Lọc tin nhắn thông báo ghim
              pinNotifications = notificationsResponse.data.filter(msg => 
                msg.type === 'NOTIFY' && 
                msg.content === 'PIN_MESSAGE' &&
                new Date(msg.createdAt) >= new Date(pinnedMsg.createdAt)
              );

              // Sắp xếp theo thời gian để lấy tin nhắn thông báo gần nhất
              pinNotifications.sort((a, b) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
            }

            // Lấy tin nhắn thông báo gần nhất
            const latestPinNotification = pinNotifications[0];

            console.log(`Found pin notification for message ${pinnedMsg._id}:`, 
              latestPinNotification ? {
                notificationId: latestPinNotification._id,
                pinnedBy: latestPinNotification.sender?.name || 'Unknown',
                pinnedByTime: latestPinNotification.createdAt
              } : 'No notification found'
            );

            // Nếu không tìm thấy tin nhắn thông báo, sử dụng thông tin từ tin nhắn được ghim
            const pinner = latestPinNotification?.sender || pinnedMsg.pinnedBy || {
              _id: pinnedMsg.userId || 'unknown',
              name: 'Người dùng'
            };

            return {
              ...pinnedMsg,
              pinnedBy: pinner,
              pinnedAt: latestPinNotification?.createdAt || pinnedMsg.updatedAt || pinnedMsg.createdAt
            };
          } catch (error) {
            console.error('Error processing pin notification for message:', pinnedMsg._id, error);
            return {
              ...pinnedMsg,
              pinnedBy: pinnedMsg.pinnedBy || { _id: 'unknown', name: 'Người dùng' },
              pinnedAt: pinnedMsg.updatedAt || pinnedMsg.createdAt
            };
          }
        }));
        
        setPinnedMessages(pinnedMessagesWithPinner);
        
        // Cập nhật danh sách tin nhắn chính
        if (pinnedMessagesWithPinner.length > 0) {
          setMessages(prevMessages => {
            return prevMessages.map(msg => {
              const pinnedMessage = pinnedMessagesWithPinner.find(pinnedMsg => pinnedMsg._id === msg._id);
              if (pinnedMessage) {
                return { 
                  ...msg, 
                  isPinned: true,
                  pinnedBy: pinnedMessage.pinnedBy,
                  pinnedAt: pinnedMessage.pinnedAt
                };
              }
              return msg;
            });
          });
        }
      } else {
        console.log('No pinned messages found or invalid response');
        setPinnedMessages([]);
      }
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
      setPinnedMessages([]);
    }
  };
  useFocusEffect(
    React.useCallback(() => {
      if (conversationId && messages.length > 0) {
        console.log('Screen focused, refreshing vote data');
        loadVoteDetails(); // Tải lại thông tin vote khi quay lại màn hình
      }
      return () => {};
    }, [conversationId, messages.length])
  );

  // Add effect to update header when conversationName changes
  useEffect(() => {
    if (conversationId && conversationName) {
      // Cập nhật lại header với tên mới
      const actualName = conversationName || 'Cuộc trò chuyện';
      const actualAvatar = typeof avatar === 'string' ? avatar : (Array.isArray(avatar) ? '' : avatar || '');
      const actualAvatarColor = avatarColor || colors.primary;
      const isGroupConversation = isGroupChat || route.params?.isGroup || actualIsGroupChat || false;
      
      console.log('Updating header with new name:', actualName);
      
      navigation.setOptions({
        headerShown: true,
        headerLeft: () => (
          <MessageHeaderLeft
            conversationName={actualName}
            avatar={actualAvatar}
            avatarColor={actualAvatarColor}
            isGroup={isGroupConversation}
            onBack={() => navigation.goBack()}
            onPress={() => handleGoToOptionScreen()}
          />
        ),
        headerTitle: () => null,
        headerRight: () => null,
      });
    }
  }, [conversationName, conversationId]);
  // Trong useEffect, khi nhận thông tin participants
// useEffect(() => {
//   if (participants && participants.length > 0) {
//     // Cache thông tin người dùng từ participants vào Redux
//     dispatch(bulkCacheNotificationUsers({ users: participants }));
//     console.log(`Cached ${participants.length} users for notifications to Redux`);
//   }
// }, [participants]);

  // Thêm hàm xử lý chấp nhận cuộc gọi
// Thêm hàm xử lý chấp nhận cuộc gọi
const handleAcceptCall = () => {
  // Đóng modal
  setIncomingCall(prev => ({ ...prev, visible: false }));
  
  // Điều hướng đến VideoCallScreen với tham số cho Agora
  navigation.navigate('VideoCallScreen', {
    conversationId,
    conversationName,
    participants,
    isGroup: actualIsGroupChat,
    isIncoming: true,
    caller: incomingCall.caller,
    effectiveUserId: realUserId || user?._id,
  });
  
  // Thông báo đã trả lời cuộc gọi
  socketService.notifyCallAnswered(
    conversationId, 
    realUserId || user?._id, 
    actualIsGroupChat
  );
  
  // Thêm thông báo trả lời cuộc gọi video
  socketService.notifyVideoCallAnswered(
    conversationId, 
    realUserId || user?._id, 
    actualIsGroupChat,
    realUserId || user?._id
  );
};

// Thêm hàm xử lý từ chối cuộc gọi
const handleRejectCall = () => {
  // Đóng modal
  setIncomingCall(prev => ({ ...prev, visible: false }));
};

// Thêm hàm khởi tạo cuộc gọi video
// Cập nhật hàm khởi tạo cuộc gọi video
const handleStartVideoCall = () => {
  // Đăng ký cuộc gọi video
  subscribeCallVideo(
    conversationId,
    currentUserId,
    user?.name ,
    user?.avatar || '',
    actualIsGroupChat

  );
  
  // Navigation vào màn hình video call
  navigation.navigate('VideoCallScreen', {
    conversationId,
    conversationName,
    participants,
    isGroup: actualIsGroupChat,
    isInitiator: true,
    effectiveUserId: currentUserId,
  });
};

// Thêm hàm khởi tạo cuộc gọi thoại
const handleStartVoiceCall = () => {
  // Đăng ký cuộc gọi thoại
  subscribeCallAudio(
    conversationId,
    currentUserId,
    user?.name || 'Người dùng',
    user?.avatar || ''
  );
  
  // Navigation vào màn hình voice call
  navigation.navigate('VoiceCallScreen', {
    conversationId,
    conversationName,
    participants,
    isGroup: actualIsGroupChat,
    isInitiator: true,
    effectiveUserId: currentUserId,
  });
};

  // Trong useEffect của MessageScreen, sau khi đã load tin nhắn
useEffect(() => {
  if (conversationId) {
    // Đánh dấu cuộc trò chuyện là đã đọc khi mở màn hình
    markConversationAsViewed(conversationId);
    
    // Gửi trạng thái đã đọc lên server
    const socket = getSocket();
    if (socket) {
      socket.emit('conversation-last-view', conversationId);
    }
  }
}, [conversationId]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{flex: 1}}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
          
          {/* Pinned Messages Section */}
          {pinnedMessages.length > 0 && (
            <PinnedMessage 
              pinnedMessages={pinnedMessages}
              onViewDetail={(options) => {
                setMessageDetailProps({
                  isVisible: true,
                  message: options.message
                });
              }}
              onViewImage={(options) => {
                setImageProps({
                  isVisible: options.isVisible,
                  imageUrl: options.content?.[0]?.url,
                  imageUrls: options.content?.map(item => item.url) || []
                });
              }}
              onUnpin={(messageId) => {
                // Cập nhật tin nhắn đã bỏ ghim trong danh sách
                setMessages(prevMessages => {
                  return prevMessages.map(msg => {
                    if (msg._id === messageId) {
                      return { ...msg, isPinned: false };
                    }
                    return msg;
                  });
                });
                
                // Cập nhật danh sách tin nhắn đã ghim
                setPinnedMessages(prevPinned => {
                  return prevPinned.filter(msg => msg._id !== messageId);
                });
              }}
            />
          )} 
          
          <FlatList
            ref={flatListRef}
            onEndReached={goToNextPage}
            data={[...messages]
              .filter(msg => !msg.isDeleted) // Lọc bỏ các tin nhắn đã xóa
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            }
            extraData={messages.length}
            // Sửa keyExtractor để đảm bảo tính duy nhất
            keyExtractor={(item, index) => `${item._id}-${index}`}
            renderItem={({item, index}) => renderMessage(item, index)}
            initialNumToRender={20}
            maxToRenderPerBatch={10}
            windowSize={15}
            removeClippedSubviews={false}
            ListHeaderComponent={() =>
              loading ? <MessageDivider isLoading={true} /> : null
            }
            inverted={false} // Không đảo ngược danh sách
            contentContainerStyle={{paddingBottom: 15}}
            // Thêm xử lý sự kiện scroll để sửa lỗi tin nhắn tự nhảy lên
            onScroll={handleScroll}
            scrollEventThrottle={16} // Hạn chế số lần gọi handleScroll để tăng hiệu suất
            // Cuộn xuống khi có thay đổi nội dung chỉ khi ở dưới cùng
            onContentSizeChange={(width, height) => {
              // Chỉ cuộn khi đang ở dưới cùng hoặc mới load tin nhắn
              if (isAtBottom || (!userScrolled && messages.length > 0)) {
                scrollToBottom(true);
              }
            }}
            onLayout={() => {
              // Khi lần đầu render hoàn tất
              if (!userScrolled && messages.length > 0) {
                // Use requestAnimationFrame to ensure we scroll after render is complete
                requestAnimationFrame(() => {
                  scrollToBottom(true, true);
                });
              }
            }}
            // Fix for the error with maintainVisibleContentPosition
            maintainVisibleContentPosition={{
              minIndexForVisible: 0
            }}
          />

          {typingUsers[conversationId]?.length > 0 && (
            <View style={styles.typingContainer}>
              <View style={styles.typingWrap}>
                <Text style={styles.typingText}>
                  {`${typingUsers[conversationId][0].name} đang nhập `}
                </Text>
                <AnimatedEllipsis style={styles.dot} />
              </View>
            </View>
          )}
          
          {/* Add back the MessageInput component */}
          <MessageInput 
            conversationId={conversationId}
            onSendMessage={handleSendMessage}
            onSendSticker={handleSendSticker}
            onSendFile={handleSendFileMessage}
            replyTo={replyMessage.isReply ? replyMessage.message : null}
            onCancelReply={() => setReplyMessage(DEFAULT_REPLY_MESSAGE)}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />

          {/* StickyBoard component */}
          {stickyBoardVisible && (
            <StickyBoard
              height={keyboardHeight || 250}
              visible={stickyBoardVisible}
              setVisible={(visible) => setStickyBoardVisible(visible)}
            />
          )}
          
          <ReactionModal
            reactProps={reactProps}
            setReactProps={setReactProps}
            handleAddReaction={handleAddReaction}
          />
          
          <ImagePickerModal
            modalVisible={imageModalVisible}
            setModalVisible={setImageModalVisible}
            conversationId={conversationId}
          />
          
          <MessageModal
            modalVisible={modalVisible}
            setModalVisible={setModalVisible}
            navigation={navigation}
            handleOnReplyMessagePress={handleOnReplyMessagePress}
            onDeleteMessage={handleDeleteMessage}
            onRecallMessage={handleRecallMessage}
          />
          
          {imageProps.isVisible && (
            <ViewImageModal
              imageProps={imageProps}
              setImageProps={setImageProps}
            />
          )}
          
          {messageDetailProps.isVisible && (
            <MessageDetailModal
              modalVisible={messageDetailProps}
              setModalVisible={setMessageDetailProps}
            />
          )}
          
          <IncomingCallModal
            visible={incomingCall.visible}
            caller={incomingCall.caller}
            conversationName={conversationName}
            onAccept={handleAcceptCall}
            onReject={handleRejectCall}
          />
          
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  typingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.padding,
    backgroundColor: colors.background,
  },
  typingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.text,
    marginLeft: 5,
  },
});

export default MessageScreen;