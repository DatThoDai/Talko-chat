// Central export file for all API services
// This helps avoid import cycles and makes imports more consistent

// Import services trước (không export trực tiếp)
import { default as axiosClient } from './axios';
import { authService as auth } from './authService';
import { default as me } from './meApi';
import { userService as user } from './userService';
import { default as message } from './messageApi';
import { default as conversation } from './conversationApi';

// Re-export services sau khi đã import đầy đủ
export const api = axiosClient;
export const authService = auth;
export const meApi = me;
export const userService = user;
export const messageApi = message;
export const conversationApi = conversation;

// Đặt lại các aliases để đảm bảo tương thích với code hiện tại
// Dùng để không phải sửa hết tất cả các imports trong các file khác
export const conversationService = conversation;
export const friendService = {
  // Thay thế các functions của friendService bằng các hàm tương ứng trong userService
  getFriends: userService.getFriends,
  getFriendRequests: userService.getFriendRequests,
  addFriend: userService.addFriend,
  acceptFriend: userService.acceptFriend
};

// Thêm lối tắt để sử dụng trong các file khác
// Đảm bảo các biến đã được định nghĩa trước khi tạo object
export default {
  auth: auth,
  user: user,
  message: message,
  conversation: conversation,
  friend: friendService
};

// export default {
//   auth: authService,
//   message: messageApi,
//   me: meApi,
//   user: userService,
//   friend: friendService,
//   conversation: conversationService
// };