import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
  Animated,
  Text,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import EmojiPicker from '../EmojiPicker';
import { colors, spacing } from '../../styles';
import { emitTyping } from '../../utils/socketService';

const MessageInputWithEmoji = ({
  conversationId,
  onSendMessage,
  onSendFile,
  replyTo = null,
  onCancelReply,
  isUploading = false,
  showImageModal,
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);

  // Handler for when emoji is selected
  const handleEmojiSelected = (emoji) => {
    setMessage(prev => prev + emoji);
    
    // Focus input after selecting emoji
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handler for sending a message
  const handleSend = () => {
    if (message.trim() === '') return;
    
    // Kiểm tra xem tin nhắn chỉ chứa một emoji duy nhất
    // RegExp này sẽ kiểm tra nếu tin nhắn chỉ có đúng một ký tự emoji
    const isOnlyEmoji = /^\p{Emoji}$/u.test(message.trim());
    
    // Gửi tin nhắn với flag isOnlyEmoji
    onSendMessage(message, isOnlyEmoji);
    setMessage('');
    setShowEmojiPicker(false);
    
    // Focus input after sending
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Toggle emoji picker visibility
  const toggleEmojiPicker = () => {
    Keyboard.dismiss();
    setShowEmojiPicker(prev => !prev);
  };

  // Typing detection
  const handleTextChange = (text) => {
    setMessage(text);
    
    // Emit typing event to other users
    if (conversationId) {
      emitTyping(conversationId);
    }
  };

  return (
    <View style={styles.container}>
      {/* Reply container if replying to a message */}
      {replyTo && (
        <View style={styles.replyContainer}>
          <View style={styles.replyContent}>
            <Icon name="chatbubble-outline" size={16} color={colors.primary} style={styles.replyIcon} />
            <View style={styles.replyTextContainer}>
              <Text style={styles.replyToText}>
                Trả lời {replyTo.sender?.name || 'Người dùng'}
              </Text>
              <Text style={styles.replyMessageText} numberOfLines={1}>
                {replyTo.content || ''}
              </Text>
            </View>
            <TouchableOpacity onPress={onCancelReply} style={styles.replyCloseButton}>
              <Icon name="close" size={16} color={colors.grey} />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Input container */}
      <View style={styles.inputContainer}>
        {/* Emoji button */}
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={toggleEmojiPicker}
        >
          <MaterialIcon 
            name="emoji-emotions" 
            size={24} 
            color={showEmojiPicker ? colors.primary : '#AAA'} 
          />
        </TouchableOpacity>

        {/* Text input */}
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder="Nhập tin nhắn..."
          value={message}
          onChangeText={handleTextChange}
          multiline
          maxLength={2000}
          onFocus={() => setShowEmojiPicker(false)}
          editable={!isUploading}
        />

        {/* Attachment button */}
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => showImageModal && showImageModal(true)}
          disabled={isUploading}
        >
          <Icon name="attach-outline" size={24} color="#AAA" />
        </TouchableOpacity>
        
        {/* Send button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            message.trim() === '' ? styles.disabledSendButton : {}
          ]}
          onPress={handleSend}
          disabled={message.trim() === '' || isUploading}
        >
          <Icon name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Emoji picker */}
      {showEmojiPicker && (
        <View style={styles.emojiPickerContainer}>
          <EmojiPicker
            visible={true}
            onClose={() => setShowEmojiPicker(false)}
            onEmojiSelected={handleEmojiSelected}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F2F3F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: {
    backgroundColor: '#A6C9FA',
  },
  emojiPickerContainer: {
    height: 250,
  },
  replyContainer: {
    backgroundColor: '#F2F3F5',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 8,
  },
  replyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyIcon: {
    marginRight: 8,
  },
  replyTextContainer: {
    flex: 1,
  },
  replyToText: {
    fontWeight: 'bold',
    color: colors.primary,
    fontSize: 12,
  },
  replyMessageText: {
    color: colors.grey,
    fontSize: 12,
  },
  replyCloseButton: {
    padding: 4,
  },
});

export default MessageInputWithEmoji;