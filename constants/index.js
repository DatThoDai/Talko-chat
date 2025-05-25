// Cấu hình API URL và các hằng số khác

export const REACT_APP_API_URL = 'http://192.168.101.14:3001';
export const REACT_APP_SOCKET_URL = 'http://192.168.101.14:3001';

// CẤU HÌNH ĐÚNG THEO BACKEND CNM_CHAT (FIXED)
// Đã phân tích code CNM_Chat/routes/index.js
export const API_ENDPOINTS = {
  // Conversation routes: CNM_Chat/routes/index.js có dòng:
  // app.use('/conversations', auth, conversationRouter)
  CONVERSATIONS: '/conversations',
  CREATE_CONVERSATION: '/conversations',
  ADD_MEMBER: '/conversations/members',
  LEAVE_CONVERSATION: '/conversations/leave',
  UPDATE_CONVERSATION: '/conversations',
  
  // Message routes: CNM_Chat/routes/index.js có dòng:
  // app.use('/messages', auth, messageRouter)
  MESSAGES: '/messages',
  CREATE_MESSAGE: '/messages/text',
  PIN_MESSAGE: '/messages/pin',
  DELETE_MESSAGE: '/messages',
  REACT_MESSAGE: '/messages/reacts',
  
  // Auth endpoints không cần /me/ prefix (hoạt động OK)
  AUTH: '/auth',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  
  // Users endpoints cũng cần /me/ prefix
  USERS: '/me/users',
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
  CHAT_MESSAGES: '/me/messages',
  PROFILE: '/me/profile',
};

// Log endpoints để debug
console.log('Using CONVERSATIONS endpoint:', API_ENDPOINTS.CONVERSATIONS);

// Log cấu hình API URL và Socket URL để debug
console.log('Config - API URL:', REACT_APP_API_URL);
console.log('Config - Socket URL:', REACT_APP_SOCKET_URL);

// Các tham số mặc định
export const DEFAULT_MESSAGE_PARAMS = {
  page: 0,
  size: 20,
};

// Emoji reactions
export const REACTIONS = ['👍', '♥️', '😄', '😲', '😭', '😡'];

// Hình ảnh mặc định
export const DEFAULT_AVATAR = 'https://via.placeholder.com/150';
export const DEFAULT_COVER_IMAGE = 'https://via.placeholder.com/500x200';
export const NO_INTERNET_IMAGE = 'https://via.placeholder.com/400x300?text=No+Internet';
export const EMPTY_IMAGE = 'https://via.placeholder.com/400x300?text=Empty';

// Thông báo
export const ERROR_MESSAGE = 'Đã có lỗi xảy ra';
export const LEAVE_GROUP_MESSAGE = 'Bạn có muốn rời nhóm không?';
export const DELETE_GROUP_MESSAGE = 'Toàn bộ nội dung cuộc trò chuyện sẽ bị xóa, bạn có chắc chắn muốn xóa?';

// Các loại tin nhắn
export const messageType = {
  ALL: 'ALL',
  TEXT: 'TEXT',
  HTML: 'HTML',
  NOTIFY: 'NOTIFY',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  FILE: 'FILE',
  VOICE: 'VOICE',
  STICKER: 'STICKER',
};

// Trạng thái tin nhắn
export const MESSAGE_STATUS = {
  DELETED: 'DELETED',
  SENT: 'SENT',
  RECEIVED: 'RECEIVED',
  SEEN: 'SEEN',
  RECALLED: 'RECALLED'
};

// Hằng số liên quan đến thu hồi tin nhắn
export const MESSAGE_RECALL_TEXT = 'Tin nhắn đã bị thu hồi';
export const MESSAGE_RECALL_TIMEOUT = 600000; // 10 phút (600,000 ms)

// Các loại mối quan hệ bạn bè
export const friendType = {
  FRIEND: 'FRIEND',
  FOLLOWER: 'FOLLOWER',
  YOU_FOLLOW: 'YOU_FOLLOW',
  NOT_FRIEND: 'NOT_FRIEND',
  DONT_HAVE_ACCOUNT: 'DONT_HAVE_ACCOUNT',
  ADD_TO_GROUP: 'ADD_TO_GROUP',
  REMOVE_FROM_GROUP: 'REMOVE_FROM_GROUP',
};

// Các loại thành viên trong nhóm
export const memberType = {
  LEADER: 'LEADER',
  DEPUTY_LEADER: 'DEPUTY_LEADER',
  MEMBER: 'MEMBER',
};

// Cấu hình mặc định cho các modal
export const DEFAULT_MESSAGE_MODAL_VISIBLE = {
  isVisible: false,
  isRecall: false,
  isMyMessage: false,
  messageId: '',
  messageContent: '',
  type: messageType.TEXT,
};

export const DEFAULT_REPLY_MESSAGE = {
  isReply: false,
  replyMessage: {},
};

export const DEFAULT_MEMBER_MODAL = {
  isVisible: false,
  memberRole: memberType.MEMBER,
  memberId: '',
  memberName: '',
};
