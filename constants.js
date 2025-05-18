// API URL options for different environments
// Android Emulator - use 10.0.2.2 (points to host's localhost)
// iOS Simulator - use localhost
// Real device - use actual server IP

// Sử dụng địa chỉ IP của máy chủ theo yêu cầu của người dùng
export const API_BASE_URL = 'http://192.168.101.14:3001';
export const REACT_APP_SOCKET_URL = 'http://192.168.101.14:3001';
export const REACT_APP_API_URL = 'http://192.168.101.14:3001';

// Các tùy chọn khác (không sử dụng):
// export const API_BASE_URL = 'http://10.0.2.2:3001'; // Android emulator
// export const REACT_APP_SOCKET_URL = 'http://10.0.2.2:3001';

// Socket retry settings
export const SOCKET_RECONNECTION_ATTEMPTS = 10;
export const SOCKET_RECONNECTION_DELAY = 3000;
export const SOCKET_MAX_RECONNECTION_DELAY = 30000;

// File upload limits
export const MAX_FILE_SIZE = 20971520; // 20MB in bytes

// Messaging constants
export const MESSAGE_PAGE_SIZE = 20;
export const MESSAGE_TYPING_TIMEOUT = 1000; // 1 second

// Authentication settings
export const JWT_STORAGE_KEY = 'token'; 
export const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';
export const USER_STORAGE_KEY = 'user';

// Default avatar colors
export const AVATAR_COLORS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', 
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
  '#009688', '#4caf50', '#8bc34a', '#cddc39', 
  '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
];

// Kiểu tin nhắn (MESSAGE_TYPE) để phục vụ renders tin nhắn trong SenderMessage/ReceiverMessage
export const messageType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  FILE: 'FILE',
  VIDEO: 'VIDEO',
  STICKER: 'STICKER',
  NOTIFICATION: 'NOTIFICATION',
  REPLY: 'REPLY',
  VOICE: 'VOICE',
  PIN_MESSAGE: 'PIN_MESSAGE',
  NOT_PIN_MESSAGE: 'NOT_PIN_MESSAGE',
  CREATE_CHANNEL: 'CREATE_CHANNEL',
  DELETE_CHANNEL: 'DELETE_CHANNEL',
  UPDATE_CHANNEL: 'UPDATE_CHANNEL',
  ADD_MANAGERS: 'ADD_MANAGERS',
  DELETE_MANAGERS: 'DELETE_MANAGERS',
};

export const friendType = {
  FRIEND: 'FRIEND',
  FOLLOWER: 'FOLLOWER',
  YOU_FOLLOW: 'YOU_FOLLOW',
  NOT_FRIEND: 'NOT_FRIEND',
  NOT_FRIEND: 'NOT_FRIEND',
  DONT_HAVE_ACCOUNT: 'DONT_HAVE_ACCOUNT',
  ADD_TO_GROUP: 'ADD_TO_GROUP',
  REMOVE_FROM_GROUP: 'REMOVE_FROM_GROUP',
};

// Cập nhật endpoints để phù hợp với cấu trúc Talko-chat-web đang hoạt động
export const API_ENDPOINTS = {
  // QUAN TRỌNG: Backend đang sử dụng đường dẫn không có tiền tố /me/
  // Cập nhật theo cấu trúc API của Talko-chat-web
  CONVERSATIONS: '/conversations',  // Thay đổi từ /me/conversations sang /conversations
  CREATE_CONVERSATION: '/conversations/create',
  ADD_MEMBER: '/conversations/members',
  LEAVE_CONVERSATION: '/conversations/members/leave',
  UPDATE_CONVERSATION: '/conversations/update',
  
  // Messages endpoints cũng cần phù hợp với web
  MESSAGES: '/messages',  // API chuẩn cho tin nhắn
  CREATE_MESSAGE: '/messages/text',  // Đổi sang endpoint chính xác theo API của web
  PIN_MESSAGE: '/messages/pin',
  DELETE_MESSAGE: '/messages',  // API xóa message cần phương thức DELETE với ID
  REACT_MESSAGE: '/messages/reacts',
  
  // Auth endpoints không cần /me/ prefix (hoạt động OK)
  AUTH: '/auth',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  
  // Users endpoints - giữ nguyên các endpoint đã hoạt động
  USERS: '/auth/users',  // Đổi sang endpoint đúng
  USERS_SEARCH: '/me/search',  // Đã xác nhận hoạt động trong logs
  USER_PROFILE: '/me/profile',  // Đã xác nhận hoạt động trong logs
  
  // Friends endpoints cũng cần /me/ prefix
  FRIENDS: '/me/friends',
  FRIEND_REQUESTS: '/me/friends/requests',
  ADD_FRIEND: '/me/friends/add',
  ACCEPT_FRIEND: '/me/friends/accept',
  
  // Classify endpoints (có thể trong /common/ hoặc /me/)
  CLASSIFIES: '/common/classifies',
  
  // Các endpoint khác
  MEMBERS: '/me/members',
  
  // Giữ lại các endpoint đã xác nhận hoạt động trong logs
  ME_PROFILE: '/me/profile',
  ME_SEARCH: '/me/search',
  
  // Các alias để hỗ trợ cả hai kiểu API
  CHAT_MESSAGES: '/messages',  // Cập nhật để khớp với endpoint mới
  PROFILE: '/me/profile',
};
