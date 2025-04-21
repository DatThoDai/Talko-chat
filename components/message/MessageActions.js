import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  Animated,
  Dimensions,
  Vibration,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { colors, spacing } from '../../styles';
import { messageApi } from '../../api/messageApi';
import { pinMessagesApi } from '../../api/pinMessagesApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MessageActions = ({
  visible = false,
  onClose = () => {},
  message = {},
  currentUserId = '',
  onReply = () => {},
  onSelect = () => {},
  onPressRecall = null,
  navigation = {},
  conversationId = '',
  position = null,
}) => {
  const [loading, setLoading] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));
  
  // Animated entry effect
  useEffect(() => {
    if (visible) {
      // Vibrate to give feedback
      Vibration.vibrate(50);
      
      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations when closed
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);
  
  // Cải thiện logic xác định tin nhắn của mình
  const isMyMessage = message?.userId === currentUserId || 
                     message?.sender?._id === currentUserId || 
                     message?.senderId === currentUserId ||
                     message?.isMyMessage === true ||
                     message?.isMine === true;

  // Check if message is already deleted or recalled
  const isDeleted = message?.isDeleted;
  const isRecalled = message?.manipulatedUserIds?.includes(message.userId) || message?.isRecalled;

  // Close the modal
  const handleClose = () => {
    // Animate out
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Handle message reply
  const handleReply = () => {
    onReply(message);
    handleClose();
  };

  // Handle message copy
  const handleCopy = () => {
    onSelect(message.content);
    handleClose();
  };

  // Handle message recall (undo send - only for sender)
  const handleRecall = async () => {
    if (!isMyMessage) return;
    
    try {
      setLoading(true);
      
      // Use the onPressRecall prop if available
      if (typeof onPressRecall === 'function') {
        await onPressRecall(message._id);
      } else {
        // Fallback to direct API call if no callback provided
        await messageApi.recallMessage(message._id);
        
        // Update message state to show recall status
        message.content = MESSAGE_RECALL_TEXT;
        message.status = 'recalled';
        message.isRecalled = true;
        message.isDeleted = false;
      }
      
      // Thêm log để debug
      console.log('Tin nhắn đã được thu hồi thành công:', message._id);
      
      handleClose();
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
      
      // Update UI immediately after successful API call
      if (typeof onClose === 'function') {
        onClose();
      }
      
      // Force a re-render by updating the message's isDeleted flag
      message.isDeleted = true;
      
      // Show success feedback
      Alert.alert('Thành công', 'Tin nhắn đã được xóa');
    } catch (error) {
      console.error('Error deleting message:', error);
      Alert.alert('Lỗi', 'Không thể xóa tin nhắn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle message pin
  const handlePin = async () => {
    try {
      setLoading(true);
      
      // Call the pinMessage API
      await pinMessagesApi.pinMessage(message._id);
      
      // Update UI immediately
      message.isPinned = true;
      
      handleClose();
      
      // Show success feedback
      Alert.alert('Thành công', 'Tin nhắn đã được ghim');
    } catch (error) {
      console.error('Error pinning message:', error);
      Alert.alert('Lỗi', 'Không thể ghim tin nhắn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle message unpin
  const handleUnpin = async () => {
    try {
      setLoading(true);
      
      // Call the unpinMessage API
      await pinMessagesApi.unpinMessage(message._id);
      
      // Update UI immediately
      message.isPinned = false;
      
      handleClose();
      
      // Show success feedback
      Alert.alert('Thành công', 'Tin nhắn đã được bỏ ghim');
    } catch (error) {
      console.error('Error unpinning message:', error);
      Alert.alert('Lỗi', 'Không thể bỏ ghim tin nhắn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Handle message forward
  const handleForward = () => {
    handleClose();
    
    // Check if navigation is available before trying to use it
    if (navigation && navigation.navigate) {
      // Lấy thông tin cần thiết từ message để chuyển tiếp
      const messageContent = message.content || '';
      const messageType = message.type || 'TEXT';
      const fileUrl = message.fileUrl || '';
      const fileName = message.fileName || '';
      
      // Điều hướng đến màn hình ForwardMessage với đầy đủ thông tin
      navigation.navigate('ForwardMessage', {
        messageId: message._id,
        currentConversationId: conversationId,
        originalContent: messageContent,
        messageType: messageType,
        fileUrl: fileUrl,
        fileName: fileName
      });
    } else {
      // Handle case when navigation is not available
      Alert.alert(
        'Thông báo',
        'Không thể chuyển tiếp tin nhắn vào lúc này',
        [{ text: 'OK' }]
      );
    }
  };

  // Position the menu near the message
  const menuStyle = position ? {
    position: 'absolute',
    top: position.y - 120, // Adjust based on menu height
    left: Math.min(position.x, SCREEN_WIDTH - 230), // Prevent menu from going off-screen
  } : {};

  // Render only actions that are relevant to the message
  // Don't show actions for deleted or recalled messages
  if (isDeleted || isRecalled) {
    return (
      <Modal
        transparent
        visible={visible}
        animationType="none"
        onRequestClose={handleClose}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlay}>
            <Animated.View 
              style={[
                styles.limitedContainer, 
                menuStyle,
                {
                  transform: [{ scale: scaleAnim }],
                  opacity: opacityAnim,
                }
              ]}
            >
              <View style={styles.bubbleArrow} />
              <Text style={styles.noActionsText}>
                {isDeleted ? 'Tin nhắn đã bị xóa' : 'Tin nhắn đã bị thu hồi'}
              </Text>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <Animated.View 
            style={[
              styles.actionsContainer, 
              menuStyle,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              }
            ]}
          >
            <View style={styles.bubbleArrow} />
            {/* Top row - 3 buttons */}
            <View style={styles.actionsRow}>
              {/* Reply button */}
              <TouchableOpacity onPress={handleReply} style={styles.actionButton}>
                <View style={[styles.iconContainer, styles.replyIcon]}>
                  <FontAwesome name="reply" size={16} color="#ffffff" />
                </View>
                <Text style={styles.actionText}>Trả lời</Text>
              </TouchableOpacity>

              {/* Copy button - only for text messages */}
              {message.type === 'TEXT' ? (
                <TouchableOpacity onPress={handleCopy} style={styles.actionButton}>
                  <View style={[styles.iconContainer, styles.copyIcon]}>
                    <FontAwesome name="copy" size={16} color="#ffffff" />
                  </View>
                  <Text style={styles.actionText}>Sao chép</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleForward} style={styles.actionButton}>
                  <View style={[styles.iconContainer, styles.forwardIcon]}>
                    <FontAwesome name="share" size={16} color="#ffffff" />
                  </View>
                  <Text style={styles.actionText}>Chuyển</Text>
                </TouchableOpacity>
              )}

              {/* Pin/Unpin Button */}
              {!isDeleted && !isRecalled && (
                message.isPinned ? (
                  <TouchableOpacity onPress={handleUnpin} style={styles.actionButton} disabled={loading}>
                    <View style={[styles.iconContainer, styles.unpinIcon]}>
                      <FontAwesome name="bookmark-o" size={16} color="#ffffff" />
                    </View>
                    <Text style={styles.actionText}>Bỏ ghim</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={handlePin} style={styles.actionButton} disabled={loading}>
                    <View style={[styles.iconContainer, styles.pinIcon]}>
                      <FontAwesome name="bookmark" size={16} color="#ffffff" />
                    </View>
                    <Text style={styles.actionText}>Ghim</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
            
            {/* Bottom row - 3 buttons */}
            <View style={styles.actionsRow}>
              {/* If it's a text message, show Forward here (to balance the rows) */}
              {message.type === 'TEXT' && (
                <TouchableOpacity onPress={handleForward} style={styles.actionButton}>
                  <View style={[styles.iconContainer, styles.forwardIcon]}>
                    <FontAwesome name="share" size={16} color="#ffffff" />
                  </View>
                  <Text style={styles.actionText}>Chuyển</Text>
                </TouchableOpacity>
              )}
              
              {/* Recall button - only for my messages */}
              {isMyMessage && !isDeleted && !isRecalled && onPressRecall !== null ? (
                <TouchableOpacity onPress={handleRecall} style={styles.actionButton} disabled={loading}>
                  <View style={[styles.iconContainer, styles.recallIcon]}>
                    <FontAwesome name="history" size={16} color="#ffffff" />
                  </View>
                  <Text style={styles.actionText}>Thu hồi</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.emptySlot} />
              )}

              {/* Delete button */}
              <TouchableOpacity 
                onPress={handleDelete} 
                style={styles.actionButton}
                disabled={loading}
              >
                <View style={[styles.iconContainer, styles.deleteIcon]}>
                  <FontAwesome name="trash" size={16} color="#ffffff" />
                </View>
                <Text style={styles.actionText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 8,
    width: 210,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  bubbleArrow: {
    position: 'absolute',
    bottom: -10,
    left: 30,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'white',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    width: 56,
    marginBottom: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  replyIcon: {
    backgroundColor: '#4CAF50',
  },
  copyIcon: {
    backgroundColor: '#2196F3',
  },
  forwardIcon: {
    backgroundColor: '#03A9F4',
  },
  pinIcon: {
    backgroundColor: '#8E44AD',
  },
  unpinIcon: {
    backgroundColor: '#9C27B0',
  },
  recallIcon: {
    backgroundColor: '#FF9800',
  },
  deleteIcon: {
    backgroundColor: '#F44336',
  },
  actionText: {
    fontSize: 10,
    textAlign: 'center',
    color: '#212121',
  },
  emptySlot: {
    width: 56,
    height: 56,
  },
  limitedContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    width: 180,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  noActionsText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#757575',
  }
});

export default MessageActions;