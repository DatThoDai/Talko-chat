import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableWithoutFeedback,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions
} from 'react-native';
import { REACTIONS } from '../../constants/index';
import { colors } from '../../styles';

const MessageReactionModal = ({ visible, position, onClose, onReactionSelected }) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    if (visible) {
      // Reset animation values first
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      
      // Start animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  // Calculate position based on where the message was pressed
  const getContainerStyle = () => {
    if (!position) return { top: 100, left: 20 };
    
    const { x, y } = position;
    const { width } = Dimensions.get('window');
    
    // Đặt reaction bar phía trên vị trí nhấn, cách xa hơn để không che menu chính
    const top = y - 80;
    
    // Căn giữa theo chiều ngang
    const reactionBarWidth = REACTIONS.length * 40 + 24; // Ước tính chiều rộng
    let left = x - (reactionBarWidth / 2);
    
    // Điều chỉnh nếu sẽ bị tràn ra ngoài màn hình
    if (left < 10) left = 10;
    if (left + reactionBarWidth > width - 10) left = width - 10 - reactionBarWidth;
    
    return { top, left };
  };

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.reactionsContainer,
              getContainerStyle(),
              {
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            {REACTIONS.map((reaction, index) => (
              <TouchableOpacity
                key={index}
                style={styles.reactionButton}
                onPress={() => {
                  onReactionSelected(reaction);
                  onClose();
                }}
              >
                <Text style={styles.reactionEmoji}>{reaction}</Text>
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
    position: 'relative',
  },
  reactionsContainer: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1001, // Đảm bảo hiển thị trên MessageActions
  },
  reactionButton: {
    marginHorizontal: 8,
    padding: 5,
  },
  reactionEmoji: {
    fontSize: 24,
  }
});

export default MessageReactionModal;