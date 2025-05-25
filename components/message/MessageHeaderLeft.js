import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // Thêm dòng này
import CustomAvatar from '../CustomAvatar';
import PropTypes from 'prop-types';

// Very simple header component with back button, avatar and text
const MessageHeaderLeft = ({ 
  conversationName = 'Cuộc trò chuyện', 
  avatar = null, 
  avatarColor = '#1982FC', 
  isGroup = false, 
  onBack = () => {}, 
  onPress = () => {},
  onVideoCall = () => {} // Thêm prop này
}) => {
  console.log('[MessageHeaderLeft] Rendering with:', conversationName);
  console.log('[MessageHeaderLeft] Rendering with name:', conversationName, 'isGroup:', isGroup);
  
  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}>
        <Icon name="arrow-back" size={28} color="#fff" />
      </TouchableOpacity>
      
      {/* Avatar and text */}
      <TouchableOpacity 
        style={styles.profileSection}
        onPress={onPress}>
        
        {/* Avatar - hiển thị khác nhau dựa trên isGroup */}
        {isGroup ? (
          <View style={styles.groupAvatarContainer}>
            <CustomAvatar
              size={36}
              name={conversationName}
              avatarColor={avatarColor}
              imageUrl={avatar}
            />
            <Icon name="people" size={16} color="#fff" style={styles.groupIcon} />
          </View>
        ) : (
          <CustomAvatar
            size={36}
            name={conversationName}
            avatarColor={avatarColor}
            imageUrl={avatar}
          />
        )}
        
        {/* Text information */}
        <View style={styles.textSection}>
          <Text style={styles.nameText}>{conversationName || 'Cuộc trò chuyện'}</Text>
          <Text style={styles.statusText}>
            {isGroup ? 'Nhóm chat' : 'Đang hoạt động'}
          </Text>
        </View>
      </TouchableOpacity>
      
      {/* Thêm nút gọi video */}
      <TouchableOpacity
        style={styles.videoCallButton}
        onPress={onVideoCall}>
        <MaterialIcons name="video-call" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

MessageHeaderLeft.propTypes = {
  conversationName: PropTypes.string,
  avatar: PropTypes.string,
  avatarColor: PropTypes.string,
  isGroup: PropTypes.bool,
  onBack: PropTypes.func,
  onPress: PropTypes.func,
  onVideoCall: PropTypes.func, // Thêm prop type cho onVideoCall
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    width: 300, // Tăng width để chứa thêm nút gọi video
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textSection: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  groupAvatarContainer: {
    position: 'relative',
  },
  groupIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1982FC',
    borderRadius: 8,
    padding: 2,
  },
  videoCallButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default MessageHeaderLeft;