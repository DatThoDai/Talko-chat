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
  message = {},
  userId = '',
  isMyMessage = undefined, // Default là undefined để không ảnh hưởng đến logic cũ
  onPressEmoji = null,
  handleShowReactDetails = null,
  onPressDelete = null,
  onPressEdit = null,
  onReply = null,
  onPressRecall = null,
  //onRetry = null, // Default là null
  loading = false,
  previewImage = null,
  navigation,  // QUAN TRỌNG: Thêm prop navigation để chuyển tiếp tin nhắn
  conversationId, // Thêm conversationId hiện tại
  scrollToMessage = null, // Thêm scrollToMessage prop
}) => {
  // Thêm log để kiểm tra onReply đã được truyền đúng chưa
  console.log('ChatMessage received onReply:', typeof onReply);
  
  // Skip rendering completely if the message is deleted (but NOT if it's recalled)
  if (message?.isDeleted && !message?.isRecalled) {
    return null;
  }

  // Sửa hàm isSender để debug rõ ràng hơn
  const isSender = () => {
    // Thêm log chi tiết hơn về ID để so sánh
    console.log(
      "DETAILED MESSAGE CHECK for " + message?._id + ":", {
        currentUserId: userId || 'undefined',
        isMyMessage: message?.sender?._id === userId,
        isSenderCurrentUser: message?.sender?._id === userId,
        isUserIdCurrentUser: message?.userId === userId,
        messageId: message?._id || 'undefined',
        messageUserId: message?.userId,
        senderId: message?.sender?._id || 'undefined'
      }
    );
    
    // Ưu tiên prop isMyMessage được truyền vào
    if (isMyMessage !== undefined) {
      return isMyMessage;
    }
    
    // Kiểm tra nếu tin nhắn có trường isTemp - tin nhắn đang gửi
    if (message?.isTemp === true) {
      return true;
    }
    
    // Kiểm tra nếu tin nhắn có thuộc tính isMine 
    if (message?.isMine === true) {
      return true;
    }
    
    // Kiểm tra dựa trên ID người gửi và ID người dùng hiện tại
    const senderIdMatches = 
      (message?.sender?._id === userId) || 
      (message?.sender === userId) ||
      (message?.senderId === userId) ||
      (message?.userId === userId);
    
    return senderIdMatches;
  };

  // Check if message has been recalled
  const isMessageRecalled = message?.isRecalled || message?.status === MESSAGE_STATUS.recalled;

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
        //onRetry={onRetry} // Thêm prop này
        loading={loading}
        previewImage={previewImage}
        navigation={navigation}
        conversationId={conversationId}
        scrollToMessage={scrollToMessage}
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
        onPressRecall={null}
        previewImage={previewImage}
        navigation={navigation}
        conversationId={conversationId}
        scrollToMessage={scrollToMessage}
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
  //onRetry: PropTypes.func, // Thêm propType cho onRetry
  loading: PropTypes.bool,
  previewImage: PropTypes.func,
  navigation: PropTypes.object,
  conversationId: PropTypes.string,
  scrollToMessage: PropTypes.func, // Thêm propType cho scrollToMessage
};

// Đã xóa ChatMessage.defaultProps

export default ChatMessage;