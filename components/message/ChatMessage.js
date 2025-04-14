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
  // Cải thiện hàm xác định người gửi
  const isSender = () => {
    // Ưu tiên kiểm tra prop isMyMessage được truyền vào nếu có
    if (isMyMessage !== undefined) {
      return isMyMessage;
    }
    
    // Đảm bảo log đầy đủ cho việc debug
    console.log(
      "Message check:", 
      JSON.stringify({
        messageId: message?._id?.toString().substring(0, 8) || 'undefined',
        senderId: message?.sender?._id?.toString() || 'undefined', 
        userId: userId?.toString() || 'undefined',
        isTemp: message?.isTemp,
        forceMyMessage: message?.forceMyMessage
      })
    );
    
    // Thứ tự ưu tiên để xác định là người gửi
    
    // 1. Nếu tin nhắn đã đánh dấu rõ là của mình
    if (message?.isMyMessage === true || message?.forceMyMessage === true) {
      return true;
    }
    
    // 2. Kiểm tra nếu là tin nhắn tạm thời
    if (message?.isTemp === true) {
      return true;
    }
    
    // 3. Kiểm tra ID tạm thời
    if (message?._id && typeof message._id === 'string' && 
        message._id.startsWith('temp-')) {
      return true;
    }
    
    // 4. So sánh ID người gửi với các trường hợp
    const senderIdMatches = 
      (message?.sender?._id === userId) || 
      (message?.sender === userId) ||
      (message?.senderId === userId);
    
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
