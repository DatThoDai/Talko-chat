import { messageType } from '../constants';

/**
 * Xác định nội dung thông báo dựa trên loại thông báo và người dùng liên quan
 * @param {String} messageContent - Nội dung tin nhắn gốc
 * @param {Boolean} isNotifyDivider - Có phải là divider thông báo hay không
 * @param {Object} message - Tin nhắn đầy đủ
 * @param {String} userId - ID người dùng hiện tại
 * @returns {String} Nội dung thông báo đã định dạng
 */
export const getNotifyContent = (messageContent, isNotifyDivider, message, userId) => {
  let content = messageContent;

  const { manipulatedUsers } = message || {};

  switch (messageContent) {
    case messageType.PIN_MESSAGE:
      content = 'Đã ghim một tin nhắn';
      break;

    case messageType.NOT_PIN_MESSAGE:
      content = 'Đã bỏ ghim một tin nhắn';
      break;

    case messageType.CREATE_CHANNEL:
      content = 'Đã tạo một kênh nhắn tin';
      break;

    case messageType.DELETE_CHANNEL:
      content = 'Đã xóa một kênh nhắn tin';
      break;

    case messageType.UPDATE_CHANNEL:
      content = 'Đã đổi tên một kênh nhắn tin';
      break;
      
    case messageType.ADD_MANAGERS:
      content = `Đã thêm ${
        manipulatedUsers?.[0]?._id === userId
          ? 'bạn'
          : manipulatedUsers?.[0]?.name || 'người dùng'
      } làm phó nhóm`;
      break;
      
    case messageType.DELETE_MANAGERS:
      content = `Đã xóa phó nhóm của ${
        manipulatedUsers?.[0]?._id === userId
          ? 'bạn'
          : manipulatedUsers?.[0]?.name || 'người dùng'
      }`;
      break;
      
    case 'Đã thêm vào nhóm':
      content = `Đã thêm ${
        manipulatedUsers?.[0]?._id === userId
          ? 'bạn'
          : manipulatedUsers?.[0]?.name || 'người dùng'
      }${
        manipulatedUsers?.length > 1
          ? ` và ${manipulatedUsers.length - 1} người khác`
          : ' vào nhóm'
      }`;
      break;
      
    case 'Đã xóa ra khỏi nhóm':
      content = `Đã xóa ${
        manipulatedUsers?.[0]?._id === userId
          ? 'bạn'
          : manipulatedUsers?.[0]?.name || 'người dùng'
      } ra khỏi nhóm`;
      break;
      
    case 'Đã là bạn bè':
      content = 'Đã trở thành bạn bè của nhau';
      break;
      
    case 'Ảnh đại diện nhóm đã thay đổi':
      content = 'Đã thay đổi ảnh đại diện nhóm';
      break;

    default:
      content = messageContent;
      break;
  }

  if (isNotifyDivider) {
    return content.charAt(0).toLocaleLowerCase() + content.slice(1);
  }

  return content.replace('<b>', '').replace('</b>', '');
};

// Export các hàm xử lý tin nhắn
export default {
  getNotifyContent
};