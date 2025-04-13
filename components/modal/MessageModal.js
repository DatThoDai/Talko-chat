import React from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useDispatch} from 'react-redux';
import {deleteMessage} from '../../redux/chatSlice';
import {messageType} from '../../constants';

const MessageModal = ({
  modalVisible,
  setModalVisible,
  navigation,
  handleOnReplyMessagePress,
}) => {
  const {
    isVisible,
    isRecall,
    isMyMessage,
    messageId,
    messageContent,
    type,
  } = modalVisible;
  
  const dispatch = useDispatch();

  // Close the modal
  const handleClose = () => {
    setModalVisible({
      isVisible: false,
      isRecall: false,
      isMyMessage: false,
      messageId: '',
      messageContent: '',
      type: '',
    });
  };

  // Handle option selection
  const handleOptionPress = (option) => {
    handleClose();
    
    // Handle different options
    switch (option) {
      case 'copy':
        handleCopyText();
        break;
      case 'reply':
        handleReplyMessage();
        break;
      case 'forward':
        handleForwardMessage();
        break;
      case 'delete':
        handleDeleteMessage();
        break;
      default:
        break;
    }
  };

  // Copy message text to clipboard
  const handleCopyText = () => {
    try {
      if (messageContent) {
        // Use Clipboard API
        const Clipboard = require('@react-native-clipboard/clipboard').default;
        Clipboard.setString(messageContent);
        // You could show a toast or other notification here
      }
    } catch (error) {
      console.error('Error copying text:', error);
    }
  };

  // Reply to a message
  const handleReplyMessage = () => {
    if (messageId && handleOnReplyMessagePress) {
      handleOnReplyMessagePress(messageId);
    }
  };

  // Forward a message to other conversations
  const handleForwardMessage = () => {
    if (messageId) {
      navigation.navigate('ForwardMessage', {
        messageId,
        messageContent,
        type,
      });
    }
  };

  // Delete a message
  const handleDeleteMessage = () => {
    if (messageId) {
      // Confirm deletion
      dispatch(deleteMessage({messageId}))
        .unwrap()
        .then(() => {
          // Success
        })
        .catch((error) => {
          console.error('Error deleting message:', error);
          // Show error message
        });
    }
  };

  // Render a single option button
  const renderOption = (icon, text, onPress, color = '#333', disabled = false) => {
    return (
      <TouchableOpacity
        style={[styles.option, disabled && styles.disabledOption]}
        onPress={onPress}
        disabled={disabled}>
        <Icon name={icon} size={24} color={disabled ? '#888' : color} />
        <Text style={[styles.optionText, disabled && styles.disabledText]}>
          {text}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Only show copy option for text messages and if the message is not deleted */}
            {type === messageType.TEXT && !isRecall && (
              renderOption(
                'copy-outline',
                'Sao chép',
                () => handleOptionPress('copy')
              )
            )}
            
            {/* Reply option - available for all non-deleted messages */}
            {!isRecall && (
              renderOption(
                'return-up-back-outline',
                'Trả lời',
                () => handleOptionPress('reply')
              )
            )}
            
            {/* Forward option - available for all non-deleted messages */}
            {!isRecall && (
              renderOption(
                'arrow-redo-outline',
                'Chuyển tiếp',
                () => handleOptionPress('forward')
              )
            )}
            
            {/* Delete option - only available for the user's own messages */}
            {isMyMessage && (
              renderOption(
                'trash-outline',
                isRecall ? 'Đã thu hồi' : 'Thu hồi',
                () => handleOptionPress('delete'),
                '#F44336',
                isRecall
              )
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  disabledOption: {
    opacity: 0.5,
  },
  optionText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#333',
  },
  disabledText: {
    color: '#888',
  },
});

export default MessageModal;
