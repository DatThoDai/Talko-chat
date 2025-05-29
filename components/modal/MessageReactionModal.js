import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';

// Import REACTIONS từ constants
let REACTIONS;
try {
  const constants = require('../../constants/index');
  REACTIONS = constants.REACTIONS;
} catch (error) {
  console.warn('Could not import REACTIONS from constants, using fallback');
  REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];
}

const MessageReactionModal = ({ visible, position, onClose, onReactionSelected }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animation khi hiển thị
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
      // Reset animations khi đóng
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  // Tính toán vị trí dựa vào điểm nhấn
  const getContainerStyle = () => {
    if (!position) {
      return { top: 150, left: 20 };
    }
    
    const { x, y } = position;
    const { width } = Dimensions.get('window');
    
    // Cố định kích thước giống với MessageActions
    const reactionWidth = 210; 
    
    // Đặt ở giữa theo chiều ngang
    let left = x - (reactionWidth / 2);
    
    // Đảm bảo không vượt quá màn hình
    if (left < 10) left = 10;
    if (left + reactionWidth > width - 10) left = width - 10 - reactionWidth;
    
    return {
      top: y,
      left,
      width: reactionWidth, // Cùng kích thước với MessageActions
    };
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.reactionsContainer,
              getContainerStyle(),
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            {REACTIONS.map((emoji, index) => (
              <TouchableOpacity
                key={`reaction-${index}`}
                style={styles.reactionButton}
                onPress={() => onReactionSelected(emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  reactionsContainer: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 16, // Cùng bo góc với MessageActions
    paddingVertical: 8,
    paddingHorizontal: 6, // Giảm padding để nhỏ gọn hơn
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    height: 46, // Chiều cao cố định để cân đối với MessageActions
  },
  reactionButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    minWidth: 30, // Giảm kích thước nút
    minHeight: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmoji: {
    fontSize: 16, // Giảm kích thước emoji
    textAlign: 'center',
  },
});

export default MessageReactionModal;