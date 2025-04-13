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

function ReceiverMessage(props) {
  const {
    message,
    handleOpenOptionModal,
    handleShowReactDetails,
    content,
    time,
    reactVisibleInfo,
    reactLength,
    handleViewImage,
    isLastMessage,
    onLastView,
  } = props;

  const { type, fileUrl, _id } = message;

  // Render appropriate message content based on type
  const renderContent = () => {
    switch (type) {
      case messageType.IMAGE:
        return (
          <TouchableWithoutFeedback
            onPress={() => handleViewImage(fileUrl, 'Bạn')}>
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
            <Icon name="document-outline" size={24} color="#FFFFFF" />
            <Text style={styles.fileName} numberOfLines={1}>
              {message.fileName || 'Tệp đính kèm'}
            </Text>
          </View>
        );
      
      case messageType.VIDEO:
        return (
          <TouchableWithoutFeedback
            onPress={() => handleViewImage(fileUrl, 'Bạn', false)}>
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
      <View style={styles.messageContainer}>
        <TouchableWithoutFeedback onLongPress={handleOpenOptionModal}>
          <View style={styles.messageContent}>
            {renderContent()}
            <View style={styles.timeContainer}>
              <Text style={styles.time}>{time}</Text>
              
              {isLastMessage && (
                <TouchableOpacity
                  onPress={() => onLastView && onLastView(_id)}
                  style={styles.seenButton}>
                  <Text style={styles.seenText}>Đã xem</Text>
                </TouchableOpacity>
              )}
            </View>
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
    justifyContent: 'flex-end',
  },
  messageContainer: {
    maxWidth: '75%',
  },
  messageContent: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
    alignSelf: 'flex-end',
  },
  content: {
    fontSize: 15,
    color: '#FFFFFF',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  time: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  seenButton: {
    marginLeft: 5,
  },
  seenText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  reactContainer: {
    backgroundColor: '#F0F2F5',
    borderRadius: 10,
    padding: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
    marginLeft: 8,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
  },
  fileName: {
    marginLeft: 8,
    color: '#FFFFFF',
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

ReceiverMessage.propTypes = {
  message: PropTypes.object,
  handleOpenOptionModal: PropTypes.func,
  handleShowReactDetails: PropTypes.func,
  content: PropTypes.string,
  time: PropTypes.string,
  reactVisibleInfo: PropTypes.string,
  reactLength: PropTypes.number,
  handleViewImage: PropTypes.func,
  isLastMessage: PropTypes.bool,
  onLastView: PropTypes.func,
};

ReceiverMessage.defaultProps = {
  message: {},
  handleOpenOptionModal: null,
  handleShowReactDetails: null,
  content: '',
  time: '',
  reactVisibleInfo: '',
  reactLength: 0,
  handleViewImage: null,
  isLastMessage: false,
  onLastView: null,
};

export default ReceiverMessage;
