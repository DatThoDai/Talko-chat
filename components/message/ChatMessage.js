import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {View, Text} from 'react-native';
import {messageType} from '../../constants';
import commonFuc from '../../utils/commonFuc';
// Sửa cách import để dùng named exports thay vì default export
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
}) => {
  const isSender = () => {
    console.log("Message ID:", message?._id, "Sender ID:", message?.sender?._id, "User ID:", userId);
    // Check if this is a temporary message (waiting to be sent)
    if (message?.isTemp === true) {
      return true;
    }
    
    // Check sender ID against user ID (multiple ways to check for robustness)
    const senderIdMatches = 
      (message?.sender?._id === userId) || 
      (message?.sender === userId) ||
      (message?.senderId === userId);
      
    console.log("Is sender match:", senderIdMatches);
    return senderIdMatches;
  };

  const isMessageRecalled = message?.status === MESSAGE_STATUS.recalled;

  // Determine if the message is from the current user
  if (isSender()) {
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

ChatMessage.propTypes = {
  message: PropTypes.object,
  userId: PropTypes.string,
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
