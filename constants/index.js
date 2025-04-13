// Cấu hình API URL và các hằng số khác
// Sử dụng IP máy của bạn thay vì localhost khi phát triển với Expo trên điện thoại thật
export const REACT_APP_API_URL = 'http://192.168.1.5:3001'; // Thay đổi IP và port phù hợp
export const REACT_APP_SOCKET_URL = 'http://192.168.1.5:3001'; // Thay đổi IP và port phù hợp

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
