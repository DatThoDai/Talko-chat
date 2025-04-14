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
} from '../utils/socketService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch} from 'react-redux';
import {addNewMessage, updateMessage} from '../redux/chatSlice';
import { conversationApi, conversationService } from '../api';
import userUtils from '../utils/userUtils';
import { userService } from '../api/userService';

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

const MessageScreen = ({navigation, route}) => {
  // Props and Redux state
  const {conversationId, conversationName, participants, avatar, avatarColor, isGroupChat} = route.params || {};
  const {user} = useSelector((state) => state.auth);
  const {keyboardHeight} = useSelector((state) => state.global || {keyboardHeight: 0});

  // State variables
  const [page, setPage] = useState(DEFAULT_PAGE);
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

  // References
  const flatListRef = useRef(null);

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
      
      // Prepare header data
      const actualName = route.params?.name || route.params?.conversationName || conversationName || 'Cuộc trò chuyện';
      const actualAvatar = route.params?.avatar || avatar;
      const actualAvatarColor = route.params?.avatarColor || avatarColor || '#1982FC';
      
      console.log('Setting conversation header with:', {
        name: actualName,
        avatar: actualAvatar?.substring(0, 30) + '...',
        avatarColor: actualAvatarColor
      });
      
      // Set navigation options with custom header
      navigation.setOptions({
        headerShown: true,
        headerLeft: () => (
          <MessageHeaderLeft
            conversationName={actualName}
            avatar={actualAvatar}
            avatarColor={actualAvatarColor}
            onBack={() => {
              console.log("Back button pressed");
              navigation.goBack();
            }}
            onPress={() => {
              console.log("Header pressed, go to options");
              handleGoToOptionScreen();
            }}
          />
        ),
        headerTitle: () => null,
        headerRight: () => null,
      });
    }
    
    // Cleanup socket when unmounting
    return () => {
      disconnectSocket();
    };
  }, [conversationId, user?._id, conversationName]);

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
      // Kiểm tra xem có thể quay lại được không
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        // Nếu không thể quay lại, chỉ đơn giản quay trở về
        // Không cần sử dụng reset vì có thể gây ra lỗi nếu 'Home' không tồn tại
        console.log('Cannot go back, already at the root navigator');
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
    return true;
  };

  // Handle navigation to conversation details
  const handleGoToOptionScreen = () => {
    navigation.navigate('ConversationDetails', {
      conversationId,
      conversationName,
      avatar,
      avatarColor,
      isGroupChat,
    });
  };

  // Handle reply to message
  const handleOnReplyMessagePress = messageId => {
    const messageToReply = messages.find(msg => msg._id === messageId);
    if (messageToReply) {
      setReplyMessage({
        isReply: true,
        message: messageToReply,
      });
    }
  };

  // Load messages with improved scrolling
  const loadMessages = async (refresh = false) => {
    console.log('LOADING MESSAGES, refresh=', refresh);
    setLoading(true);
    const newPage = refresh ? 0 : page;
    try {
      // Truyền thêm ID người dùng hiện tại để phân biệt tin nhắn của mình
      const myUserId = user?._id || route.params?.currentUserId || route.params?.userId;
      const response = await conversationService.getMessages(conversationId, newPage, DEFAULT_PAGE_SIZE, myUserId);
      
      // Đảm bảo response.data là một mảng
      let messageData = Array.isArray(response.data) ? response.data : [];
      
      console.log(`Received ${messageData.length} messages from API`);
      
      // Chuẩn hóa định dạng tin nhắn theo cấu trúc của ChatMessage component
      messageData = messageData.map(message => {
        // Nếu message đã đúng định dạng, sử dụng nguyên
        if (message && typeof message === 'object') {
          // Kết hợp dữ liệu thô với cấu trúc mặc định để tránh lỗi undefined
          return {
            // Đảm bảo các trường bắt buộc luôn tồn tại
            _id: message._id || message.id || `temp-${Date.now()}-${Math.random()}`,
            content: message.content || '',
            type: message.type || 'TEXT',
            createdAt: message.createdAt || new Date().toISOString(),
            sender: message.sender || { _id: 'unknown', name: 'Unknown User' },
            isDeleted: message.isDeleted || false,
            reactions: message.reactions || [],
            // Thêm trường để xác định tin nhắn của mình
            isMyMessage: userUtils.isMatchingUser(user, message.sender) || 
                       userUtils.isMatchingUser(user, message.userId) ||
                       (message.isMyMessage === true),
            // Giữ nguyên các trường khác nếu có
            ...message
          };
        }
        // Trường hợp message không phải object, tạo một object chuẩn
        return {
          _id: `temp-${Date.now()}-${Math.random()}`,
          content: 'Tin nhắn không hợp lệ',
          type: 'TEXT',
          createdAt: new Date().toISOString(),
          sender: { _id: 'unknown', name: 'Unknown User' },
          isDeleted: false,
          reactions: []
        };
      });
      
      // Log thông tin về tin nhắn đã chuẩn hóa
      console.log(`Standardized ${messageData.length} messages`);
      
      // Sắp xếp tin nhắn theo thời gian tăng dần (cũ đến mới) - đảm bảo tin nhắn cũ ở trên, tin nhắn mới ở dưới
      messageData = messageData.sort((a, b) => {
        return new Date(a.createdAt) - new Date(b.createdAt);
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
      setPage(newPage + 1); // Tăng page lên 1 để lần sau load tin nhắn tiếp theo
      
      // Force scroll to bottom on initial load only
      if (newPage === 0) {
        // Use a slightly longer delay to ensure rendering is complete
        setTimeout(() => {
          // Reset user scroll state since this is a fresh load
          setUserScrolled(false);
          setShouldAutoScroll(true);
          scrollToBottom(true, true);
        }, 500);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Lỗi', 'Không thể tải tin nhắn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
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
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
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
        sender: currentUserInfo,
        isTemp: true,
        isMyMessage: true, // Mark as the user's message explicitly
        forceMyMessage: true, // Always set this flag for messages from current user
        status: 'sending', // Keep existing status property
      };
      
      // Add temporary message to the messages list for immediate display
      setMessages((prevMessages) => [tempMessage, ...prevMessages]);
      
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
        // Replace the temporary message with the real one from the server
        const responseData = response.data;
        
        // Preserve our user display name for consistency
        if (responseData.sender) {
          responseData.sender = {
            ...responseData.sender,
            name: currentUserInfo.name, // Keep our display name from currentUserInfo
          };
        } else {
          responseData.sender = currentUserInfo;
        }
        
        // Always mark as our message for proper display
        responseData.isMyMessage = true;
        responseData.forceMyMessage = true;
        
        setMessages((prevMessages) => 
          prevMessages.map((msg) => 
            msg._id === tempId ? { 
              ...responseData,
              status: 'sent',
              forceMyMessage: true,
            } : msg
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

  // Handle send file message with progress tracking
  const handleSendFileMessage = async (file) => {
    if (!file) return;
    
    try {
      // Start tracking upload progress
      setIsUploading(true);
      setUploadProgress(0);
      setCurrentUploadingFile(file);
      
      // Tạo ID tạm thời cho tin nhắn file
      const tempId = `temp-file-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Xác định loại file
      let fileType = 'FILE';
      if (file.isImage) {
        fileType = 'IMAGE';
      } else if (file.type && file.type.includes('video')) {
        fileType = 'VIDEO';
      }
      
      // Tạo tin nhắn tạm thời
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
        fileUrl: file.uri, // URI tạm thời cho preview
        isTemp: true,
        status: 'uploading',
        uploadProgress: 0,
      };
      
      // Cập nhật danh sách tin nhắn với tin nhắn tạm thời
      setMessages(prevMessages => [...prevMessages, tempMessage]);
      
      // Cuộn xuống dưới cùng
      setTimeout(() => scrollToBottom(true, true), 50);
      
      // Tạo FormData để upload
      const formData = new FormData();
      formData.append('conversationId', conversationId);
      formData.append('file', {
        uri: file.uri,
        name: file.name || `file.${file.uri.split('.').pop()}`,
        type: file.type || 'application/octet-stream',
      });
      formData.append('tempId', tempId);
      
      // Cấu trúc info cho attachment
      const attachInfo = {
        type: fileType,
        conversationId,
        tempId,
      };
      
      // Upload file với progress tracking
      try {
        // Lưu ý: Nếu backend chưa hoàn thiện, chúng ta sẽ giả lập response
        // Dựa vào memory, biết rằng các endpoint API liên quan đến chat chưa có
        const updateProgress = (progress) => {
          // Cập nhật tiến trình upload
          setUploadProgress(progress);
          
          // Cập nhật tin nhắn với tiến trình hiện tại
          setMessages(prev => 
            prev.map(msg => 
              msg._id === tempId 
                ? {...msg, uploadProgress: progress} 
                : msg
            )
          );
        };
        
        // Simulate upload progress (mô phỏng tiến trình upload)
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          if (progress <= 100) {
            updateProgress(progress);
          } else {
            clearInterval(interval);
          }
        }, 300);
        
        // Giả lập API call thành công sau 3 giây
        setTimeout(() => {
          clearInterval(interval);
          
          // Tạo một response giả lập
          const mockResponse = {
            success: true,
            message: 'File uploaded successfully',
            data: {
              _id: `server-${tempId}`,
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
              fileUrl: file.uri, // Trong thực tế, đây sẽ là URL từ server
              status: 'sent',
            }
          };
          
          // Cập nhật tin nhắn tạm thời với dữ liệu từ "server"
          setMessages(prev => 
            prev.map(msg => 
              msg._id === tempId
                ? {...mockResponse.data, isTemp: false} 
                : msg
            )
          );
          
          // Reset upload state
          setIsUploading(false);
          setUploadProgress(0);
          setCurrentUploadingFile(null);
          
          console.log('Upload file thành công (mô phỏng):', mockResponse);
        }, 3000);
        
        // Lưu ý: Trong thực tế, chúng ta sẽ gọi API thật
        // const response = await conversationService.uploadFile(formData, updateProgress);
        // console.log('Upload file thành công:', response);
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError);
        
        // Đánh dấu tin nhắn là thất bại
        setMessages(prev => 
          prev.map(msg => 
            msg._id === tempId 
              ? {...msg, status: 'failed'} 
              : msg
          )
        );
        
        // Thông báo lỗi
        Alert.alert('Lỗi', 'Không thể tải file lên. Vui lòng thử lại sau.');
      }
      
      // Tự động cuộn đến tin nhắn mới nhất (phần dưới cùng) sau khi gửi tin nhắn
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    } catch (error) {
      console.error('Error sending file message:', error);
      Alert.alert('Lỗi', 'Không thể gửi tập tin. Vui lòng thử lại sau.');
    }
  };

  // Handle delete message
  const handleDeleteMessage = async (messageId) => {
    try {
      await conversationService.redoMessage(messageId);
      
      // Update local messages list
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === messageId 
            ? { ...msg, isDeleted: true, content: 'Tin nhắn đã bị xóa' } 
            : msg
        )
      );
      
      // Close modal
      setModalVisible(DEFAULT_MESSAGE_MODAL_VISIBLE);
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Lỗi', 'Không thể xóa tin nhắn. Vui lòng thử lại sau.');
    }
  };

  // Handle add reaction
  const handleAddReaction = async (messageId, type) => {
    try {
      await conversationService.dropReaction(messageId, type);
      
      // Update local messages list
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg._id === messageId) {
            // Check if user already reacted with this type
            const existingReactionIndex = msg.reactions?.findIndex(
              r => r.userId === user._id && r.type === type
            );
            
            let updatedReactions = [...(msg.reactions || [])];
            
            if (existingReactionIndex >= 0) {
              // Remove existing reaction
              updatedReactions.splice(existingReactionIndex, 1);
            } else {
              // Add new reaction
              updatedReactions.push({ 
                userId: user._id, 
                type,
                createdAt: new Date().toISOString()
              });
            }
            
            return { ...msg, reactions: updatedReactions };
          }
          return msg;
        })
      );
      
      // Close reaction modal
      setReactProps(DEFAULT_REACTION_MODAL_VISIBLE);
    } catch (error) {
      console.error('Error adding reaction:', error);
      Alert.alert('Lỗi', 'Không thể thêm biểu cảm. Vui lòng thử lại sau.');
    }
  };

  // Render message item
  const renderMessage = (message, index) => {
    // Đảm bảo tin nhắn hợp lệ
    if (!message) return null;
    
    // Lấy ID của người dùng hiện tại
    const currentUser = user || {};
    
    // Kiểm tra xem ID người dùng là ObjectID hay email
    const isCurrentUserIdEmail = currentUser._id && 
        (currentUser._id.includes('@') || currentUser._id.length > 30);
    
    // Kiểm tra xem message.sender._id có phải là ObjectID không
    const isSenderIdObjectId = message.sender && message.sender._id && 
        !message.sender._id.includes('@') && message.sender._id.length < 30;
    
    // Xác định isMyMessage dựa trên ID hoặc email
    let isMyMessage = false;
    
    if (message.isMyMessage || message.forceMyMessage || message.isTemp) {
      isMyMessage = true;
    }
    // Nếu ID người dùng là email nhưng ID người gửi là ObjectID
    else if (isCurrentUserIdEmail && isSenderIdObjectId) {
      // So sánh username hoặc email thay vì ID
      isMyMessage = message.sender.username === currentUser._id || 
                    message.sender.email === currentUser._id;
    } 
    // Trường hợp bình thường, so sánh ID
    else {
      isMyMessage = message.sender && message.sender._id === currentUser._id;
    }
    
    // Lấy ID chính xác để so sánh
    const currentUserId = realUserId || user?._id;
    
    // Xác định isMyMessage như trước đó
    isMyMessage = false;
    
    if (message.isMyMessage || message.forceMyMessage || message.isTemp) {
      isMyMessage = true;
    } else if (message.sender && message.sender._id === currentUserId) {
      isMyMessage = true;
    } else if (realUserId && message.sender && message.sender._id === realUserId) {
      isMyMessage = true;
    }
    
    return (
      <ChatMessage
        key={message._id || index}
        message={message}
        userId={currentUserId} // Sử dụng userId đã fetch từ API
        isMyMessage={isMyMessage} // Truyền giá trị đã xác định
        // Các props khác...
      />
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          style={{flex: 1}}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
            
          {/* Xử lý an toàn khi gọi getPinnedMessages */}
          {(() => {
            // Tạo biến để chỉ gọi API một lần
            let pinnedMessages = [];
            try {
              // Sử dụng conversationApi thay vì conversationService
              pinnedMessages = conversationApi.getPinnedMessages(conversationId) || [];
            } catch (error) {
              console.error('Error getting pinned messages:', error);
              pinnedMessages = [];
            }
            
            // Chỉ hiển thị PinnedMessage khi có tin nhắn ghim
            return pinnedMessages.length > 0 ? (
              <PinnedMessage
                pinnedMessages={pinnedMessages}
                onViewDetail={setMessageDetailProps}
                onViewImage={setImageProps}
              />
            ) : null;
          })()} 
          
          <FlatList
            ref={flatListRef}
            onEndReached={goToNextPage}
            // Sắp xếp tin nhắn theo thời gian (mới nhất ở dưới)
            data={[...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))}
            keyExtractor={item => String(item._id) + '-' + String(Math.random()).substring(2, 8)}
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