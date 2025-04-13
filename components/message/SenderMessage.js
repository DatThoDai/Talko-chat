import React from 'react';
import PropTypes from 'prop-types';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { messageType } from '../../constants';
import CustomAvatar from '../CustomAvatar';

function SenderMessage(props) {
  const {
    message,
    handleOpenOptionModal,
    handleShowReactDetails,
    content,
    time,
    reactVisibleInfo,
    reactLength,
    handleViewImage,
  } = props;

  const { type, sender, fileUrl } = message;

  // Render appropriate message content based on type
  const renderContent = () => {
    switch (type) {
      case messageType.IMAGE:
        return (
          <TouchableWithoutFeedback
            onPress={() => handleViewImage(fileUrl, sender?.name)}>
            <Image
              source={{ uri: fileUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableWithoutFeedback>
        );
      
      case messageType.FILE:
        return (
          <View style={styles.fileContainer}>
            <Icon name="document-outline" size={24} color="#2196F3" />
            <Text style={styles.fileName} numberOfLines={1}>
              {message.fileName || 'Tệp đính kèm'}
            </Text>
          </View>
        );
      
      case messageType.VIDEO:
        return (
          <TouchableWithoutFeedback
            onPress={() => handleViewImage(fileUrl, sender?.name, false)}>
            <View style={styles.videoContainer}>
              <Image
                source={{ uri: message.thumbnail || fileUrl }}
                style={styles.videoThumbnail}
                resizeMode="cover"
              />
              <View style={styles.playButton}>
                <Icon name="play" size={24} color="#FFFFFF" />
              </View>
            </View>
          </TouchableWithoutFeedback>
        );
      
      default:
        return <Text style={styles.content}>{content}</Text>;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <CustomAvatar
          size={36}
          name={sender?.name}
          avatar={sender?.avatar}
          color={sender?.avatarColor}
        />
      </View>
      
      <View style={styles.messageContainer}>
        <TouchableWithoutFeedback onLongPress={handleOpenOptionModal}>
          <View style={styles.messageContent}>
            <Text style={styles.senderName}>{sender?.name}</Text>
            {renderContent()}
            <Text style={styles.time}>{time}</Text>
          </View>
        </TouchableWithoutFeedback>
        
        {reactLength > 0 && (
          <TouchableOpacity
            style={styles.reactContainer}
            onPress={handleShowReactDetails}>
            <Text style={styles.reactText}>{reactVisibleInfo}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  avatarContainer: {
    marginRight: 8,
  },
  messageContainer: {
    maxWidth: '75%',
  },
  messageContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  senderName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  content: {
    fontSize: 15,
    color: '#333',
  },
  time: {
    fontSize: 11,
    color: '#888',
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  reactContainer: {
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    padding: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-end',
    marginTop: 4,
    marginRight: 8,
  },
  reactText: {
    fontSize: 12,
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginVertical: 4,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF4FB',
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
  },
  fileName: {
    marginLeft: 8,
    color: '#2196F3',
    fontSize: 14,
    flex: 1,
  },
  videoContainer: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginVertical: 4,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  playButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

SenderMessage.propTypes = {
  message: PropTypes.object,
  handleOpenOptionModal: PropTypes.func,
  handleShowReactDetails: PropTypes.func,
  content: PropTypes.string,
  time: PropTypes.string,
  reactVisibleInfo: PropTypes.string,
  reactLength: PropTypes.number,
  handleViewImage: PropTypes.func,
};

SenderMessage.defaultProps = {
  message: {},
  handleOpenOptionModal: null,
  handleShowReactDetails: null,
  content: '',
  time: '',
  reactVisibleInfo: '',
  reactLength: 0,
  handleViewImage: null,
};

export default SenderMessage;
