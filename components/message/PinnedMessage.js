import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { messageType } from '../../constants';
import commonFuc from '../../utils/commonFuc';
import { pinMessagesApi } from '../../api/pinMessagesApi';

const PinnedMessage = ({ pinnedMessages, onViewDetail, onViewImage, onUnpin }) => {
  // Hàm xử lý bỏ ghim tin nhắn
  const handleUnpin = async (messageId) => {
    try {
      // Gọi API để bỏ ghim tin nhắn
      await pinMessagesApi.unpinMessage(messageId);
      
      // Hiển thị thông báo thành công
      Alert.alert('Thành công', 'Đã bỏ ghim tin nhắn');
      
      // Gọi callback nếu được truyền vào
      if (typeof onUnpin === 'function') {
        onUnpin(messageId);
      }
    } catch (error) {
      console.error('Error unpinning message:', error);
      Alert.alert('Lỗi', 'Không thể bỏ ghim tin nhắn. Vui lòng thử lại sau.');
    }
  };
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
      <View style={styles.pinnedItemContainer}>
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
        
        {/* Nút bỏ ghim */}
        <TouchableOpacity 
          style={styles.unpinButton}
          onPress={() => handleUnpin(item._id)}
        >
          <FontAwesome name="times" size={16} color="#888" />
        </TouchableOpacity>
      </View>
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
  pinnedItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
    position: 'relative',
  },
  pinnedItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
  unpinButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.0,
    elevation: 2,
    zIndex: 10,
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
