import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../styles';
import { messageType } from '../../constants';

const SystemNotificationMessage = ({ message }) => {
  // Format thông báo từ backend thành thông báo thân thiện
  const formattedContent = formatSystemNotification(message);

  return (
    <View style={styles.container}>
      <View style={styles.notificationContainer}>
        <Text style={styles.notificationText}>{formattedContent}</Text>
      </View>
    </View>
  );
};

// Hàm formatSystemNotification xử lý các mã thông báo từ server
const formatSystemNotification = (message) => {
  // Nếu message không hợp lệ hoặc không có content
  if (!message || !message.content) return 'Thông báo hệ thống';
  
  // Thông tin cơ bản
  const messageContent = message.content;
  const isNotifyDivider = message.isNotifyDivider || false;
  
  // Lấy dữ liệu người dùng từ message
  const metadata = message.metadata || {};
  const userId = metadata.currentUserId || '';
  const manipulatedUsers = message.manipulatedUsers || metadata.manipulatedUsers || [];
  
  // Xử lý theo switch case như trong mẫu
  let content = messageContent;

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
    case 'ADD_MANAGERS':
      content = `Đã thêm ${
        manipulatedUsers[0]?._id === userId
          ? 'bạn'
          : manipulatedUsers[0]?.name || 'người dùng'
      } làm phó nhóm`;
      break;
      
    case messageType.DELETE_MANAGERS:
    case 'DELETE_MANAGERS':
    case 'REMOVE_MANAGERS':
      content = `Đã xóa phó nhóm của ${
        manipulatedUsers[0]?._id === userId
          ? 'bạn'
          : manipulatedUsers[0]?.name || 'người dùng'
      }`;
      break;
      
    case 'Đã thêm vào nhóm':
    case 'ADD_MEMBER':
      content = `Đã thêm ${
        manipulatedUsers[0]?._id === userId
          ? 'bạn'
          : manipulatedUsers[0]?.name || 'người dùng'
      }${
        manipulatedUsers.length > 1
          ? ` và ${manipulatedUsers.length - 1} người khác`
          : ' vào nhóm'
      }`;
      break;
      
    case 'Đã xóa ra khỏi nhóm':
    case 'REMOVE_MEMBER':
      content = `Đã xóa ${
        manipulatedUsers[0]?._id === userId
          ? 'bạn'
          : manipulatedUsers[0]?.name || 'người dùng'
      } ra khỏi nhóm`;
      break;
      
    case 'Đã là bạn bè':
    case 'ADD_FRIEND':
      content = 'Đã trở thành bạn bè của nhau';
      break;
      
    case 'Ảnh đại diện nhóm đã thay đổi':
      content = 'Đã thay đổi ảnh đại diện nhóm';
      break;
      
    case 'LEAVE_GROUP':
      const leaver = manipulatedUsers[0] || message.sender || {};
      content = `${
        leaver._id === userId
          ? 'Bạn'
          : leaver.name || 'Người dùng'
      } đã rời khỏi nhóm`;
      break;
      
    case 'CHANGE_GROUP_NAME':
      const changer = manipulatedUsers[0] || message.sender || {};
      const newName = metadata.newName || metadata.groupName || '';
      content = `${
        changer._id === userId
          ? 'Bạn'
          : changer.name || 'Người dùng'
      } đã đổi tên nhóm${newName ? ` thành "${newName}"` : ''}`;
      break;
      
    case 'CREATE_GROUP':
      const creator = manipulatedUsers[0] || message.sender || {};
      content = `${
        creator._id === userId
          ? 'Bạn'
          : creator.name || 'Người dùng'
      } đã tạo nhóm`;
      break;

    default:
      // Xử lý các trường hợp còn lại dựa theo chuỗi chứa
      if (messageContent.includes('ADD_MANAGERS')) {
        content = `Đã thêm ${
          manipulatedUsers[0]?._id === userId
            ? 'bạn'
            : manipulatedUsers[0]?.name || 'người dùng'
        } làm phó nhóm`;
      } 
      else if (messageContent.includes('DELETE_MANAGERS') || messageContent.includes('REMOVE_MANAGERS')) {
        content = `Đã xóa phó nhóm của ${
          manipulatedUsers[0]?._id === userId
            ? 'bạn'
            : manipulatedUsers[0]?.name || 'người dùng'
        }`;
      }
      else if (messageContent.includes('ADD_MEMBER') || messageContent.includes('Đã thêm vào nhóm')) {
        content = `Đã thêm ${
          manipulatedUsers[0]?._id === userId
            ? 'bạn'
            : manipulatedUsers[0]?.name || 'người dùng'
        }${
          manipulatedUsers.length > 1
            ? ` và ${manipulatedUsers.length - 1} người khác`
            : ' vào nhóm'
        }`;
      }
      else if (messageContent.includes('REMOVE_MEMBER') || messageContent.includes('Đã xóa ra khỏi nhóm')) {
        content = `Đã xóa ${
          manipulatedUsers[0]?._id === userId
            ? 'bạn'
            : manipulatedUsers[0]?.name || 'người dùng'
        } ra khỏi nhóm`;
      }
      break;
  }

  // Điều chỉnh định dạng dựa trên isNotifyDivider
  if (isNotifyDivider) {
    return content.charAt(0).toLocaleLowerCase() + content.slice(1);
  }

  // Loại bỏ các thẻ HTML nếu có
  return content.replace(/<b>/g, '').replace(/<\/b>/g, '');
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  notificationContainer: {
    backgroundColor: colors.lightGray,
    borderRadius: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    maxWidth: '85%',
  },
  notificationText: {
    color: colors.darkGray,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default SystemNotificationMessage;