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
import {deleteMessage, recallMessage} from '../../redux/chatSlice';

// Fix import path - messageType nằm trong constants/index.js chứ không phải constants.js
import {messageType} from '../../constants/index';
import { colors, spacing } from '../../styles';

const MessageModal = ({
  modalVisible,
  setModalVisible,
  navigation,
  handleOnReplyMessagePress,
  onDeleteMessage, // Đổi tên từ handleDeleteMessage thành onDeleteMessage
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
              
              // Xóa tin nhắn cho tất cả nếu là người gửi, ngược lại chỉ xóa cho mình
              if (isMyMessage) {
                // Xóa cho tất cả
                await dispatch(deleteMessage(messageId));
                
                // Gọi hàm callback nếu được cung cấp
                if (typeof onDeleteMessage === 'function') {
                  onDeleteMessage(messageId, true); // true = xóa cho mọi người
                }
              } else {
                // Xóa chỉ cho mình
                await dispatch(deleteMessage(messageId, true));
                
                // Gọi hàm callback nếu được cung cấp
                if (typeof onDeleteMessage === 'function') {
                  onDeleteMessage(messageId, false); // false = chỉ xóa cho bản thân
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
  
  // Thu hồi tin nhắn (chỉ có người gửi mới có quyền này)
  const handleRecallMessage = async () => {
    if (!messageId || !isMyMessage) return;
    
    // Confirm before recalling
    Alert.alert(
      'Thu hồi tin nhắn',
      'Bạn có chắc chắn muốn thu hồi tin nhắn này? Tin nhắn sẽ bị xóa với tất cả mọi người.',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Thu hồi', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await dispatch(recallMessage(messageId));
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

                      {/* Thu hồi option - only for my messages */}
                      {isMyMessage && (
                        <TouchableOpacity
                          style={styles.modalButton}
                          onPress={handleRecallMessage}>
                          <MaterialIcon name="undo" size={24} color="#FF9800" />
                          <Text style={[styles.modalButtonText, {color: '#FF9800'}]}>Thu hồi</Text>
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
