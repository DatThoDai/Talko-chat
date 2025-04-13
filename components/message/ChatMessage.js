import React from 'react';
import PropTypes from 'prop-types';
import {Text} from 'react-native';
import {messageType} from '../../constants';
import commonFuc from '../../utils/commonFuc';
import dateUtils from '../../utils/dateUtils';
import ReceiverMessage from './ReceiverMessage';
import SenderMessage from './SenderMessage';

function ChatMessage(props) {
  const {
    message,
    isMyMessage,
    setModalVisible,
    showReactDetails,
    navigation,
    setImageProps,
    isLastMessage,
    onLastView,
  } = props;

  // Handle potential missing properties in message
  if (!message || typeof message !== 'object') {
    return null;
  }

  const {_id, createdAt, sender, isDeleted, reactions = [], type} = message;
  const time = dateUtils.formatMessageTime(createdAt);
  const reactLength = reactions ? reactions.length : 0;

  // Generate reaction summary
  const reactStr = reactions ? commonFuc.getReactionVisibleInfo(reactions) : '';
  const reactVisibleInfo = `${reactStr} ${reactLength}`;

  // Handle deleted messages
  const content = isDeleted ? 'Tin nhắn đã được thu hồi' : message.content;

  // Open message options modal
  const handleOpenOptionModal = () => {
    const obj = {
      isVisible: true,
      isRecall: isDeleted ? true : false,
      isMyMessage,
      messageId: _id,
      messageContent: content,
      type,
    };
    setModalVisible(obj);
  };

  // Show reaction details
  const handleShowReactDetails = () => {
    const obj = {
      isVisible: true,
      messageId: _id,
      reacts: reactions,
    };
    showReactDetails(obj);
  };

  // View image in fullscreen
  const handleViewImage = (url, userName) => {
    setImageProps({
      isVisible: true,
      userName: userName,
      content: [{url: url || ''}],
      isImage: true,
    });
  };

  return isMyMessage ? (
    <ReceiverMessage
      message={message}
      handleOpenOptionModal={handleOpenOptionModal}
      handleShowReactDetails={handleShowReactDetails}
      content={content}
      time={time}
      reactVisibleInfo={reactVisibleInfo}
      reactLength={reactLength}
      handleViewImage={handleViewImage}
      isLastMessage={isLastMessage}
      onLastView={onLastView}
    />
  ) : (
    <SenderMessage
      message={message}
      handleOpenOptionModal={handleOpenOptionModal}
      handleShowReactDetails={handleShowReactDetails}
      content={content}
      time={time}
      reactVisibleInfo={reactVisibleInfo}
      reactLength={reactLength}
      handleViewImage={handleViewImage}
    />
  );
}

ChatMessage.propTypes = {
  message: PropTypes.object,
  navigation: PropTypes.object,
  currentUserId: PropTypes.string,
  isMyMessage: PropTypes.bool,
  isLastMessage: PropTypes.bool,
  setModalVisible: PropTypes.func,
  showReactDetails: PropTypes.func,
  setImageProps: PropTypes.func,
  onLastView: PropTypes.func,
};

ChatMessage.defaultProps = {
  message: {},
  navigation: {},
  currentUserId: '',
  isMyMessage: false,
  isLastMessage: false,
  setModalVisible: null,
  showReactDetails: null,
  setImageProps: null,
  onLastView: null,
};

export default ChatMessage;
