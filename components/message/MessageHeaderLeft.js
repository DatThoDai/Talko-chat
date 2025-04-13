import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomAvatar from '../CustomAvatar';

const MessageHeaderLeft = ({
  conversationName,
  avatar,
  avatarColor,
  onBack,
  onPress,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}>
        <Icon name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.conversationInfo}
        onPress={onPress}
        activeOpacity={0.7}>
        <CustomAvatar
          size={40}
          name={conversationName}
          avatar={avatar}
          color={avatarColor}
        />
        <View style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {conversationName}
          </Text>
          <Text style={styles.status}>Đang hoạt động</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 0,
  },
  backButton: {
    padding: 8,
    marginRight: 5,
  },
  conversationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '82%',
  },
  textContainer: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  status: {
    fontSize: 12,
    color: '#4CAF50',
  },
});

export default MessageHeaderLeft;
