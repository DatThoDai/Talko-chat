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
  ProgressBarAndroid,
  ProgressViewIOS,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EmojiPicker from '../EmojiPicker';
import FileUpload from './FileUpload';
import { colors, spacing } from '../../styles';
import { emitTyping } from '../../utils/socketService';

const MessageInput = ({ 
  conversationId, 
  onSendMessage, 
  onSendFile,
  onSendSticker, // Thêm prop này
  onCancelUpload = () => {},
  replyTo = null,
  onCancelReply = () => {},
  isUploading = false,
  uploadProgress = 0,
}) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Animation for reply container
  const replyAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Thêm console log để debug replyTo
    console.log('MessageInput - replyTo changed:', replyTo ? {
      id: replyTo._id,
      content: replyTo.content?.substring(0, 20),
      sender: replyTo.sender?.name
    } : 'null');
    
    // Animate reply container when replyTo changes
    if (replyTo) {
      Animated.timing(replyAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(replyAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [replyTo]);

  // Emit typing status to other users when typing
  const handleTyping = () => {
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing status
    emitTyping(conversationId, true);

    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(conversationId, false);
    }, 2000);
  };

  // Handle send message
  const handleSend = () => {
    if ((!message.trim() && !selectedFile) || isUploading) return;
    
    // Get message text, trimming whitespace
    const messageText = message.trim();
    
    // If we have a file, handle file upload
    if (selectedFile) {
      if (onSendFile) {
        onSendFile(selectedFile, messageText);
      }
      
      // Reset state
      setSelectedFile(null);
    } 
    // Otherwise just send a text message
    else if (messageText && onSendMessage) {
      onSendMessage(messageText);
    }
    
    // Clear input field
    setMessage('');
    
    // Close emoji picker if open
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    }
    
    // Close file upload if open
    if (showFileUpload) {
      setShowFileUpload(false);
    }
    
    // Focus the input field for continuous messaging
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleEmojiSelected = (emoji) => {
    setMessage(prev => prev + emoji);
  };

  const handleFileSelected = (file) => {
    if (!file) return;
    
    // Giữ thông tin fileType chi tiết trong file object
    // Nhưng đảm bảo UI hiển thị icon đúng
    
    console.log('File được chọn từ FileUpload:', {
      name: file.name,
      type: file.type,
      fileType: file.fileType // Thông tin chi tiết về loại file
    });
    
    // Gửi file và fileType chi tiết lên MessageScreen
    onSendFile(file);
  };

  // Thêm hàm xử lý sticker
  const handleStickerSelected = (stickerUrl) => {
    console.log('Sticker selected in MessageInput:', stickerUrl);
    
    // Đóng emoji picker
    setShowEmojiPicker(false);
    
    // Gửi sticker như một file ảnh
    if (onSendSticker && typeof onSendSticker === 'function') {
      onSendSticker(stickerUrl);
    } else {
      console.warn('onSendSticker function is not provided to MessageInput');
    }
  };

  const toggleEmojiPicker = () => {
    Keyboard.dismiss();
    setShowEmojiPicker(prev => !prev);
    setShowFileUpload(false);
  };

  const toggleFileUpload = () => {
    Keyboard.dismiss();
    setShowFileUpload(prev => !prev);
    setShowEmojiPicker(false);
  };

  const focusInput = () => {
    setShowEmojiPicker(false);
    setShowFileUpload(false);
    inputRef.current?.focus();
  };

  // Tính toán chiều cao của reply container
  const replyContainerHeight = replyAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 50], // Từ 0 đến 50 px
  });

  return (
    <>
      {/* Container cho emoji picker */}
      {showEmojiPicker && (
        <View style={styles.pickerContainer}>
          <View style={styles.emojiPickerHeader}>
            <Text style={styles.emojiPickerTitle}>Chọn biểu tượng cảm xúc</Text>
            <TouchableOpacity onPress={toggleEmojiPicker}>
              <Icon name="close" size={24} color={colors.grey} />
            </TouchableOpacity>
          </View>
          <EmojiPicker 
            visible={true} 
            onClose={toggleEmojiPicker}
            onEmojiSelected={handleEmojiSelected}
            onStickerSelected={handleStickerSelected} // Thêm dòng này
          />
        </View>
      )}
      
      {/* Container cho file upload */}
      {showFileUpload && (
        <View style={styles.pickerContainer}>
          <View style={styles.emojiPickerHeader}>
            <Text style={styles.emojiPickerTitle}>Gửi tệp đính kèm</Text>
            <TouchableOpacity onPress={toggleFileUpload}>
              <Icon name="close" size={24} color={colors.grey} />
            </TouchableOpacity>
          </View>
          <FileUpload 
            onFileSelected={handleFileSelected}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />
        </View>
      )}
      
      {/* Hiển thị thanh tiến trình upload khi đang tải lên file */}
      {isUploading && selectedFile && (
        <View style={styles.uploadProgressContainer}>
          <View style={styles.uploadInfo}>
            <Icon 
              name={selectedFile.isImage ? "image" : "insert-drive-file"} 
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.uploadFileName} numberOfLines={1}>
              {selectedFile.name || "File đang tải lên"}
            </Text>
          </View>
          {Platform.OS === 'android' ? (
            <ProgressBarAndroid 
              styleAttr="Horizontal"
              indeterminate={uploadProgress === 0}
              progress={uploadProgress / 100}
              color={colors.primary}
              style={styles.progressBar}
            />
          ) : (
            <ProgressViewIOS 
              progress={uploadProgress / 100}
              progressTintColor={colors.primary}
              style={styles.progressBar}
            />
          )}
          <View style={styles.uploadProgressActions}>
            <Text style={styles.uploadProgressText}>{uploadProgress}%</Text>
            {uploadProgress < 100 && (
              <TouchableOpacity 
                style={styles.cancelUploadButton}
                onPress={() => {
                  // Thông báo hủy upload
                  Alert.alert(
                    'Hủy tải lên',
                    'Bạn có chắc muốn hủy tải file này lên?',
                    [
                      {
                        text: 'Không',
                        style: 'cancel',
                      },
                      {
                        text: 'Có',
                        onPress: () => {
                          // Gọi hàm hủy tải lên từ component cha nếu có
                          if (typeof onCancelUpload === 'function') {
                            onCancelUpload();
                          }
                          // Xóa thông tin file đang chọn
                          setSelectedFile(null);
                        },
                      },
                    ],
                  );
                }}
              >
                <Icon name="close" size={16} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Animated container for reply */}
      {replyTo && (
        <Animated.View 
          style={[
            styles.replyContainer, 
            { height: replyContainerHeight }
          ]}
        >
          <View style={styles.replyContent}>
            <Icon name="reply" size={16} color={colors.grey} style={styles.replyIcon} />
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
        </Animated.View>
      )}

      {/* Message input container */}
      <View style={styles.container}>
        {/* Emoji button */}
        <TouchableOpacity style={styles.iconButton} onPress={toggleEmojiPicker}>
          <Icon 
            name="emoji-emotions" 
            size={24} 
            color={showEmojiPicker ? colors.primary : colors.grey} 
          />
        </TouchableOpacity>
        
        {/* File attachment button */}
        <TouchableOpacity style={styles.iconButton} onPress={toggleFileUpload}>
          <Icon 
            name="attach-file" 
            size={24} 
            color={showFileUpload ? colors.primary : colors.grey} 
          />
        </TouchableOpacity>
        
        {/* Camera button */}
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={() => {
            // Đóng keyboard và các picker khác
            Keyboard.dismiss();
            setShowEmojiPicker(false);
            
            // Mở FileUpload và chuyển vào chế độ camera
            setShowFileUpload(false);
            
            // Mở camera trực tiếp
            FileUpload.openCamera(handleFileSelected);
          }}
        >
          <Ionicons name="camera-outline" size={24} color={colors.grey} />
        </TouchableOpacity>

        {/* Text input field */}
        <View style={styles.inputContainer}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              handleTyping();
            }}
            onFocus={() => {
              setShowEmojiPicker(false);
              setShowFileUpload(false);
            }}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            multiline={true}
            maxLength={1000}
          />
        </View>

        {/* Send button */}
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            { backgroundColor: message.trim() ? colors.primary : colors.lightGrey }
          ]} 
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <Icon name="send" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.small,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  iconButton: {
    padding: 8,
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: spacing.small,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.lightBackground,
    paddingHorizontal: spacing.medium,
    maxHeight: 100, // Limit height for multiline input
  },
  input: {
    maxHeight: 100,
    fontSize: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 0,
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
    maxHeight: 250,
  },
  emojiPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  emojiPickerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  replyContainer: {
    backgroundColor: colors.lightBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    overflow: 'hidden',
  },
  uploadProgressContainer: {
    backgroundColor: colors.white,
    padding: spacing.small,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  uploadInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  uploadFileName: {
    marginLeft: spacing.small,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  progressBar: {
    marginVertical: spacing.xsmall,
  },
  uploadProgressText: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: colors.grey,
  },
  replyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
  },
  replyIcon: {
    marginRight: spacing.small,
  },
  replyTextContainer: {
    flex: 1,
  },
  replyToText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  replyMessageText: {
    fontSize: 12,
    color: colors.text,
  },
  replyCloseButton: {
    padding: 4,
  },
});

export default MessageInput;
