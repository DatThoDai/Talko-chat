import React from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import dateUtils from '../../utils/dateUtils';
import { messageType } from '../../constants';
import CustomAvatar from '../CustomAvatar';

const MessageDetailModal = ({ modalVisible, setModalVisible }) => {
  const { isVisible, message } = modalVisible;

  if (!message || !message._id) {
    return null;
  }

  const {
    content,
    sender,
    createdAt,
    type,
    fileUrl,
    fileName,
    reactions = [],
    isEdited,
    isDeleted,
    viewedBy = [],
  } = message;

  // Close the modal
  const handleClose = () => {
    setModalVisible({
      isVisible: false,
      message: {},
    });
  };

  // Format creation date
  const getFormattedDate = () => {
    return dateUtils.formatMessageDetailTime(createdAt);
  };

  // Render message content preview
  const renderContentPreview = () => {
    if (isDeleted) {
      return (
        <View style={styles.contentPreview}>
          <Text style={styles.deletedText}>Tin nhắn đã được thu hồi</Text>
        </View>
      );
    }

    switch (type) {
      case messageType.IMAGE:
        return (
          <View style={styles.contentPreview}>
            <Image
              source={{ uri: fileUrl }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          </View>
        );
      
      case messageType.VIDEO:
        return (
          <View style={styles.contentPreview}>
            <View style={styles.fileContainer}>
              <Icon name="videocam" size={24} color="#2196F3" />
              <Text style={styles.fileName} numberOfLines={1}>
                {fileName || 'Video'}
              </Text>
            </View>
          </View>
        );
      
      case messageType.FILE:
        return (
          <View style={styles.contentPreview}>
            <View style={styles.fileContainer}>
              <Icon name="document" size={24} color="#2196F3" />
              <Text style={styles.fileName} numberOfLines={1}>
                {fileName || 'Tệp đính kèm'}
              </Text>
            </View>
          </View>
        );
      
      default:
        return (
          <View style={styles.contentPreview}>
            <Text style={styles.contentText}>{content}</Text>
            {isEdited && <Text style={styles.editedText}>(đã chỉnh sửa)</Text>}
          </View>
        );
    }
  };

  // Group reactions by type
  const getGroupedReactions = () => {
    const groupedReactions = {};
    
    reactions.forEach(reaction => {
      const type = reaction.type || '👍';
      if (!groupedReactions[type]) {
        groupedReactions[type] = [];
      }
      groupedReactions[type].push(reaction);
    });

    return Object.entries(groupedReactions).map(([type, reactions]) => ({
      type,
      reactions,
      count: reactions.length,
    }));
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chi tiết tin nhắn</Text>
                <TouchableOpacity onPress={handleClose}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.scrollContent}>
                {/* Sender info */}
                <View style={styles.senderContainer}>
                  <CustomAvatar
                    size={48}
                    name={sender?.name}
                    avatar={sender?.avatar}
                    color={sender?.avatarColor}
                  />
                  <View style={styles.senderInfo}>
                    <Text style={styles.senderName}>{sender?.name}</Text>
                    <Text style={styles.timestamp}>{getFormattedDate()}</Text>
                  </View>
                </View>
                
                {/* Message content */}
                {renderContentPreview()}
                
                {/* Reactions */}
                {reactions.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Phản ứng</Text>
                    <View style={styles.reactionsContainer}>
                      {getGroupedReactions().map((groupedReaction, index) => (
                        <View key={`reaction-${index}`} style={styles.reactionGroup}>
                          <Text style={styles.reactionEmoji}>{groupedReaction.type}</Text>
                          <Text style={styles.reactionCount}>{groupedReaction.count}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                {/* Viewed by */}
                {viewedBy.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Đã xem bởi</Text>
                    {viewedBy.map((viewer, index) => (
                      <View key={`viewer-${index}`} style={styles.viewerItem}>
                        <CustomAvatar
                          size={36}
                          name={viewer.name}
                          avatar={viewer.avatar}
                          color={viewer.avatarColor}
                        />
                        <View style={styles.viewerInfo}>
                          <Text style={styles.viewerName}>{viewer.name}</Text>
                          <Text style={styles.viewTime}>
                            {dateUtils.formatLastViewTime(viewer.viewedAt)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E6E7',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    padding: 16,
  },
  senderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  senderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  contentPreview: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  contentText: {
    fontSize: 16,
    color: '#333',
  },
  editedText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  deletedText: {
    fontSize: 16,
    color: '#888',
    fontStyle: 'italic',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    padding: 12,
    borderRadius: 8,
  },
  fileName: {
    marginLeft: 8,
    color: '#2196F3',
    fontSize: 14,
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reactionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  reactionEmoji: {
    fontSize: 18,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 14,
    color: '#666',
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewerInfo: {
    marginLeft: 12,
  },
  viewerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  viewTime: {
    fontSize: 12,
    color: '#888',
  },
});

export default MessageDetailModal;
