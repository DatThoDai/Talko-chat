import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { messageType } from '../../constants';
import commonFuc from '../../utils/commonFuc';

const PinnedMessage = ({ pinnedMessages, onViewDetail, onViewImage }) => {
  if (!pinnedMessages || pinnedMessages.length === 0) {
    return null;
  }

  // Render content preview based on message type
  const renderContentPreview = (message) => {
    const { type, content, fileUrl, fileName } = message;

    switch (type) {
      case messageType.IMAGE:
        return (
          <TouchableOpacity
            onPress={() => onViewImage({
              isVisible: true,
              userName: message.sender?.name || 'Người dùng',
              content: [{ url: fileUrl }],
              isImage: true
            })}>
            <Image
              source={{ uri: fileUrl }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          </TouchableOpacity>
        );
      
      case messageType.VIDEO:
        return (
          <View style={styles.filePreview}>
            <Icon name="videocam" size={18} color="#2196F3" />
            <Text style={styles.filePreviewText} numberOfLines={1}>
              {fileName || 'Video'}
            </Text>
          </View>
        );
      
      case messageType.FILE:
        return (
          <View style={styles.filePreview}>
            <Icon name="document" size={18} color="#2196F3" />
            <Text style={styles.filePreviewText} numberOfLines={1}>
              {fileName || 'Tệp đính kèm'}
            </Text>
          </View>
        );
      
      default:
        return (
          <Text style={styles.contentPreview} numberOfLines={1}>
            {commonFuc.truncateText(content, 30)}
          </Text>
        );
    }
  };

  // Render a single pinned message item
  const renderPinnedItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.pinnedItem}
        onPress={() => onViewDetail({
          isVisible: true,
          message: item
        })}>
        <View style={styles.pinnedIconContainer}>
          <Icon name="bookmark" size={16} color="#FFFFFF" />
        </View>
        
        <View style={styles.pinnedContent}>
          <Text style={styles.pinnedBy}>
            Ghim bởi {item.pinnedBy?.name || 'Người dùng'}
          </Text>
          {renderContentPreview(item)}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={pinnedMessages}
        keyExtractor={item => `pinned-${item._id}`}
        renderItem={renderPinnedItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F2F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E6E7',
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  pinnedItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 4,
    padding: 8,
    alignItems: 'center',
    maxWidth: 250,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  pinnedIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  pinnedContent: {
    flex: 1,
  },
  pinnedBy: {
    fontSize: 10,
    color: '#888',
    marginBottom: 2,
  },
  contentPreview: {
    fontSize: 13,
    color: '#333',
  },
  imagePreview: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginTop: 4,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 4,
    padding: 4,
    marginTop: 4,
  },
  filePreviewText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 4,
    flex: 1,
  },
});

export default PinnedMessage;
