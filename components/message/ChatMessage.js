import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {View, Text, Pressable, TouchableOpacity, StyleSheet} from 'react-native';
import {messageType} from '../../constants';
import commonFuc from '../../utils/commonFuc';
import { formatMessageTime } from '../../utils/dateUtils';
import ReceiverMessage from './ReceiverMessage';
import SenderMessage from './SenderMessage';
import SystemNotificationMessage from './SystemNotificationMessage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MessageReactionModal from '../modal/MessageReactionModal';
import { REACTIONS } from '../../constants/index';

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
  isMyMessage = undefined,
  onPressEmoji = null,
  handleShowReactDetails = null,
  onPressDelete = null,
  onPressEdit = null,
  onReply = null,
  onPressRecall = null,
  loading = false,
  previewImage = null,
  navigation,
  conversationId,
  scrollToMessage = null,
}) => {
  // Thêm state để hiển thị nút reaction nhanh
  const [showQuickReactions, setShowQuickReactions] = useState(false);
  
  // Thêm state và logic cho modal thả reaction
  const [reactionModalVisible, setReactionModalVisible] = useState(false);
  const [touchPosition, setTouchPosition] = useState(null);

  // Hàm xử lý nhấn vào tin nhắn
  const handleMessagePress = () => {
    setShowQuickReactions(!showQuickReactions);
    // Tự động ẩn sau 3 giây nếu không có tương tác
    if (!showQuickReactions) {
      setTimeout(() => setShowQuickReactions(false), 3000);
    }
  };
  
  // Hàm xử lý nhấn giữ tin nhắn để hiển thị modal reaction
  const handleLongPress = (event) => {
    // Lấy tọa độ nhấn giữ để định vị modal
    setTouchPosition({
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY
    });
    setReactionModalVisible(true);
  };

  // Skip rendering completely if the message is deleted (but NOT if it's recalled)
  if (message?.isDeleted && !message?.isRecalled) {
    return null;
  }

  // Nếu là tin nhắn thông báo từ hệ thống, sử dụng SystemNotificationMessage
  if (message.type === 'NOTIFY') {
    return (
      <SystemNotificationMessage
        message={message}
      />
    );
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
      <>
        <Pressable 
          onPress={handleMessagePress} 
          onLongPress={handleLongPress} 
          delayLongPress={300}
        >
          <View>
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
              navigation={navigation}
              conversationId={conversationId}
              scrollToMessage={scrollToMessage}
            />
            
            {/* Quick reaction buttons */}
            {showQuickReactions && (
              <View style={styles.quickReactions}>
                {REACTIONS.map((emoji, index) => (
                  <TouchableOpacity 
                    key={`quick-reaction-${index}`}
                    style={styles.quickReactionButton}
                    onPress={() => {
                      onPressEmoji && onPressEmoji(message._id, emoji);
                      setShowQuickReactions(false);
                    }}
                  >
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Pressable>
        
        {/* Modal thả reaction */}
        <MessageReactionModal
          visible={reactionModalVisible}
          position={touchPosition}
          onClose={() => setReactionModalVisible(false)}
          onReactionSelected={(emoji) => {
            onPressEmoji && onPressEmoji(message._id, emoji);
          }}
        />
      </>
    );
  } else {
    return (
      <>
        <Pressable 
          onPress={handleMessagePress} 
          onLongPress={handleLongPress} 
          delayLongPress={300}
        >
          <View>
            <ReceiverMessage
              message={message}
              isMessageRecalled={isMessageRecalled}
              onPressEmoji={onPressEmoji}
              handleShowReactDetails={handleShowReactDetails}
              onReply={onReply}
              previewImage={previewImage}
              navigation={navigation}
              conversationId={conversationId}
              scrollToMessage={scrollToMessage}
            />
            
            {/* Quick reaction buttons */}
            {showQuickReactions && (
              <View style={styles.quickReactions}>
                {reactions.map((emoji, index) => (
                  <TouchableOpacity 
                    key={`quick-reaction-${index}`}
                    style={styles.quickReactionButton}
                    onPress={() => {
                      onPressEmoji && onPressEmoji(message._id, emoji);
                      setShowQuickReactions(false);
                    }}
                  >
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Pressable>
        
        {/* Modal thả reaction */}
        <MessageReactionModal
          visible={reactionModalVisible}
          position={touchPosition}
          onClose={() => setReactionModalVisible(false)}
          onReactionSelected={(emoji) => {
            onPressEmoji && onPressEmoji(message._id, emoji);
          }}
        />
      </>
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

// Thêm styles mới
const styles = StyleSheet.create({
  quickReactions: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 4,
    marginTop: 8,
    marginHorizontal: 16,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickReactionButton: {
    padding: 6,
    marginHorizontal: 4,
  },
  reactionEmoji: {
    fontSize: 20,
  }
});

export default ChatMessage;