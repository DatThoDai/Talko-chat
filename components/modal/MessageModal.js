import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {useDispatch} from 'react-redux';
import {deleteMessage, recallMessage, updateMessage, removeMessage} from '../../redux/chatSlice';
import {MESSAGE_RECALL_TEXT, MESSAGE_STATUS} from '../../constants/index';

// Fix import path - messageType nằm trong constants/index.js chứ không phải constants.js
import {messageType} from '../../constants/index';
import { colors, spacing } from '../../styles';

const MessageModal = ({
  modalVisible,
  setModalVisible,
  navigation,
  handleOnReplyMessagePress,
  onDeleteMessage, // For deleting messages
  onRecallMessage, // For recalling messages (new prop)
}) => {
  const {
    isVisible,
    isRecall,
    isMyMessage,
    messageId,
    messageContent,
    type,
  } = modalVisible;
  
  const [loading, setLoading] = useState(false);
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
      case 'recall':
        handleRecallMessage();
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

  // Delete a message - complete deletion
  const handleDeleteMessage = async () => {
    if (!messageId) return;
    
    // Confirm before deleting
    Alert.alert(
      'Xóa tin nhắn',
      isMyMessage 
        ? 'Bạn có chắc chắn muốn xóa tin nhắn này cho tất cả mọi người?'
        : 'Bạn có chắc chắn muốn xóa tin nhắn này khỏi cuộc trò chuyện của bạn?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Call the callback function to perform the delete
              if (typeof onDeleteMessage === 'function') {
                await onDeleteMessage(messageId);
              } else {
                // Fallback if no callback provided
                if (isMyMessage) {
                  await dispatch(deleteMessage({messageId}));
                } else {
                  await dispatch(deleteMessage({messageId, onlyMe: true}));
                }
              }
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert('Lỗi', 'Không thể xóa tin nhắn. Vui lòng thử lại sau.');
            } finally {
              setLoading(false);
              handleClose();
            }
          }
        }
      ]
    );
  };
  
  // Thu hồi tin nhắn (recall - not delete) - shows "Tin nhắn đã được thu hồi"
  const handleRecallMessage = async () => {
    if (!messageId || !isMyMessage) return;
    
    // Confirm before recalling
    Alert.alert(
      'Thu hồi tin nhắn',
      'Bạn có chắc chắn muốn thu hồi tin nhắn này? Tin nhắn đã gửi sẽ hiển thị là "Tin nhắn đã được thu hồi".',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Thu hồi', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Call the callback function for recall if available
              if (typeof onRecallMessage === 'function') {
                await onRecallMessage(messageId);
              } else {
                // Fallback if no callback provided - update UI and call API
                dispatch(updateMessage({
                  _id: messageId,
                  content: MESSAGE_RECALL_TEXT,
                  status: MESSAGE_STATUS.RECALLED,
                  isRecalled: true
                }));
                
                await dispatch(recallMessage(messageId));
              }
              
              console.log('Tin nhắn đã được thu hồi thành công:', messageId);
            } catch (error) {
              console.error('Error recalling message:', error);
              Alert.alert('Lỗi', 'Không thể thu hồi tin nhắn. Vui lòng thử lại sau.');
            } finally {
              setLoading(false);
              handleClose();
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.centeredView}>
          <TouchableWithoutFeedback>
            <View style={styles.modalView}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Đang xử lý...</Text>
                </View>
              ) : (
                <>
                  {/* Modal options */}
                  {!isRecall && (
                    <>
                      {/* Reply option */}
                      <TouchableOpacity
                        style={styles.modalButton}
                        onPress={() => handleOptionPress('reply')}>
                        <Icon name="arrow-undo-outline" size={24} color="#2196F3" />
                        <Text style={styles.modalButtonText}>Trả lời</Text>
                      </TouchableOpacity>

                      {/* Copy option - only for text messages */}
                      {(type === messageType.TEXT) && (
                        <TouchableOpacity
                          style={styles.modalButton}
                          onPress={() => handleOptionPress('copy')}>
                          <Icon name="copy-outline" size={24} color="#2196F3" />
                          <Text style={styles.modalButtonText}>Sao chép</Text>
                        </TouchableOpacity>
                      )}

                      {/* Forward option */}
                      <TouchableOpacity
                        style={styles.modalButton}
                        onPress={() => handleOptionPress('forward')}>
                        <Icon name="arrow-redo-outline" size={24} color="#2196F3" />
                        <Text style={styles.modalButtonText}>Chuyển tiếp</Text>
                      </TouchableOpacity>

                      {/* Thu hồi option - only for my messages - make this clear and distinct */}
                      {isMyMessage && (
                        <TouchableOpacity
                          style={[styles.modalButton, styles.recallButton]}
                          onPress={() => handleRecallMessage()}>
                          <MaterialIcon name="undo" size={24} color="#FF9800" />
                          <Text style={[styles.modalButtonText, {color: '#FF9800'}]}>Thu hồi tin nhắn</Text>
                        </TouchableOpacity>
                      )}

                      {/* Delete option - available for all messages */}
                      <TouchableOpacity
                        style={styles.modalButton}
                        onPress={handleDeleteMessage}>
                        <Icon name="trash-outline" size={24} color="#F44336" />
                        <Text style={[styles.modalButtonText, {color: '#F44336'}]}>                          
                          {isMyMessage ? 'Xóa cho mọi người' : 'Xóa với tôi'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Close button */}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleClose}>
                    <Text style={styles.closeButtonText}>Đóng</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recallButton: {
    backgroundColor: '#FFF8E1',  // Light orange background to highlight the recall button
  },
  modalButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#2196F3',
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  closeButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text,
  },
});

export default MessageModal;
