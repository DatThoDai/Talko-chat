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
import VoteMessage from '../components/message/VoteMessage';
import voteApi from '../api/voteApi';
import socketService from '../utils/socketService';
import pinMessagesApi from '../api/pinMessagesApi';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { REACTIONS } from '../constants/index';
import SystemNotificationMessage from '../components/message/SystemNotificationMessage';
import IncomingCallModal from '../components/modal/IncomingCallModal';

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

const MESSAGE_RECALL_TEXT = 'Tin nhắn đã được thu hồi';

const MessageScreen = ({navigation, route}) => {
  const {conversationId, conversationName: initialConversationName, participants, avatar, avatarColor, isGroupChat} = route.params || {};
  const {user} = useSelector((state) => state.auth);
  const {keyboardHeight} = useSelector((state) => state.global || {keyboardHeight: 0});

  useEffect(() => {
    console.log('MessageScreen route params:', route.params);
    console.log('isGroup from route:', route.params?.isGroup);
    console.log('isGroupChat from route:', isGroupChat);
  }, []);

  const actualIsGroupChat = isGroupChat || route.params?.isGroup || false;

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
  
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [userScrolled, setUserScrolled] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadingFile, setCurrentUploadingFile] = useState(null);

  const [realUserId, setRealUserId] = useState(null);

  const [incomingCall, setIncomingCall] = useState({
    visible: false,
    caller: null,
  });

  const dispatch = useDispatch(); 

  const flatListRef = useRef(null);

  const [processedMessageIds] = useState(new Set());

  const [conversationName, setConversationName] = useState(initialConversationName);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused && route.params?.conversationName !== conversationName) {
      setConversationName(route.params.conversationName);
    }
  }, [route.params?.conversationName, isFocused]);

  const currentUserId = realUserId || user?._id;

  const scrollToBottom = (animated = false, force = false) => {
    if (flatListRef.current && messages.length > 0) {
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
  
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    
    const atBottom = contentHeight <= layoutHeight || 
                   offsetY + layoutHeight >= contentHeight - 20;
                    
    setUserScrolled(true);
    
    if (atBottom) {
      setShouldAutoScroll(true);
      setIsAtBottom(true);
    } else {
      setShouldAutoScroll(false);
      setIsAtBottom(false);
    }
  };
  
  const handleRetryMessage = (failedMessage) => {
    if (!failedMessage || !failedMessage.isTemp) return;
    
    setMessages(prev => 
      prev.map(msg => msg._id === failedMessage._id ? {...msg, status: 'sending'} : msg)
    );
    
    const messageData = {
      conversationId,
      content: failedMessage.content,
      replyToId: failedMessage.replyToId,
      tempId: failedMessage._id
    };
    
    console.log('Gửi lại tin nhắn:', failedMessage.content);
    conversationService.sendTextMessage(messageData)
      .then(response => {
        console.log('Gửi lại tin nhắn thành công:', response);
        if (response && response.data) {
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
        setMessages(prev => 
          prev.map(msg => msg._id === failedMessage._id ? {...msg, status: 'failed'} : msg)
        );
      });
  };

  useEffect(() => {
    if (conversationId && user?._id) {
      initiateSocket(user?._id, conversationId);
      
      loadMessages();
      
      if (actualIsGroupChat) {
        console.log('Loading pinned messages for group chat');
        fetchPinnedMessages();
      } else {
        console.log('Skipping pinned messages for private chat');
        setPinnedMessages([]);
      }
      
      const handleMessageDeleted = (data) => {
        const messageId = data.messageId || data.id;
        
        console.log('Socket delete event received in MessageScreen:', messageId);
        if (messageId) {
          setMessages(prevMessages => 
            prevMessages.filter(msg => msg._id !== messageId)
          );
        }
      };
      
      const handleNewMessage = (msgConversationId, message) => {
        console.log('Socket new-message received:', message?._id, 'type:', message?.type);
        
        if (msgConversationId === conversationId) {
          setMessages(prevMessages => {
            if (processedMessageIds.has(message._id)) {
              console.log('Message already in processedIds, skipping:', message._id);
              return prevMessages;
            }
            
            const isOwnMessage = message.sender?._id === user?._id || 
                                message.sender?._id === realUserId;
            
const matchingTempMessage = prevMessages.find(msg => {
  if (message.type === 'TEXT' && msg.content === message.content) {
    return Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 30000;
  }
  
  if ((message.type === 'IMAGE' || message.type === 'FILE' || message.type === 'VIDEO') && 
      (msg.type === message.type)) {
    
    const msgUrl = msg.fileUrl || msg.url || msg.mediaUrl || '';
    const newMsgUrl = message.fileUrl || message.url || message.mediaUrl || '';
    
    const msgUrlEnd = msgUrl.split('/').pop();
    const newMsgUrlEnd = newMsgUrl.split('/').pop();
    
    console.log('File matching check:', {
      msgUrl: msgUrlEnd,
      newUrl: newMsgUrlEnd,
      match: msgUrlEnd === newMsgUrlEnd && msgUrlEnd !== ''
    });
    
    return (msgUrlEnd === newMsgUrlEnd && msgUrlEnd !== '') || 
           (Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 20000);
  }
  
  return false;
});
            
            if (matchingTempMessage) {
              console.log('Found matching temp message, skipping socket message');
              processedMessageIds.add(message._id);
              return prevMessages;
            }
            
            const exists = prevMessages.some(msg => {
              if (msg._id === message._id) return true;
            });
            
            if (exists) {
              console.log('Duplicate message detected, skipping:', message._id);
              return prevMessages;
            }
            
            let enhancedMessage = {...message};
            
            if (!enhancedMessage.sender || !enhancedMessage.sender._id || !enhancedMessage.sender.name) {
              const senderId = enhancedMessage.sender?._id || enhancedMessage.userId || enhancedMessage.user?._id;
  
  const senderInfo = participants?.find(p => p._id === senderId);
  
  if (senderInfo) {
    console.log(`Found sender info for ${senderId} in participants:`, senderInfo.name);
    enhancedMessage.sender = {
      _id: senderId,
      name: senderInfo.name || senderInfo.username || 'Người dùng',
      avatar: senderInfo.avatar || '',
      avatarColor: senderInfo.avatarColor || '#1194ff'
    };
  } else if (isOwnMessage) {
    enhancedMessage.sender = {
      _id: user._id,
      name: user.name || user.username || 'Bạn',
      avatar: user.avatar || '',
      avatarColor: user.avatarColor || '#1194ff'
    };
  } else if (senderId && senderId !== 'unknown') {
    enhancedMessage.sender = {
      _id: senderId,
      name: 'Đang tải...',
      avatar: '',
    };
    
    setTimeout(async () => {
      try {
        const userResponse = await userService.getUserById(senderId);
        
        if (userResponse && userResponse.data) {
          const userData = Array.isArray(userResponse.data) ? userResponse.data[0] : userResponse.data;
          
          if (userData) {
            console.log(`Found user info for ${senderId}:`, userData.name);
            
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
      
      const socketInstance = getSocket();
      if (socketInstance) {
        socketInstance.on('delete-message', handleMessageDeleted);
        socketInstance.on('message-deleted', handleMessageDeleted);
        socketInstance.on('new-message', handleNewMessage);
        
        // Chỉ lắng nghe sự kiện ghim/bỏ ghim nếu đây là nhóm trò chuyện
        if (actualIsGroupChat) {
          // Listen for pin-message events
          socketInstance.on('action-pin-message', (conversationId) => {
            console.log('Pin message event received for conversation:', conversationId);
            fetchPinnedMessages(); // Refresh pinned messages
          });
        }
      }
      
      const handleIncomingCall = async (data) => {
        console.log('Có người gọi vào với peerId:', data.peerId);
        
        if (data.conversationId !== conversationId) {
          console.log('Bỏ qua thông báo cuộc gọi từ đoạn chat khác:', data.conversationId);
          return;
        }
        
        if (data.newUserId !== user._id && data.newUserId !== realUserId) {
          let callerInfo = {
            _id: data.newUserId,
            name: 'Đang tải...',
            avatar: '',
            avatarColor: colors.primary
          };
          
          setIncomingCall({
            visible: true,
            caller: callerInfo,
            peerId: data.peerId,
            conversationId: data.conversationId
          });
          
          const participantInfo = participants?.find(p => p._id === data.newUserId);
          
          if (participantInfo) {
            callerInfo = {
              _id: data.newUserId,
              name: participantInfo.name || 'Người dùng',
              avatar: participantInfo.avatar || '',
              avatarColor: participantInfo.avatarColor || colors.primary
            };
            
            setIncomingCall(prev => ({
              ...prev,
              caller: callerInfo
            }));
          } else {
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
      
      socketService.on('incoming-video-call', (data) => {
        console.log('📹 INCOMING VIDEO CALL:', data);
        
        if (data.conversationId !== conversationId) {
          console.log('Bỏ qua thông báo cuộc gọi từ đoạn chat khác:', data.conversationId);
          return;
        }
        
        if (data.caller && data.caller.userId !== user._id && data.caller.userId !== realUserId) {
          let callerInfo = {
            _id: data.caller.userId,
            name: data.caller.name || 'Người gọi',
            avatar: data.caller.avatar || '',
            avatarColor: colors.primary
          };
          
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
            isGroup={isGroupConversation}
            onBack={() => navigation.goBack()}
            onPress={() => handleGoToOptionScreen()}
            onVideoCall={handleStartVideoCall}
          />
        ),
        headerTitle: () => null,
        headerRight: () => null,
      });
      
      // Setup socket event listener for group rename
      const handleRenameConversation = (conversationId, newName, message) => {
        console.log(`Conversation ${conversationId} renamed to ${newName}`);
        if (conversationId === route.params.conversationId) {
          setConversationName(newName);
          
          navigation.setParams({ conversationName: newName });
          
          if (message) {
            const newNotifyMessage = {
              ...message,
              isTemp: false,
              status: 'sent'
            };
            
            setMessages(prevMessages => {
              if (!prevMessages.some(msg => msg._id === message._id)) {
                return [newNotifyMessage, ...prevMessages];
              }
              return prevMessages;
            });
          }
        }
      };
      
      const socket = getSocket();
      if (socket) {
        socket.on('rename-conversation', handleRenameConversation);
      }
      
      return () => {
        if (socketInstance) {
          socketInstance.off('delete-message', handleMessageDeleted);
          socketInstance.off('message-deleted', handleMessageDeleted);
          socketInstance.off('new-message', handleNewMessage);
          
          if (actualIsGroupChat) {
            socketInstance.off('action-pin-message');
          }
        }
        
        if (conversationId) {
          console.log('Leaving conversation:', conversationId);
          leaveConversation(conversationId);
        }
        
        if (socket) {
          socket.off('rename-conversation', handleRenameConversation);
        }
        
        socketService.off('new-user-call', handleIncomingCall);
        socketService.off('incoming-video-call');
      };
    }
  }, [conversationId, user?._id, route.params.conversationId]);

  useEffect(() => {
    const fetchRealUserId = async () => {
      if (user && user._id && user._id.includes('@')) {
        try {
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

  const handleGoToOptionScreen = () => {
    const isGroup = isGroupChat || route.params?.isGroup || actualIsGroupChat || false;
    
    console.log('Navigating to options with params:', {
      conversationId,
      name: conversationName,
      avatar: avatar,
      isGroupChat: isGroup
    });
    
    navigation.navigate('ConversationOptionsScreen', {
      conversationId,
      name: conversationName,
      avatar: typeof avatar === 'string' ? avatar : (Array.isArray(avatar) ? '' : avatar || ''),
      avatarColor,
      isGroupChat: isGroup,
      type: isGroup ? 'group' : 'private'
    });
  };

  const handleOnReplyMessagePress = messageParam => {
    console.log('handleOnReplyMessagePress called with param type:', typeof messageParam);
    
    if (typeof messageParam === 'object' && messageParam !== null && messageParam._id) {
      console.log('Message object passed directly:', messageParam._id);
      
      const existingMessage = messages.find(msg => msg._id === messageParam._id);
      
      const finalMessage = existingMessage || messageParam;
      
      console.log('Setting reply message with content:', finalMessage.content?.substring(0, 20));
      setReplyMessage({
        isReply: true,
        message: finalMessage,
      });
      console.log('Reply message set from object, isReply:', true);
    } 
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
        console.log('Reply message set from ID, isReply:', true);
      } else {
        console.error('Could not find message with ID:', messageId);
      }
    }
  };

  const loadMessages = async (refresh = false) => {
    if (loading && !refresh) return;
    
    try {
      setLoading(true);
      
      if (refresh) {
        setPage(0);
        setMessages([]);
      }
      
      const currentUserId = user?._id;
      
      console.log(`Loading messages for conversation ${conversationId}, page ${page}, size ${DEFAULT_PAGE_SIZE}`);
      const response = await conversationService.getMessages(
        conversationId,
        page,
        DEFAULT_PAGE_SIZE,
        currentUserId
      );
      
      if (response && response.data) {
        let messageData = response.data.map(msg => {
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
          setMessages(messageData);
        } else if (Array.isArray(messages)) {
          setMessages(prevMessages => [...prevMessages, ...messageData]);
        } else {
          console.warn('Current messages is not an array, resetting to new data');
          setMessages(messageData);
        }
        
        const hasMore = Array.isArray(messageData) && messageData.length === DEFAULT_PAGE_SIZE;
        setHasMoreMessages(hasMore);
        setPage(page + 1);
        
        if (page === 0) {
          setTimeout(() => {
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

const loadVoteDetails = async () => {
  try {
    const voteMessages = messages.filter(msg => msg.type === 'VOTE');
    
    if (voteMessages.length === 0) return;
    
    console.log(`Loading details for ${voteMessages.length} vote messages`);
    
    const response = await voteApi.getVotesByConversationId(conversationId);
    
    console.log('Vote API response structure:', 
      response ? 
      `data: ${typeof response.data}, isArray: ${Array.isArray(response.data)}` : 
      'undefined');
    
    let voteDetailsArray = [];
    
    if (response && response.data) {
      if (Array.isArray(response.data)) {
        voteDetailsArray = response.data;
      }
      else if (response.data.data && Array.isArray(response.data.data)) {
        voteDetailsArray = response.data.data;
      }
      else if (typeof response.data === 'object' && response.data._id) {
        voteDetailsArray = [response.data];
      }
      
      console.log('Vote details processed:', voteDetailsArray.length || 0);
      
      if (voteDetailsArray.length > 0) {
        setMessages(prevMessages => 
          prevMessages.map(msg => {
            if (msg.type === 'VOTE') {
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

  const goToNextPage = () => {
    if (loading || !hasMoreMessages) return;
    
    console.log('Loading older messages...');
    const nextPage = page + 1;
    loadMessages();
  };

  const handleShowLastView = async messageId => {
    try {
      const response = await conversationService.getLastViewers(conversationId, messageId);
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching last viewers:', error);
    }
  };

  const handleSendMessage = async (content) => {
    if (!content || !content.trim()) return;

    try {
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
          _id: user?._id,
          name: user?.name || user?.username || 'Bạn',
          avatar: user?.avatar || ''
        },
        isTemp: true,
        isMyMessage: true,
        forceMyMessage: true,
        status: 'sending',
      };

      if (replyMessage.isReply && replyMessage.message) {
        tempMessage.replyToMessage = replyMessage.message;
        tempMessage.replyToId = replyMessage.message._id;
      }
      
      setMessages((prevMessages) => [...prevMessages, tempMessage]);
      
      if (replyMessage.isReply) {
        setReplyMessage(DEFAULT_REPLY_MESSAGE);
      }
      
      setTimeout(() => scrollToBottom(), 50);
      
      const messageData = {
        conversationId: conversationId,
        content: content.trim(),
        type: 'TEXT',
        tempId: tempId,
        replyToId: replyMessage.isReply ? replyMessage.message._id : null,
      };
      
      console.log(`Sending message (tempId: ${tempId}):`, content.trim());
      const response = await conversationService.sendTextMessage(messageData);
      
      if (response && response.data) {
        processedMessageIds.add(response.data._id);
        
        const messageKey = `${user._id}-${content.trim()}`;
        processedMessageIds.add(messageKey);
        
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
        
        if (responseData.replyMessage && 
            responseData.replyMessage._id && 
            typeof responseData.replyMessage._id === 'string' && 
            !responseData.replyToMessage) {
          console.log('Converting server replyMessage to replyToMessage:', responseData.replyMessage);
          responseData.replyToMessage = {
            ...responseData.replyMessage,
            sender: responseData.replyMessage.user || { 
              _id: responseData.replyMessage.userId,
              name: 'Người dùng',
            }
          };
        }
        else if (tempMessage.replyToMessage && 
                tempMessage.replyToMessage._id && 
                typeof tempMessage.replyToMessage._id === 'string') {
          responseData.replyToMessage = tempMessage.replyToMessage;
        }
        
        setMessages((prevMessages) => 
          prevMessages.map((msg) => 
            msg._id === tempId ? responseData : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prevMessages) => 
        prevMessages.map((msg) => 
          msg._id === tempId ? { ...msg, status: 'failed' } : msg
        )
      );
      
      const retryHandler = () => {
        setMessages((prevMessages) => 
          prevMessages.map((msg) => 
            msg._id === tempId ? { ...msg, status: 'retrying' } : msg
          )
        );
        
        conversationService.sendTextMessage(messageData)
          .then(response => {
            if (response && response.data) {
              const responseData = response.data;
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

const handleSendFileMessage = async (file) => {
  if (!file) return;
  
  const tempId = `temp-file-${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${user?._id?.substring(0, 8) || ''}`;
  
  try {
    setIsUploading(true);
    setUploadProgress(0);
    setCurrentUploadingFile(file);
    
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
      fileUrl: file.uri,
      isTemp: true,
      status: 'uploading',
      uploadProgress: 0,
      isMyMessage: true,
      forceMyMessage: true,
    };
    
    setMessages(prevMessages => [...prevMessages, tempMessage]);
    
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
    
    const messageApiModule = await import('../api/messageApi');
    const { messageApi } = messageApiModule;
    
    console.log('Sending file with conversation ID:', conversationId);
    
    const response = await messageApi.sendFileMessage({
      file,
      conversationId,
      type: fileType
    }, updateProgress);
    
    console.log('Response received:', response);
    
    if (response && response.data) {
      processedMessageIds.add(response.data._id);
      
      const fileUrl = response.data.fileUrl || response.data.url || response.data.mediaUrl;
      if (fileUrl) {
        processedMessageIds.add(fileUrl);
      }
      
      setTimeout(() => {
        processedMessageIds.delete(response.data._id);
        if (fileUrl) processedMessageIds.delete(fileUrl);
      }, 30000);
      
      console.log('File response from server:', response.data);
      
      const updatedMessage = {
        ...response.data,
        type: fileType || 'IMAGE',
        fileUrl: response.data.fileUrl || response.data.url || response.data.mediaUrl || file.uri,
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

  const handleDeleteMessage = async (messageId) => {
    try {
      console.log('Deleting message client side:', messageId);
      
      await messageApi.deleteMessage(messageId);
      
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg._id !== messageId)
      );
      
      setModalVisible(DEFAULT_MESSAGE_MODAL_VISIBLE);
      
      Alert.alert('Thành công', 'Tin nhắn đã được xóa');
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Lỗi', 'Không thể xóa tin nhắn. Vui lòng thử lại sau.');
    }
  };
  
  const handleRecallMessage = async (messageId) => {
    try {
      const messageToRecall = messages.find(msg => msg._id === messageId);
      if (!messageToRecall) {
        console.error('Message not found for recall:', messageId);
        return;
      }
      
      const updatedMessages = messages.map(msg => {
        if (msg._id === messageId) {
          return {
            ...msg,
            content: MESSAGE_RECALL_TEXT,
            status: 'recalled',
            isRecalled: true,
            isDeleted: false
          };
        }
        return msg;
      });
      
      setMessages(updatedMessages);
      
      await messageApi.recallMessage(messageId);
      console.log('Message recalled successfully:', messageId);
      
      setModalVisible(DEFAULT_MESSAGE_MODAL_VISIBLE);
    } catch (error) {
      console.error('Error recalling message:', error);
      Alert.alert('Lỗi', 'Không thể thu hồi tin nhắn. Vui lòng thử lại sau.');
    }
  };

  const handleAddReaction = async (messageId, type) => {
    try {
      let reactionNumber;
      if (typeof type === 'string') {
        const index = REACTIONS.findIndex(emoji => emoji === type);
        reactionNumber = index !== -1 ? index + 1 : 1;
        console.log(`Converting emoji ${type} to reaction number ${reactionNumber}`);
      } else {
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
      
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg._id === messageId) {
            const reactions = msg.reactions || [];
            const existingIndex = reactions.findIndex(
              r => r.userId === user._id && r.type === type
            );
            
            let updatedReactions;
            if (existingIndex >= 0) {
              updatedReactions = [...reactions];
              updatedReactions.splice(existingIndex, 1);
            } else {
              updatedReactions = [...reactions, optimisticReaction];
            }
            
            return { ...msg, reactions: updatedReactions };
          }
          return msg;
        })
      );
      
      await messageApi.addReaction(messageId, reactionNumber);
      
      setReactProps(DEFAULT_REACTION_MODAL_VISIBLE);
    } catch (error) {
      console.error('Error adding reaction:', error);
      Alert.alert('Lỗi', 'Không thể thêm biểu cảm. Vui lòng thử lại sau.');
    }
  };

  const handlePreviewImage = (imageUrl, allUrls = []) => {
    if (!imageUrl) {
      console.warn('Attempted to preview image with empty URL');
      return;
    }
    
    setImageProps({
      isVisible: true,
      imageUrl: imageUrl,
      imageUrls: allUrls.length > 0 ? allUrls : [imageUrl]
    });
    
    console.log('Previewing image:', imageUrl);
  };

  const scrollToMessage = (messageId) => {
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

const handleVoteOption = async (voteId, optionName, isChecked) => {
  try {
    if (isChecked) {
      await voteApi.selectOption(voteId, { options: [optionName] });
    } else {
      await voteApi.deleteSelectOption(voteId, { options: [optionName] });
    }
    
    loadMessages(true);
  } catch (error) {
    console.error('Error voting:', error);
    Alert.alert('Lỗi', 'Không thể bình chọn. Vui lòng thử lại sau.');
  }
};

  const renderMessage = (message, index) => {
    if (!message) return null;
    if (message.sender && !message.sender.name) {
      const sender = participants?.find(p => p._id === message.sender._id);
      if (sender) {
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
        message = {
          ...message,
          sender: {
            ...message.sender,
            name: message.sender._id.substring(0, 8) + '...',
          }
        };
      }
    }
    
    const currentUser = user || {};
    
    const isCurrentUserIdEmail = currentUser._id && 
        (currentUser._id.includes('@') || currentUser._id.length > 30);
    
    const isSenderIdObjectId = message.sender && message.sender._id && 
        !message.sender._id.includes('@') && message.sender._id.length < 30;
    
    const currentUserId = realUserId || user?._id;
    
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

    console.log(`Message ${message._id?.substring(0, 8)} ownership check:`, {
      isMyMessage,
      senderId: message.sender?._id,
      currentId: currentUserId,
      realId: realUserId
    });

  
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
    
    if (message.type === 'VOTE') {
      const enhancedMessage = {
        ...message,
        options: Array.isArray(message.options) ? message.options : []
      };
      
      return (
        <VoteMessage
          key={message._id || index}
          message={enhancedMessage}
          navigation={navigation}
          onViewVoteDetailModal={(options) => {
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

        const pinnedMessagesWithPinner = await Promise.all(fetchedPinnedMessages.map(async pinnedMsg => {
          try {
            const notificationsResponse = await conversationService.getMessages(
              conversationId,
              0,
              100,
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
        loadVoteDetails();
      }
      return () => {};
    }, [conversationId, messages.length])
  );

  useEffect(() => {
    if (conversationId && conversationName) {
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

const handleAcceptCall = () => {
  setIncomingCall(prev => ({ ...prev, visible: false }));
  
  navigation.navigate('VideoCallScreen', {
    conversationId,
    conversationName,
    participants,
    isGroup: actualIsGroupChat,
    isIncoming: true,
    caller: incomingCall.caller,
    effectiveUserId: realUserId || user?._id,
  });
  
  socketService.notifyCallAnswered(
    conversationId, 
    realUserId || user?._id, 
    actualIsGroupChat
  );
  
  socketService.notifyVideoCallAnswered(
    conversationId, 
    realUserId || user?._id, 
    actualIsGroupChat,
    realUserId || user?._id
  );
};

const handleRejectCall = () => {
  setIncomingCall(prev => ({ ...prev, visible: false }));
};

const handleStartVideoCall = () => {
  subscribeCallVideo(
    conversationId,
    currentUserId,
    user?.name ,
    user?.avatar || '',
    actualIsGroupChat
  );
  
  navigation.navigate('VideoCallScreen', {
    conversationId,
    conversationName,
    participants,
    isGroup: actualIsGroupChat,
    isInitiator: true,
    effectiveUserId: currentUserId,
  });
};

const handleStartVoiceCall = () => {
  subscribeCallAudio(
    conversationId,
    currentUserId,
    user?.name || 'Người dùng',
    user?.avatar || ''
  );
  
  navigation.navigate('VoiceCallScreen', {
    conversationId,
    conversationName,
    participants,
    isGroup: actualIsGroupChat,
    isInitiator: true,
    effectiveUserId: currentUserId,
  });
};

useEffect(() => {
  if (conversationId) {
    markConversationAsViewed(conversationId);
    
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
            keyExtractor={(item, index) => `${item._id}-${index}`}
            renderItem={({item, index}) => renderMessage(item, index)}
            initialNumToRender={20}
            maxToRenderPerBatch={10}
            windowSize={15}
            removeClippedSubviews={false}
            ListHeaderComponent={() =>
              loading ? <MessageDivider isLoading={true} /> : null
            }
            inverted={false}
            contentContainerStyle={{paddingBottom: 15}}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={(width, height) => {
              if (isAtBottom || (!userScrolled && messages.length > 0)) {
                scrollToBottom(true);
              }
            }}
            onLayout={() => {
              if (!userScrolled && messages.length > 0) {
                requestAnimationFrame(() => {
                  scrollToBottom(true, true);
                });
              }
            }}
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
          
          <MessageInput 
            conversationId={conversationId}
            onSendMessage={handleSendMessage}
            onSendFile={handleSendFileMessage}
            replyTo={replyMessage.isReply ? replyMessage.message : null}
            onCancelReply={() => setReplyMessage(DEFAULT_REPLY_MESSAGE)}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />

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