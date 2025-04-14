import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing } from '../../styles';
import { messageApi } from '../../api/messageApi';

const MessageActions = ({
  visible,
  onClose,
  message,
  currentUserId,
  onReply,
  onSelect,
  // Additional props for navigation to forward screen
  navigation,
  conversationId,
}) => {
  const [loading, setLoading] = useState(false);
  const isMyMessage = message?.userId === currentUserId;

  // Check if message is already deleted or recalled
  const isDeleted = message?.isDeleted;
  const isRecalled = message?.manipulatedUserIds?.includes(message.userId);

  // Close the modal
  const handleClose = () => {
    onClose();
  };

  // Handle message reply
  const handleReply = () => {
    onReply(message);
    onClose();
  };

  // Handle message copy
  const handleCopy = () => {
    onSelect(message.content);
    onClose();
  };

  // Handle message recall (undo send - only for sender)
  const handleRecall = async () => {
    if (!isMyMessage) return;
    
    try {
      setLoading(true);
      await messageApi.recallMessage(message._id);
      onClose();
    } catch (error) {
      console.error('Error recalling message:', error);
      Alert.alert('Lỗi', 'Không thể thu hồi tin nhắn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Handle message delete (for both sender and receiver)
  const handleDelete = async () => {
    try {
      setLoading(true);
      if (isMyMessage) {
        // Delete for everyone if I'm the sender
        await messageApi.deleteMessage(message._id);
      } else {
        // Delete only for me if I'm not the sender
        await messageApi.deleteMessageOnlyMe(message._id);
      }
      onClose();
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Lỗi', 'Không thể xóa tin nhắn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Handle message forward
  const handleForward = () => {
    onClose();
    // Navigate to forward screen
    navigation.navigate('ForwardMessage', {
      messageId: message._id,
      currentConversationId: conversationId,
    });
  };

  // Render only actions that are relevant to the message
  // Don't show actions for deleted or recalled messages
  if (isDeleted || isRecalled) {
    return (
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlay}>
            <View style={styles.container}>
              <Text style={styles.noActionsText}>
                {isDeleted ? 'Tin nhắn đã bị xóa' : 'Tin nhắn đã bị thu hồi'}
              </Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <TouchableOpacity onPress={handleReply} style={styles.option}>
              <Icon name="reply" size={24} color={colors.primary} />
              <Text style={styles.optionText}>Trả lời</Text>
            </TouchableOpacity>

            {message.type === 'TEXT' && (
              <TouchableOpacity onPress={handleCopy} style={styles.option}>
                <Icon name="content-copy" size={24} color={colors.primary} />
                <Text style={styles.optionText}>Sao chép</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={handleForward} style={styles.option}>
              <Icon name="forward" size={24} color={colors.primary} />
              <Text style={styles.optionText}>Chuyển tiếp</Text>
            </TouchableOpacity>

            {isMyMessage && !isDeleted && !isRecalled && (
              <TouchableOpacity onPress={handleRecall} style={styles.option} disabled={loading}>
                <Icon name="restore" size={24} color={colors.warning} />
                <Text style={styles.optionText}>Thu hồi</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              onPress={handleDelete} 
              style={styles.option}
              disabled={loading}
            >
              <Icon name="delete" size={24} color={colors.error} />
              <Text style={styles.optionText}>
                {isMyMessage ? 'Xóa cho tất cả' : 'Xóa cho tôi'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    width: '80%',
    padding: spacing.medium,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: {
    marginLeft: spacing.medium,
    fontSize: 16,
    color: colors.text,
  },
  noActionsText: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.grey,
    padding: spacing.medium,
  },
});

export default MessageActions;
