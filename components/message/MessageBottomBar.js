import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {useDispatch} from 'react-redux';
import {sendMessage, sendFileMessage} from '../../redux/chatSlice';
import {emitTyping} from '../../utils/socketService';
import {messageType} from '../../constants';

function MessageBottomBar({
  conversationId,
  showStickyBoard,
  showImageModal,
  stickyBoardVisible,
  members,
  type,
  replyMessage,
  setReplyMessage,
}) {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const dispatch = useDispatch();

  // Reset typing state when component unmounts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Stop typing indicator
      if (isTyping) {
        emitTyping(false, conversationId);
      }
    };
  }, [isTyping, conversationId]);

  // Handle text input changes
  const handleTextChange = (value) => {
    setText(value);
    
    // Handle typing indicator
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      emitTyping(true, conversationId);
    }
    
    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    if (value.length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        emitTyping(false, conversationId);
      }, 3000);
    } else {
      setIsTyping(false);
      emitTyping(false, conversationId);
    }
  };

  // Handle sending a message
  const handleSend = () => {
    const trimmedText = text.trim();
    if (!trimmedText) return;
    
    // Clear the input
    setText('');
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      emitTyping(false, conversationId);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
    
    // Create message payload
    const messageData = {
      conversationId,
      content: trimmedText,
    };
    
    // Add reply information if replying to a message
    if (replyMessage.isReply) {
      messageData.replyToId = replyMessage.message._id;
      setReplyMessage({isReply: false, message: {}});
    }
    
    // Send the message
    dispatch(sendMessage(messageData))
      .unwrap()
      .catch((error) => {
        console.error('Error sending message:', error);
        // Show error toast or alert
      });
  };

  // Handle file selection
  const handleFileSelected = (file, fileType) => {
    if (!file || !conversationId) return;
    
    setIsUploading(true);
    
    // Map file type to message type
    let messageType;
    switch (fileType) {
      case 'photo':
        messageType = messageType.IMAGE;
        break;
      case 'video':
        messageType = messageType.VIDEO;
        break;
      default:
        messageType = messageType.FILE;
    }
    
    // Send file message
    dispatch(sendFileMessage({
      conversationId,
      content: text,
      file,
      fileType: messageType
    }))
    .unwrap()
    .then(() => {
      setText('');
      setIsUploading(false);
    })
    .catch((error) => {
      console.error('Error sending file:', error);
      setIsUploading(false);
      // Show error toast or alert
    });
  };

  // Handle cancel reply
  const handleCancelReply = () => {
    setReplyMessage({isReply: false, message: {}});
  };

  return (
    <View style={styles.container}>
      {/* Reply message preview */}
      {replyMessage.isReply && (
        <View style={styles.replyContainer}>
          <View style={styles.replyContent}>
            <View style={styles.replyInfo}>
              <Text style={styles.replyTitle}>
                Trả lời{' '}
                <Text style={styles.replyName}>
                  {replyMessage.message.sender?.name || 'Tin nhắn'}
                </Text>
              </Text>
              <Text style={styles.replyText} numberOfLines={1}>
                {replyMessage.message.content || 'Nội dung đã bị xóa'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleCancelReply}>
              <MaterialIcon name="close" size={20} color="#888" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Input area */}
      <View style={styles.inputContainer}>
        {/* Stickers button */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => showStickyBoard(!stickyBoardVisible)}>
          <Icon name="happy-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        {/* Text input */}
        <View style={styles.textInputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#888"
            value={text}
            onChangeText={handleTextChange}
            multiline={true}
            maxLength={5000}
            editable={!isUploading}
          />
        </View>
        
        {/* Attachment button */}
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => showImageModal(true)}
          disabled={isUploading}>
          <Icon name="attach-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
        
        {/* Send button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            text.trim() === '' ? styles.disabledSendButton : {}
          ]}
          onPress={handleSend}
          disabled={text.trim() === '' || isUploading}>
          {isUploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Icon name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: '#E5E6E7',
    backgroundColor: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#F2F3F5',
    borderRadius: 20,
    marginHorizontal: 8,
    paddingHorizontal: 12,
    maxHeight: 120,
  },
  textInput: {
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    color: '#333',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: {
    backgroundColor: '#A6C9FA',
  },
  replyContainer: {
    backgroundColor: '#F2F3F5',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    marginHorizontal: 10,
    marginTop: 8,
    borderRadius: 8,
  },
  replyContent: {
    flexDirection: 'row',
    padding: 8,
    alignItems: 'center',
  },
  replyInfo: {
    flex: 1,
    marginRight: 8,
  },
  replyTitle: {
    fontSize: 12,
    color: '#333',
  },
  replyName: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  replyText: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
});

export default MessageBottomBar;
