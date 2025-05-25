import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addNewMessage,
  updateMessage,
  removeMessage,
  setTypingUsers,
  updateUserOnlineStatus,
  updateMessages,
  setListLastViewer,
} from '../redux/chatSlice';
import notificationService from '../utils/notificationService';

// Thêm vào đầu file socketService.js:
let flag = true; // Thêm biến flag

// Khai báo biến để lưu store sau này
let storeInstance = null;

// Hàm đăng ký store để tránh vòng lặp import
export const registerStore = (store) => {
  storeInstance = store;
};

// Gán cứng URL trực tiếp thay vì dùng constants để đảm bảo kết nối socket đúng
// import { REACT_APP_SOCKET_URL } from '../constants';

// Sử dụng trực tiếp địa chỉ IP của người dùng
let SOCKET_URL = 'http://192.168.101.14:3001';
let MAX_RECONNECT_ATTEMPTS = 10;
let RECONNECT_DELAY = 3000; // 3 seconds
let MAX_RECONNECT_DELAY = 30000; // 30 seconds

console.log('Socket URL configured as:', SOCKET_URL);

let socket;
let reconnectAttempts = 0;
let reconnectTimer;
let isConnecting = false;

// Initialize socket connection
export const initiateSocket = async (userId, conversationId) => {
  if (socket && socket.connected) {
    // If already connected, join the conversation
    if (conversationId) {
      joinConversation(conversationId);
    }
    console.log('Socket already connected, reusing connection');
    return socket;
  }
  
  if (isConnecting) {
    console.log('Socket connection already in progress');
    return null;
  }
  
  isConnecting = true;
  console.log(`Connecting to socket server at ${SOCKET_URL}...`);

  return new Promise(async (resolve, reject) => {
    try {
      // Get auth token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('Authentication token not found');
        isConnecting = false;
        reject(new Error('Authentication token not found'));
        return;
      }
      
      // Kiểm tra và xử lý userId
      if (!userId) {
        console.log('User ID not provided, attempting to use alternative identification');
        
        // Thử lấy thông tin người dùng từ Redux store
        const currentUser = store.getState().auth.user;
        
        if (currentUser) {
          // Thử các trường khác nhau để tìm ID
          if (currentUser._id) {
            userId = currentUser._id;
            console.log('Using _id from Redux store:', userId);
          } else if (currentUser.id) {
            userId = currentUser.id;
            console.log('Using id from Redux store:', userId);
          } else if (currentUser.email) {
            userId = currentUser.email;
            console.log('Using email as user ID:', userId);
          } else if (currentUser.username) {
            userId = currentUser.username;
            console.log('Using username as user ID:', userId);
          }
        }
        
        // Nếu vẫn không có userId
        if (!userId) {
          console.error('User ID is required for socket connection');
          isConnecting = false;
          reject(new Error('User ID is required'));
          return;
        }
      }
      
      // Connect to socket server
      socket = io(SOCKET_URL, {
        query: { userId },
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
        reconnectionDelay: RECONNECT_DELAY,
        timeout: 10000, // 10 seconds connection timeout
      });

      // Set up connect and error handlers immediately
      socket.on('connect', () => {
        console.log('Socket connected successfully');
        reconnectAttempts = 0;
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        
        isConnecting = false;
        
        // Join conversation room if provided
        if (conversationId) {
          joinConversation(conversationId);
        }
        
        resolve(socket);
      });
      
      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        isConnecting = false;
        reject(error);
      });
      
      // Set longer timeout to detect if connection is failing
      const connectionTimeout = setTimeout(() => {
        if (isConnecting) {
          console.error('Socket connection timeout');
          isConnecting = false;
          if (socket) {
            socket.disconnect();
          }
          reject(new Error('Connection timeout'));
        }
      }, 15000); // 15 seconds total timeout
      
      // Set up the rest of the event handlers
      setupSocketEventHandlers();
      
      socket.on('disconnect', () => {
        clearTimeout(connectionTimeout);
      });
    } catch (error) {
      console.error('Error initiating socket:', error);
      isConnecting = false;
      reject(error);
    }
  });
};

// Set up socket event handlers
const setupSocketEventHandlers = () => {
  if (!socket) {
    console.error('Cannot set up event handlers: socket is null');
    return;
  }

  // Socket connection events - connect is handled separately in initiateSocket

  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${reason}`);
    
    // If the server initiated the disconnect, try to reconnect manually
    if (reason === 'io server disconnect') {
      tryReconnect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    tryReconnect();
  });

  // Handle message events
  socket.on('new-message', (conversationId, message) => {
    console.log('new-message received');
    if (storeInstance) {
      // Thêm vào store Redux
      storeInstance.dispatch(addNewMessage({conversationId, message}));
      
      // Lấy thông tin user và conversation
      const state = storeInstance.getState();
      const currentUserId = state.auth?.user?._id;
      const conversation = state.chat.conversations.find(c => c._id === conversationId);
      
      // Nếu tin nhắn từ người khác và không đang ở màn hình message
      if (message.sender?._id !== currentUserId && conversation) {
        // Tạo thông báo
        notificationService.showMessageNotification(message, conversation);
        
        // Cập nhật đếm tin nhắn chưa đọc
        storeInstance.dispatch(updateUnreadCount({
          conversationId,
          hasUnread: true
        }));
      }
    }
  });

  socket.on('message-updated', (updatedMessage) => {
    console.log('Message updated:', updatedMessage._id);
    if (storeInstance) {
      storeInstance.dispatch(updateMessage(updatedMessage));
    }
  });

  socket.on('update-vote-message', (conversationId, message) => {
    console.log('update-vote-message');
    dispatch(updateVoteMessage({conversationId, message}));
  });

  // Handle message recall events
  socket.on('message-recalled', (data) => {
    console.log('Message recalled event received:', data);
    if (storeInstance) {
      const messageId = data.messageId || data._id || data.id;
      if (messageId) {
        // Update the message to show as recalled
        storeInstance.dispatch(updateMessage({
          _id: messageId,
          content: 'Tin nhắn đã được thu hồi',
          status: 'recalled',
          isRecalled: true
        }));
      }
    }
  });

  // Handle rename conversation event
  socket.on('rename-conversation', (conversationId, newName, message) => {
    console.log('Rename conversation event received:', { conversationId, newName });
    
    // If we have a store instance, we can update redux state
    if (storeInstance) {
      // Dispatch an action to update the conversation name in the store if you have one
      // Right now we're handling this in the MessageScreen component
    }
    
    // The message processing will be handled in MessageScreen.js
  });

  // Handle both possible message deletion event formats from server
  socket.on('delete-message', (data) => {
    console.log('Delete message event received:', data);
    if (storeInstance) {
      // Handle different data formats: either {id}, {messageId}, or {conversationId, id/messageId}
      const messageId = data.messageId || data.id;
      if (messageId) {
        console.log('Removing message:', messageId);
        // Force immediate UI update
        storeInstance.dispatch(removeMessage(messageId));
        
        // If we're in the conversation where the message was deleted, force a re-render
        const currentState = storeInstance.getState();
        if (currentState.chat.currentConversation === data.conversationId) {
          // Trigger a re-render by updating the messages array
          const updatedMessages = currentState.chat.messages.filter(msg => msg._id !== messageId);
          storeInstance.dispatch(updateMessages(updatedMessages));
        }
      }
    }
  });
  
  // Also handle legacy message-deleted event for backward compatibility
  socket.on('message-deleted', (data) => {
    console.log('Legacy message-deleted event received:', data);
    if (storeInstance && data && data.messageId) {
      console.log('Removing message from legacy event:', data.messageId);
      // Force immediate UI update
      storeInstance.dispatch(removeMessage(data.messageId));
      
      // If we're in the conversation where the message was deleted, force a re-render
      const currentState = storeInstance.getState();
      if (currentState.chat.currentConversation === data.conversationId) {
        // Trigger a re-render by updating the messages array
        const updatedMessages = currentState.chat.messages.filter(msg => msg._id !== data.messageId);
        storeInstance.dispatch(updateMessages(updatedMessages));
      }
    }
  });

  // Handle typing events
  socket.on('typing', (data) => {
    console.log('Typing event:', data);
    handleTypingEvent(data.conversationId, data.user, data.isTyping);
  });
  
  // Handle user online status
  socket.on('user-status-changed', (data) => {
    console.log('User status changed:', data);
    if (storeInstance) {
      storeInstance.dispatch(updateUserOnlineStatus({
        userId: data.userId,
        isOnline: data.isOnline,
      }));
    }
  });
  
  // Handle error events
  socket.on('error', (error) => {
    // Chỉ log lỗi một lần, tránh spam console
    console.log('Socket error occurred - disabling reconnections to avoid spamming logs');
    // Tắt reconnect sau khi gặp lỗi
    if (socket && socket.io) {
      socket.io.opts.reconnection = false;
    }
  });
  
  // Handle reconnection events
  socket.io.on('reconnect', (attempt) => {
    console.log(`Socket reconnected after ${attempt} attempts`);
  });
  
  socket.io.on('reconnect_attempt', (attempt) => {
    console.log(`Socket reconnection attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS}`);
  });
  
  socket.io.on('reconnect_error', (error) => {
    console.error('Socket reconnection error:', error);
  });
  
  socket.on('user-last-view', (data) => {
    console.log('user-last-view event received:', data);
    
    if (storeInstance) {
      // Đảm bảo userId nhận được khác với userId hiện tại
      const currentState = storeInstance.getState();
      const currentUserId = currentState.auth?.user?._id;
      
      if (data.userId !== currentUserId) {
        storeInstance.dispatch(setListLastViewer({
          conversationId: data.conversationId,
          channelId: data.channelId,
          userId: data.userId,
          lastView: data.lastView
        }));
      }
    }
  });
};

// Try to reconnect to socket server with exponential backoff
const tryReconnect = () => {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS || reconnectTimer) {
    console.log('Max reconnection attempts reached or reconnect already in progress');
    return;
  }

  reconnectAttempts++;
  
  // Calculate exponential backoff delay with jitter
  const delay = Math.min(
    RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1) + Math.random() * 1000,
    MAX_RECONNECT_DELAY
  );
  
  console.log(`Trying to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms...`);
  
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    
    if (socket) {
      socket.connect();
    }
  }, delay);
};

// Join a conversation room
export const joinConversation = (conversationId) => {
  if (!socket) {
    console.log('Cannot join conversation: socket is null');
    return false;
  }
  
  if (!socket.connected) {
    console.log(`Cannot join conversation ${conversationId}: socket not connected`);
    return false;
  }
  
  if (!conversationId) {
    console.log('Cannot join conversation: conversationId is null');
    return false;
  }
  
  console.log(`Joining conversation: ${conversationId}`);
  socket.emit('join-conversation', conversationId);
  return true;
};

// Join multiple conversation rooms
export const joinConversations = (conversationIds) => {
  if (!socket) {
    console.log('Cannot join conversations: socket is null');
    return false;
  }
  
  if (!socket.connected) {
    console.log('Cannot join conversations: socket not connected');
    return false;
  }
  
  if (!conversationIds || !Array.isArray(conversationIds) || conversationIds.length === 0) {
    console.log('Cannot join conversations: no valid conversation IDs provided');
    return false;
  }
  
  console.log(`Joining ${conversationIds.length} conversations`);
  socket.emit('join-conversations', conversationIds);
  return true;
};

// Leave a conversation room
export const leaveConversation = (conversationId) => {
  if (!socket || !socket.connected || !conversationId) {
    console.log(`Cannot leave conversation ${conversationId}: socket not connected`);
    return false;
  }
  
  console.log(`Leaving conversation: ${conversationId}`);
  socket.emit('leave-conversation', conversationId);
  return true;
};

// Emit typing event
export const emitTyping = (isTyping, conversationId) => {
  if (!socket || !socket.connected || !conversationId) {
    console.log(`Cannot emit typing for conversation ${conversationId}: socket not connected`);
    return false;
  }
  
  const user = storeInstance ? storeInstance.getState().auth.user : null;
  socket.emit('typing', conversationId, user);
  return true;
};

// Handle typing events
const handleTypingEvent = (conversationId, user, isTyping) => {
  if (!conversationId || !user) return;
  
  // Get current state
  const state = store.getState();
  const { typingUsers } = state.chat;
  
  // Get users typing in this conversation
  const conversationTypingUsers = [...(typingUsers[conversationId] || [])];
  
  if (isTyping) {
    // Add user to typing list if not already there
    const existingIndex = conversationTypingUsers.findIndex(u => u._id === user._id);
    if (existingIndex === -1) {
      conversationTypingUsers.push(user);
    }
  } else {
    // Remove user from typing list
    const updatedTypingUsers = conversationTypingUsers.filter(u => u._id !== user._id);
    store.dispatch(setTypingUsers({
      conversationId,
      typingUsers: updatedTypingUsers,
    }));
    return;
  }
  
  // Update typing users in state
  store.dispatch(setTypingUsers({
    conversationId,
    typingUsers: conversationTypingUsers,
  }));
};

// Emit not typing event
export const emitNotTyping = (conversationId) => {
  if (!socket || !socket.connected || !conversationId) {
    console.log(`Cannot emit not typing for conversation ${conversationId}: socket not connected`);
    return false;
  }
  
  const user = storeInstance ? storeInstance.getState().auth.user : null;
  socket.emit('not-typing', conversationId, user);
  return true;
};

// Disconnect socket
export const disconnectSocket = () => {
  if (!socket) {
    console.log('No socket connection to disconnect');
    return;
  }
  
  console.log('Disconnecting socket...');
  try {
    // Remove all listeners before disconnecting
    socket.off();
    socket.disconnect();
  } catch (error) {
    console.error('Error disconnecting socket:', error);
  } finally {
    socket = null;
    
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    
    reconnectAttempts = 0;
    isConnecting = false;
  }
};

// Check if socket is connected
export const isSocketConnected = () => {
  try {
    return socket && socket.connected === true;
  } catch (error) {
    console.error('Error checking socket connection:', error);
    return false;
  }
};

// Thêm vào cuối file trước export default
export const getSocket = () => {
  return socket;
};

// Thêm phương thức on và off
export const on = (event, callback) => {
  if (!socket) {
    console.log(`Cannot register event ${event}: socket is null`);
    return false;
  }
  
  socket.on(event, callback);
  return true;
};

export const off = (event, callback) => {
  if (!socket) {
    console.log(`Cannot unregister event ${event}: socket is null`);
    return false;
  }
  
  socket.off(event, callback);
  return true;
};

// Hàm để tham gia cuộc gọi video
export const subscribeCallVideo = (conversationId, userId, peerId) => {
  if (!socket || !socket.connected) {
    console.log('Cannot subscribe to video call: Socket not connected');
    return false;
  }
  
  console.log('Subscribing to video call:', { conversationId, userId, peerId });
  socket.emit('subscribe-call-video', {
    conversationId,
    newUserId: userId,
    peerId,
  });
  
  return true;
};

// Đăng ký lắng nghe sự kiện có người tham gia cuộc gọi
export const onNewUserCall = (callback) => {
  if (!socket) {
    console.log('Cannot listen for new-user-call: Socket not connected');
    return false;
  }
  
  socket.on('new-user-call', (data) => {
    console.log('New user joined call:', data);
    if (typeof callback === 'function') {
      callback(data);
    }
  });
  
  return true;
};

// Thêm vào socketService.js
export const markConversationAsViewed = (conversationId, channelId = null) => {
  if (!socket || !socket.connected) {
    console.log('Cannot mark conversation as viewed: Socket not connected');
    return false;
  }
  
  if (channelId) {
    console.log(`Marking channel ${channelId} in conversation ${conversationId} as viewed`);
    socket.emit('conversation-last-view', conversationId, channelId);
  } else {
    console.log(`Marking conversation ${conversationId} as viewed`);
    socket.emit('conversation-last-view', conversationId);
  }
  
  return true;
};

// Cập nhật export default để bao gồm các phương thức mới
export default {
  initiateSocket,
  joinConversation,
  joinConversations,
  leaveConversation,
  emitTyping,
  disconnectSocket,
  isSocketConnected,
  getSocket, // Thêm phương thức này
  on,        // Thêm phương thức này
  off,       // Thêm phương thức này
  emitNotTyping, // Thêm phương thức này
  subscribeCallVideo, // Thêm phương thức này
  onNewUserCall, // Thêm phương thức này
  markConversationAsViewed, // Thêm phương thức này
};