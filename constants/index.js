

export const API_ENDPOINTS = {
  CONVERSATIONS: '/conversations',
  CREATE_CONVERSATION: '/conversations',
  ADD_MEMBER: '/conversations/members',
  LEAVE_CONVERSATION: '/conversations/leave',
  UPDATE_CONVERSATION: '/conversations',
  
  MESSAGES: '/messages',
  CREATE_MESSAGE: '/messages/text',
  PIN_MESSAGE: '/messages/pin',
  DELETE_MESSAGE: '/messages',
  REACT_MESSAGE: '/messages/reacts',
  
  AUTH: '/auth',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  
  USERS: '/me/users',
  USERS_SEARCH: '/me/search',
  USER_PROFILE: '/me/profile',
  
  FRIENDS: '/me/friends',
  FRIEND_REQUESTS: '/me/friends/requests',
  ADD_FRIEND: '/me/friends/add',
  ACCEPT_FRIEND: '/me/friends/accept',
  
  CLASSIFIES: '/common/classifies',
  
  MEMBERS: '/me/members',
  
  ME_PROFILE: '/me/profile',
  ME_SEARCH: '/me/search',
  
  CHAT_MESSAGES: '/me/messages',
  PROFILE: '/me/profile',
};
export const DEFAULT_MESSAGE_PARAMS = {
  page: 0,
  size: 20,
};

export const REACTIONS = ['👍', '♥️', '😄', '😲', '😭', '😡'];

export const DEFAULT_AVATAR = 'https://via.placeholder.com/150';
export const DEFAULT_COVER_IMAGE = 'https://via.placeholder.com/500x200';
export const NO_INTERNET_IMAGE = 'https://via.placeholder.com/400x300?text=No+Internet';
export const EMPTY_IMAGE = 'https://via.placeholder.com/400x300?text=Empty';

export const ERROR_MESSAGE = 'Đã có lỗi xảy ra';
export const LEAVE_GROUP_MESSAGE = 'Bạn có muốn rời nhóm không?';
export const DELETE_GROUP_MESSAGE = 'Toàn bộ nội dung cuộc trò chuyện sẽ bị xóa, bạn có chắc chắn muốn xóa?';

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

export const MESSAGE_STATUS = {
  DELETED: 'DELETED',
  SENT: 'SENT',
  RECEIVED: 'RECEIVED',
  SEEN: 'SEEN',
  RECALLED: 'RECALLED'
};

export const MESSAGE_RECALL_TEXT = 'Tin nhắn đã bị thu hồi';
export const MESSAGE_RECALL_TIMEOUT = 600000;

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

export const memberType = {
  LEADER: 'LEADER',
  DEPUTY_LEADER: 'DEPUTY_LEADER',
  MEMBER: 'MEMBER',
};

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
