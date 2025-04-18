import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomAvatar from '../CustomAvatar';
import PropTypes from 'prop-types';

// Very simple header component with back button, avatar and text
const MessageHeaderLeft = ({ 
  conversationName = 'Cuộc trò chuyện', 
  avatar = null, 
  avatarColor = '#1982FC', 
  onBack = () => {}, 
  onPress = () => {} 
}) => {
  console.log('[MessageHeaderLeft] Rendering with:', conversationName);
  
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
        
        {/* Avatar */}
        <CustomAvatar
          size={36}
          name={conversationName}
          avatarColor={avatarColor}
          imageUrl={avatar}
        />
        
        {/* Text information */}
        <View style={styles.textSection}>
          <Text style={styles.nameText}>{conversationName}</Text>
          <Text style={styles.statusText}>Đang hoạt động</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

MessageHeaderLeft.propTypes = {
  conversationName: PropTypes.string,
  avatar: PropTypes.string,
  avatarColor: PropTypes.string,
  onBack: PropTypes.func,
  onPress: PropTypes.func,
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    width: 260,
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
});

export default MessageHeaderLeft;