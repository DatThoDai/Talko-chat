import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors } from '../../styles';
import CustomAvatar from '../CustomAvatar'; // Thay Avatar bằng CustomAvatar

const IncomingCallModal = ({ 
  visible, 
  caller, 
  conversationName, 
  onAccept, 
  onReject 
}) => {
  // Tạo hiệu ứng rung khi có cuộc gọi đến
  useEffect(() => {
    let intervalId;
    
    if (visible) {
      // Rung liên tục
      if (Platform.OS === 'android') {
        // Rung theo mẫu cuộc gọi trên Android
        Vibration.vibrate([500, 1000, 500, 1000], true);
      } else {
        // iOS sử dụng cách tiếp cận khác
        intervalId = setInterval(() => {
          Vibration.vibrate();
        }, 1500);
      }
    }
    
    return () => {
      // Dừng rung khi đóng modal
      Vibration.cancel();
      if (intervalId) clearInterval(intervalId);
    };
  }, [visible]);
  
  // Kiểm tra dữ liệu người gọi
  const callerName = caller?.name || 'Người dùng';
  const callerAvatar = caller?.avatar || '';
  const callerAvatarColor = caller?.avatarColor || colors.primary;
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.container}>
        <View style={styles.callCard}>
          <Text style={styles.title}>Cuộc gọi video đến</Text>
          
          {/* Thông tin người gọi */}
          <View style={styles.callerInfo}>
            <CustomAvatar 
              imageUrl={callerAvatar} // Thay uri bằng imageUrl
              name={callerName}
              avatarColor={callerAvatarColor} // Thay color bằng avatarColor
              size={80}
            />
            <Text style={styles.callerName}>{callerName}</Text>
            <Text style={styles.conversationName}>
              {conversationName || 'Cuộc trò chuyện'}
            </Text>
          </View>
          
          {/* Nút điều khiển */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={onReject}
            >
              <Icon name="close-circle" size={30} color="#fff" />
              <Text style={styles.actionText}>Từ chối</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptButton]}
              onPress={onAccept}
            >
              <Icon name="videocam" size={30} color="#fff" />
              <Text style={styles.actionText}>Chấp nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  callCard: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.primary,
  },
  callerInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  callerName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
    color: '#000',
  },
  conversationName: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  actionButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 50,
    width: 120,
  },
  rejectButton: {
    backgroundColor: '#E53935',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  actionText: {
    color: '#fff',
    marginTop: 5,
    fontWeight: 'bold',
  },
});

export default IncomingCallModal;