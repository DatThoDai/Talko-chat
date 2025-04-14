import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {View, Text} from 'react-native';
import {messageType} from '../../constants';
import commonFuc from '../../utils/commonFuc';
import { formatMessageTime } from '../../utils/dateUtils';
import ReceiverMessage from './ReceiverMessage';
import SenderMessage from './SenderMessage';

// Định nghĩa MESSAGE_STATUS để tránh lỗi
const MESSAGE_STATUS = {
  recalled: 'recalled',
  sent: 'sent',
  sending: 'sending',
  failed: 'failed'
};

const ChatMessage = ({
  message,
  userId,
  onPressEmoji,
  handleShowReactDetails,
  onPressDelete,
  onPressEdit,
  onReply,
  onPressRecall,
  loading,
  previewImage,
  isMyMessage, // Thêm prop isMyMessage để đảm bảo chắc chắn
}) => {
  // Sửa hàm isSender để debug rõ ràng hơn
  const isSender = () => {
    // Thêm log chi tiết hơn về ID để so sánh
    console.log(
      "DETAILED MESSAGE CHECK:", {
        messageId: message?._id || 'undefined',
        senderId: message?.sender?._id || 'undefined', 
        userId: userId || 'undefined',
        senderId_equals_userId: message?.sender?._id === userId,
        isMyMessage: isMyMessage,
        isTemp: message?.isTemp,
      }
    );
    
    // Ưu tiên prop isMyMessage được truyền vào
    if (isMyMessage !== undefined) {
      return isMyMessage;
    }
    
    // Các kiểm tra khác giữ nguyên...
    
    // Thêm log điều kiện cuối cùng
    const senderIdMatches = 
      (message?.sender?._id === userId) || 
      (message?.sender === userId) ||
      (message?.senderId === userId);
    
    console.log(`Final check: ${senderIdMatches} (senderId: ${message?.sender?._id}, userId: ${userId})`);
    
    return senderIdMatches;
  };

  const isMessageRecalled = message?.status === MESSAGE_STATUS.recalled;

  // Xác định trước khi render để log
  const messageIsSender = isSender();
  
  // Log kết quả cuối cùng
  console.log(`Message ${message?._id?.substr(0, 8)} is ${messageIsSender ? 'SENDER' : 'RECEIVER'}`);

  // Determine if the message is from the current user
  if (messageIsSender) {
    return (
      <SenderMessage
        message={message}
        isMessageRecalled={isMessageRecalled}
        onPressEmoji={onPressEmoji}
        handleShowReactDetails={handleShowReactDetails}
        onPressDelete={onPressDelete}
        onPressEdit={onPressEdit}
        onReply={onReply}
        onPressRecall={onPressRecall}
        loading={loading}
        previewImage={previewImage}
      />
    );
  } else {
    return (
      <ReceiverMessage
        message={message}
        isMessageRecalled={isMessageRecalled}
        onPressEmoji={onPressEmoji}
        handleShowReactDetails={handleShowReactDetails}
        onReply={onReply}
        previewImage={previewImage}
      />
    );
  }
};

// Cập nhật propTypes
ChatMessage.propTypes = {
  message: PropTypes.object,
  userId: PropTypes.string,
  isMyMessage: PropTypes.bool, // Thêm propType cho isMyMessage
  onPressEmoji: PropTypes.func,
  handleShowReactDetails: PropTypes.func,
  onPressDelete: PropTypes.func,
  onPressEdit: PropTypes.func,
  onReply: PropTypes.func,
  onPressRecall: PropTypes.func,
  loading: PropTypes.bool,
  previewImage: PropTypes.func,
};

ChatMessage.defaultProps = {
  message: {},
  userId: '',
  isMyMessage: undefined, // Default là undefined để không ảnh hưởng đến logic cũ
  onPressEmoji: null,
  handleShowReactDetails: null,
  onPressDelete: null,
  onPressEdit: null,
  onReply: null,
  onPressRecall: null,
  loading: false,
  previewImage: null,
};

export default ChatMessage;
