export const API_BASE_URL = 'https://cnm-chat-0t33.onrender.com';
export const REACT_APP_SOCKET_URL = 'https://cnm-chat-0t33.onrender.com';
export const REACT_APP_API_URL = 'https://cnm-chat-0t33.onrender.com';

// Socket retry settings
export const SOCKET_RECONNECTION_ATTEMPTS = 10;
export const SOCKET_RECONNECTION_DELAY = 3000;
export const SOCKET_MAX_RECONNECTION_DELAY = 30000;

export const MAX_FILE_SIZE = 20971520;

export const MESSAGE_PAGE_SIZE = 20;
export const MESSAGE_TYPING_TIMEOUT = 1000;

// Authentication
export const JWT_STORAGE_KEY = 'token'; 
export const REFRESH_TOKEN_STORAGE_KEY = 'refreshToken';
export const USER_STORAGE_KEY = 'user';

export const AVATAR_COLORS = [
  '#f44336', '#e91e63', '#9c27b0', '#673ab7', 
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
  '#009688', '#4caf50', '#8bc34a', '#cddc39', 
  '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
];

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

export const API_ENDPOINTS = {
  // Conversations
  CONVERSATIONS: '/conversations',
  CREATE_CONVERSATION: '/conversations/create',
  ADD_MEMBER: '/conversations/members',
  LEAVE_CONVERSATION: '/conversations/members/leave',
  UPDATE_CONVERSATION: '/conversations/update',
  
  // Messages
  MESSAGES: '/messages',
  CREATE_MESSAGE: '/messages/text',
  PIN_MESSAGE: '/messages/pin',
  DELETE_MESSAGE: '/messages',
  REACT_MESSAGE: '/messages/reacts',
  
  // Auth
  AUTH: '/auth',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  
  // Users
  USERS: '/auth/users',
  USERS_SEARCH: '/me/search',
  USER_PROFILE: '/me/profile',
  
  // Friends
  FRIENDS: '/me/friends',
  FRIEND_REQUESTS: '/me/friends/requests',
  ADD_FRIEND: '/me/friends/add',
  ACCEPT_FRIEND: '/me/friends/accept',
  
  // Classify
  CLASSIFIES: '/common/classifies',
  
  // Members
  MEMBERS: '/me/members',
  
  // Aliases
  ME_PROFILE: '/me/profile',
  ME_SEARCH: '/me/search',
  CHAT_MESSAGES: '/messages',
  PROFILE: '/me/profile',
};
