import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
  Keyboard,
  Animated,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FileUploadComponent from './FileUploadComponent';
import { colors, spacing, borderRadius, MESSAGE_TYPES } from '../styles';

const MessageInput = ({
  onSendMessage,
  onTyping,
  isUploading = false,
  uploadProgress = 0,
  conversationId,
}) => {
  const [message, setMessage] = useState('');
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);

  // Handle typing indicator
  useEffect(() => {
    // Set up keyboard listeners to clear typing indicator
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
      if (isTyping) {
        handleStopTyping();
      }
    });

    return () => {
      // Clean up event listeners
      keyboardDidHide.remove();
      
      // Clear any pending timeout
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      
      // Make sure we stop typing when component unmounts
      if (isTyping) {
        onTyping(false);
      }
    };
  }, [isTyping]);

  // Handle text input changes
  const handleMessageChange = (text) => {
    setMessage(text);
    
    // Handle typing indicator
    if (!isTyping && text.length > 0) {
      handleStartTyping();
    } else if (isTyping && text.length === 0) {
      handleStopTyping();
    }
    
    // Reset typing timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    if (text.length > 0) {
      typingTimeout.current = setTimeout(() => {
        handleStopTyping();
      }, 3000); // Stop typing after 3 seconds of inactivity
    }
  };

  // Start typing indicator
  const handleStartTyping = () => {
    setIsTyping(true);
    onTyping(true);
  };

  // Stop typing indicator
  const handleStopTyping = () => {
    setIsTyping(false);
    onTyping(false);
  };

  // Handle send message
  const handleSendMessage = () => {
    if (message.trim() === '' && !selectedFile) return;
    
    // If we have a file, send it with optional message
    if (selectedFile) {
      onSendMessage({
        text: message.trim(),
        file: selectedFile,
        type: selectedFile.fileType,
      });
      setSelectedFile(null);
    } else {
      // Otherwise, just send a text message
      onSendMessage({
        text: message.trim(),
        type: MESSAGE_TYPES.TEXT,
      });
    }
    
    // Clear input
    setMessage('');
    
    // Stop typing indicator
    handleStopTyping();
    
    // Clear animation
    Animated.timing(animatedHeight, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Toggle attachment options
  const toggleAttachmentOptions = () => {
    setShowAttachmentOptions(!showAttachmentOptions);
  };

  // Handle file selection
  const handleFileSelect = (file, fileType) => {
    setSelectedFile({
      ...file,
      fileType,
    });
    setShowAttachmentOptions(false);
    
    // Animate to show selected file
    Animated.timing(animatedHeight, {
      toValue: 60,
      duration: 200,
      useNativeDriver: false,
    }).start();
    
    // Focus input for optional caption
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  };

  // Handle cancel file selection
  const handleCancelFile = () => {
    setSelectedFile(null);
    
    // Animate to hide selected file
    Animated.timing(animatedHeight, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Render selected file preview
  const renderSelectedFile = () => {
    if (!selectedFile) return null;
    
    let fileTypeIcon = 'insert-drive-file';
    let fileTypeText = 'Tệp';
    let fileColor = colors.info;
    
    // Determine file type icon and text
    switch (selectedFile.fileType) {
      case MESSAGE_TYPES.IMAGE:
        fileTypeIcon = 'image';
        fileTypeText = 'Ảnh';
        fileColor = colors.success;
        break;
      case MESSAGE_TYPES.VIDEO:
        fileTypeIcon = 'videocam';
        fileTypeText = 'Video';
        fileColor = colors.warning;
        break;
      default:
        fileTypeIcon = 'insert-drive-file';
        fileTypeText = 'Tệp';
        fileColor = colors.info;
    }
    
    return (
      <Animated.View style={[styles.selectedFileContainer, { height: animatedHeight }]}>
        <View style={styles.selectedFileContent}>
          <View style={styles.fileTypeContainer}>
            <Icon name={fileTypeIcon} size={20} color={fileColor} />
            <Text style={styles.fileTypeText}>{fileTypeText}</Text>
          </View>
          
          <Text style={styles.fileNameText} numberOfLines={1}>
            {selectedFile.name}
          </Text>
          
          <TouchableOpacity 
            style={styles.cancelFileButton} 
            onPress={handleCancelFile}
            disabled={isUploading}
          >
            <Icon name="close" size={20} color={colors.gray} />
          </TouchableOpacity>
        </View>
        
        {isUploading && (
          <View style={styles.uploadProgressContainer}>
            <View 
              style={[
                styles.uploadProgressBar, 
                { width: `${uploadProgress}%` }
              ]} 
            />
            <Text style={styles.uploadProgressText}>{uploadProgress}%</Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        {renderSelectedFile()}
        
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.attachButton} 
            onPress={toggleAttachmentOptions}
            disabled={isUploading}
          >
            <Icon name="attach-file" size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Nhập tin nhắn..."
            value={message}
            onChangeText={handleMessageChange}
            multiline
            maxLength={2000}
            editable={!isUploading}
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (message.trim() === '' && !selectedFile) ? styles.sendButtonDisabled : {}
            ]} 
            onPress={handleSendMessage}
            disabled={(message.trim() === '' && !selectedFile) || isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Icon name="send" size={24} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <Modal
        visible={showAttachmentOptions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttachmentOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAttachmentOptions(false)}
        >
          <View style={styles.modalContainer}>
            <FileUploadComponent
              onFileSelect={handleFileSelect}
              onCancel={() => setShowAttachmentOptions(false)}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: colors.light,
    backgroundColor: colors.white,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.sm,
    fontSize: 16,
  },
  attachButton: {
    padding: spacing.xs,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  selectedFileContainer: {
    overflow: 'hidden',
  },
  selectedFileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  fileTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  fileTypeText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  fileNameText: {
    flex: 1,
    fontSize: 14,
    color: colors.dark,
  },
  cancelFileButton: {
    padding: spacing.xs,
  },
  uploadProgressContainer: {
    height: 4,
    backgroundColor: colors.lightGray,
    width: '100%',
    position: 'relative',
  },
  uploadProgressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  uploadProgressText: {
    position: 'absolute',
    right: 4,
    top: 4,
    fontSize: 10,
    color: colors.dark,
  },
});

export default MessageInput;
