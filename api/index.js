// // Central export file for all API services
// // This helps avoid import cycles and makes imports more consistent

// // Re-export the axios instance
// export { default as api } from './axios';

// // Re-export all services
// export { authService } from './authService';
// export { messageApi } from './messageApi';
// export { meApi } from './meApi';
// export { userService } from './userService';
// export { friendApi } from './friendApi';
// export { conversationService } from './conversationService';

// // Default exports for backward compatibility
// import { authService } from './authService';
// import { messageApi } from './messageApi';
// import { meApi } from './meApi';
// import { userService } from './userService';
// import { friendApi } from './friendApi';
// import { conversationService } from './conversationService';

// export default {
//   auth: authService,
//   message: messageApi,
//   me: meApi,
//   user: userService,
//   friend: friendService,
//   conversation: conversationService
// };