// API URL options for different environments
// Android Emulator - use 10.0.2.2 (points to host's localhost)
// iOS Simulator - use localhost
// Real device - use actual server IP

// Uncomment the appropriate line below based on your environment
// For Android Emulator:
export const API_BASE_URL = 'http://172.30.16.1:3001';
export const REACT_APP_SOCKET_URL = 'http://172.30.16.1:3001';

// For real device (update with your server's IP address):
// export const API_BASE_URL = 'http://192.168.1.x:3001'; 
// export const REACT_APP_SOCKET_URL = 'http://192.168.1.x:3001';

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
