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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { messageType } from '../../constants';
import MessageActions from './MessageActions';
import CustomAvatar from '../CustomAvatar';

function ReceiverMessage(props) {
  const {
    message,
    isMessageRecalled,
    onPressEmoji,
    handleShowReactDetails,
    onReply,
    previewImage
  } = props;
  
  // Trích xuất trường dữ liệu từ message để tương thích với code cũ
  const content = message?.content || '';
  const time = message?.createdAt ? new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
  const reactLength = message?.reactions?.length || 0;
  const reactVisibleInfo = reactLength > 0 ? `${reactLength}` : '';
  const conversationId = message?.conversationId;
  const currentUserId = message?.sender?._id;
  const isLastMessage = false; // Giả định không phải tin nhắn cuối
  const onLastView = null;
  const handleViewImage = previewImage || (() => {});
  const navigation = {};
  
  // Make sure we have message
  if (!message) {
    console.warn('ReceiverMessage received null message');
    return null;
  }
  
  // State for message actions modal
  const [showActions, setShowActions] = useState(false);

  const { type, fileUrl, _id, sender = {} } = message;
  
  // Ensure we display a valid sender name
  const senderName = sender?.name || 
                     (sender?.email && sender.email.includes('@') 
                      ? sender.email.split('@')[0] 
                      : 'Unknown User');

  // Render appropriate message content based on type
  const renderContent = () => {
    switch (type) {
      case messageType.IMAGE:
        return (
          <TouchableWithoutFeedback
            onPress={() => handleViewImage(fileUrl, senderName)}>
            <Image
              source={{ uri: fileUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableWithoutFeedback>
        );
      
      case messageType.FILE:
        return (
          <View style={styles.fileContainer}>
            <Icon name="document-outline" size={24} color="#FFFFFF" />
            <Text style={styles.fileName} numberOfLines={1}>
              {message.fileName || 'Tệp đính kèm'}
            </Text>
          </View>
        );
      
      case messageType.VIDEO:
        return (
          <TouchableWithoutFeedback
            onPress={() => handleViewImage(fileUrl, senderName, false)}>
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
  const handleLongPress = () => {
    setShowActions(true);
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
    ? {...styles.messageContent, backgroundColor: '#a0a0a0'} 
    : styles.messageContent;

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <CustomAvatar
          size={36}
          name={senderName}
          avatar={sender?.avatar || null}
          color={sender?.avatarColor}
        />
      </View>

      <View style={styles.messageContainer}>
        <Text style={styles.senderName}>{senderName}</Text>
        
        <TouchableWithoutFeedback onLongPress={handleLongPress}>
          <View style={messageStyle}>
            {isRecalled ? (
              <Text style={styles.recalledText}>Tin nhắn đã bị thu hồi</Text>
            ) : isDeleted ? (
              <Text style={styles.recalledText}>Tin nhắn đã bị xóa</Text>
            ) : (
              renderContent()
            )}
            <View style={styles.timeContainer}>
              <Text style={styles.time}>{time}</Text>
              
              {isLastMessage && (
                <TouchableOpacity
                  onPress={() => onLastView && onLastView(_id)}
                  style={styles.seenButton}>
                  <Text style={styles.seenText}>Đã xem</Text>
                </TouchableOpacity>
              )}
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
      
      <MessageActions
        visible={showActions}
        onClose={() => setShowActions(false)}
        message={message}
        currentUserId={currentUserId}
        onReply={onReply}
        onSelect={handleCopyText}
        navigation={navigation}
        conversationId={conversationId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginBottom: 15,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    width: '100%',
  },
  avatarContainer: {
    marginRight: 8,
  },
  messageContainer: {
    maxWidth: '75%',
    alignItems: 'flex-start',
  },
  messageContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 4,
  },
  content: {
    fontSize: 15,
    color: '#333',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  time: {
    fontSize: 11,
    color: '#888',
  },
  seenButton: {
    marginLeft: 5,
  },
  seenText: {
    fontSize: 11,
    color: '#888',
  },
  reactContainer: {
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    padding: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginLeft: 8,
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
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
  },
  fileName: {
    marginLeft: 8,
    color: '#333',
    fontSize: 14,
    flex: 1,
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
});

ReceiverMessage.propTypes = {
  message: PropTypes.object,
  handleShowReactDetails: PropTypes.func,
  content: PropTypes.string,
  time: PropTypes.string,
  reactVisibleInfo: PropTypes.string,
  reactLength: PropTypes.number,
  handleViewImage: PropTypes.func,
  isLastMessage: PropTypes.bool,
  onLastView: PropTypes.func,
  navigation: PropTypes.object,
  conversationId: PropTypes.string,
  currentUserId: PropTypes.string,
  onReply: PropTypes.func,
};

ReceiverMessage.defaultProps = {
  message: {},
  handleShowReactDetails: null,
  content: '',
  time: '',
  reactVisibleInfo: '',
  reactLength: 0,
  handleViewImage: null,
  isLastMessage: false,
  onLastView: null,
  navigation: {},
  conversationId: '',
  currentUserId: '',
  onReply: () => {},
};

export default ReceiverMessage;
