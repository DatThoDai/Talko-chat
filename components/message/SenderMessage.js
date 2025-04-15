import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Clipboard,
  ToastAndroid,
  Platform,
  Alert,
  Vibration,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { messageType, MESSAGE_RECALL_TEXT, MESSAGE_DELETE_TEXT } from '../../constants';
import CustomAvatar from '../CustomAvatar';
import MessageActions from './MessageActions';

function SenderMessage(props) {
  const {
    message,
    isMessageRecalled,
    onPressEmoji,
    handleShowReactDetails,
    onPressDelete,
    onPressEdit,
    onReply,
    onPressRecall,
    loading,
    previewImage,
    navigation, // Thêm navigation vào danh sách các props
    conversationId // Thêm conversationId vào danh sách các props
  } = props;
  
  // Trích xuất trường dữ liệu từ message để tương thích với code cũ
  const content = message?.content || '';
  const time = message?.createdAt ? new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
  const reactLength = message?.reactions?.length || 0;
  const reactVisibleInfo = reactLength > 0 ? `${reactLength}` : '';
  // Ưu tiên sử dụng conversationId từ props, nếu không có thì lấy từ message
  const msgConversationId = conversationId || message?.conversationId;
  const currentUserId = message?.sender?._id;
  const messageStatus = message?.status || 'sent';

  // Make sure we have message and sender
  if (!message) {
    console.warn('SenderMessage received null or undefined message');
    return null;
  }

  const { type, sender = {}, fileUrl, fileName, fileSize } = message;
  
  // Ensure sender name is correct for this user
  const senderName = sender?.name === 'truong chi bao' ? 
    'truong chi bao' : // Keep this exact name
    sender?.name || 'You';

  // Force message to be recognized as from current user
  const isMyMessage = true;
  
  // State for message actions modal and position
  const [showActions, setShowActions] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  
  // Chuyển đổi dung lượng file sang định dạng readable
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // Render appropriate message content based on type
  const renderContent = () => {
    switch (type) {
      case messageType.IMAGE:
        return (
          <TouchableWithoutFeedback
            onPress={() => handleViewImage(fileUrl, sender?.name)}>
            <Image
              source={{ uri: fileUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableWithoutFeedback>
        );
      
      case messageType.FILE:
        return (
          <TouchableOpacity 
            style={styles.fileContainer}
            onPress={() => {
              // Mở file hoặc tải xuống file
              if (fileUrl) {
                // Có thể thêm logic để mở file hoặc tải xuống tại đây
                Alert.alert(
                  'Tệp đính kèm',
                  `Bạn muốn làm gì với file ${fileName || 'này'}?`,
                  [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Tải xuống', onPress: () => console.log('Download file:', fileUrl) },
                    { text: 'Chia sẻ', onPress: () => console.log('Share file:', fileUrl) },
                  ]
                );
              }
            }}
          >
            <View style={styles.fileIconContainer}>
              <Icon 
                name={message.fileType === 'pdf' ? "document-text-outline" : "document-outline"}
                size={24} 
                color="#2196F3" 
              />
            </View>
            <View style={styles.fileInfoContainer}>
              <Text style={styles.fileName} numberOfLines={1}>
                {fileName || 'Tệp đính kèm'}
              </Text>
              {fileSize && (
                <Text style={styles.fileSize}>
                  {formatFileSize(fileSize)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      
      case messageType.VIDEO:
        return (
          <TouchableWithoutFeedback
            onPress={() => handleViewImage(fileUrl, sender?.name, false)}>
            <View style={styles.videoContainer}>
              <Image
                source={{ uri: message.thumbnail || fileUrl }}
                style={styles.videoThumbnail}
                resizeMode="cover"
              />
              <View style={styles.playButton}>
                <Icon name="play" size={24} color="#FFFFFF" />
              </View>
            </View>
          </TouchableWithoutFeedback>
        );
      
      default:
        return <Text style={styles.content}>{content}</Text>;
    }
  };

  // Handle long press to open message actions
  const handleLongPress = (event) => {
    // Trích xuất tọa độ từ sự kiện press
    const { pageX, pageY } = event.nativeEvent;
    
    // Lưu vị trí tin nhắn để hiển thị menu gần đó
    const position = {
      x: pageX,
      y: pageY
    };
    
    // Vibrate để feedback
    if (Platform.OS === 'android' && typeof Vibration !== 'undefined') {
      Vibration.vibrate(50); // Rung nhẹ 50ms
    }
    
    // Cập nhật vị trí và hiển thị modal
    setMenuPosition(position);
    setShowActions(true);
  };

  // Close the message actions
  const handleCloseActions = () => {
    setShowActions(false);
    setMenuPosition(null);
  };

  // Handle text selection for copy
  const handleCopyText = (text) => {
    Clipboard.setString(text);
    
    // Show toast or alert based on platform
    if (Platform.OS === 'android') {
      ToastAndroid.show('Đã sao chép văn bản', ToastAndroid.SHORT);
    } else {
      Alert.alert('Thông báo', 'Đã sao chép văn bản');
    }
  };

  // Check if message is recalled or deleted
  const isRecalled = message.manipulatedUserIds?.includes(message.userId);
  const isDeleted = message.isDeleted;
  
  // Modified message style if recalled or deleted
  const messageStyle = isRecalled || isDeleted 
    ? {...styles.messageContent, backgroundColor: '#f0f0f0'} 
    : styles.messageContent;
  
  // Hiển thị chỉ báo trạng thái tin nhắn
  const renderMessageStatus = () => {
    if (!messageStatus) return null;
    
    switch (messageStatus) {
      case 'sending':
        return (
          <View style={styles.statusContainer}>
            <Icon name="time-outline" size={14} color="#999" />
            <Text style={styles.statusText}>Đang gửi...</Text>
          </View>
        );
      case 'sent':
        return (
          <View style={styles.statusContainer}>
            <Icon name="checkmark-done" size={14} color="#4caf50" />
          </View>
        );
      case 'failed':
        return (
          <View style={styles.statusContainer}>
            <Icon name="alert-circle-outline" size={14} color="#f44336" />
            <Text style={styles.statusText}>Lỗi</Text>
            {onRetry && (
              <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
                <Text style={styles.retryText}>Thử lại</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      case 'retrying':
        return (
          <View style={styles.statusContainer}>
            <Icon name="refresh-outline" size={14} color="#ff9800" />
            <Text style={styles.statusText}>Đang thử lại...</Text>
          </View>
        );
      case 'uploading':
        // Hiển thị thanh tiến trình tải lên
        return (
          <View style={styles.progressContainer}>
            <View style={styles.statusContainer}>
              <Icon name="cloud-upload-outline" size={14} color="#2196F3" />
              <Text style={styles.statusText}>Đang tải lên... {message.uploadProgress || 0}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[styles.progressBar, { width: `${message.uploadProgress || 0}%` }]}
              />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <TouchableWithoutFeedback onLongPress={handleLongPress}>
          <View style={[messageStyle, message.isTemp ? styles.tempMessage : null]}>
            {isRecalled ? (
              <Text style={styles.recalledText}>Tin nhắn đã bị thu hồi</Text>
            ) : isDeleted ? (
              <Text style={styles.recalledText}>Tin nhắn đã bị xóa</Text>
            ) : (
              renderContent()
            )}
            <View style={styles.timeContainer}>
              {renderMessageStatus()}
              <Text style={styles.time}>{time}</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
        
        {reactLength > 0 && (
          <TouchableOpacity
            style={styles.reactContainer}
            onPress={handleShowReactDetails}>
            <Text style={styles.reactText}>{reactVisibleInfo}</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.avatarContainer}>
        <CustomAvatar
          size={36}
          name={sender?.name}
          avatar={sender?.avatar}
          color={sender?.avatarColor}
        />
      </View>
      
      <MessageActions
        visible={showActions}
        onClose={handleCloseActions}
        message={message}
        currentUserId={currentUserId}
        onReply={onReply}
        onSelect={handleCopyText}
        onPressRecall={onPressRecall}
        navigation={navigation}
        conversationId={msgConversationId}
        position={menuPosition}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginBottom: 15,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    width: '100%',
  },
  avatarContainer: {
    marginLeft: 8,
  },
  messageContainer: {
    maxWidth: '75%',
    alignItems: 'flex-end',
  },
  messageContent: {
    backgroundColor: '#DCF8C6',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
    alignSelf: 'flex-end',
  },
  senderName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  content: {
    fontSize: 15,
    color: '#333',
  },
  time: {
    fontSize: 11,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  reactContainer: {
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    padding: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-end',
    marginTop: 4,
    marginRight: 8,
  },
  reactText: {
    fontSize: 12,
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginVertical: 4,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF4FB',
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
    width: 200,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfoContainer: {
    flex: 1,
    marginLeft: 8,
  },
  fileName: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  fileSize: {
    color: '#78909c',
    fontSize: 12,
    marginTop: 2,
  },
  videoContainer: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginVertical: 4,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  playButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recalledText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    color: '#888',
    marginLeft: 4,
  },
  retryButton: {
    marginLeft: 5,
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  retryText: {
    fontSize: 10,
    color: '#f44336',
  },
  progressContainer: {
    width: '100%',
    marginTop: 4,
  },
  progressBarContainer: {
    height: 3,
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 1.5,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  tempMessage: {
    opacity: 0.8,
    backgroundColor: '#f5f8ff',
  },
});

SenderMessage.propTypes = {
  message: PropTypes.object,
  isMessageRecalled: PropTypes.bool,
  onPressEmoji: PropTypes.func,
  handleShowReactDetails: PropTypes.func,
  onPressDelete: PropTypes.func,
  onPressEdit: PropTypes.func,
  onReply: PropTypes.func,
  onPressRecall: PropTypes.func,
  loading: PropTypes.bool,
  previewImage: PropTypes.func,
  navigation: PropTypes.object,
  // Giữ lại các propTypes cũ để tương thích
  content: PropTypes.string,
  time: PropTypes.string,
  reactVisibleInfo: PropTypes.string,
  reactLength: PropTypes.number,
  handleViewImage: PropTypes.func,
  conversationId: PropTypes.string,
  currentUserId: PropTypes.string,
};

SenderMessage.defaultProps = {
  message: {},
  handleShowReactDetails: null,
  content: '',
  time: '',
  reactVisibleInfo: '',
  reactLength: 0,
  handleViewImage: null,
  navigation: {},
  conversationId: '',
  currentUserId: '',
  onReply: () => {},
};

export default SenderMessage;
