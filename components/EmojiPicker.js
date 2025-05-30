import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
  ActivityIndicator,
  Platform
} from 'react-native';
import { colors, spacing } from '../styles';
import stickerApi from '../api/stickerApi';

// Kết hợp emoji và sticker vào một component
// Bổ sung thêm một số emoji vào danh sách và phân loại
const emojiCategories = [
  {
    name: 'Phổ biến',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '😘', '😗', '😚', '😙', '😋',
      '👍', '👎', '👏', '🙌', '👐', '🤝', '❤️', '💔', '💯', '🔥',
    ]
  },
  {
    name: 'Biểu cảm',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '☺️', '😊',
      '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙',
      '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎',
    ]
  },
  {
    name: 'Động vật',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
    ]
  },
  {
    name: 'Sticker',
    isSticker: true
  }
];

// Danh sách emoji reaction
export const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const { width } = Dimensions.get('window');
const EMOJI_SIZE = 40;
const EMOJI_PER_ROW = 8;
const STICKER_SIZE = 80;
const STICKER_PER_ROW = 4;

const EmojiPicker = ({ visible, onClose, onEmojiSelected, onStickerSelected, title = 'Chọn emoji' }) => {
  const [activeCategory, setActiveCategory] = useState(0);
  const [stickerCollections, setStickerCollections] = useState([]);
  const [loadingSticker, setLoadingSticker] = useState(false);
  const [stickerError, setStickerError] = useState(null);

  // Fetch stickers khi chuyển sang tab Sticker
  useEffect(() => {
    if (activeCategory === emojiCategories.length - 1 && stickerCollections.length === 0 && visible) {
      setLoadingSticker(true);
      stickerApi.fetchSticker()
        .then(res => {
          console.log('Stickers loaded:', res.data?.length || 0);
          setStickerCollections(res.data || []);
          setStickerError(null);
        })
        .catch(error => {
          console.error('Error loading stickers:', error);
          setStickerError('Không thể tải sticker');
        })
        .finally(() => setLoadingSticker(false));
    }
  }, [activeCategory, visible]);

  // Render sticker item
  const renderSticker = ({ item }) => (
    <TouchableOpacity
      style={styles.stickerButton}
      onPress={() => {
        console.log('Sticker pressed:', item);
        if (onStickerSelected && typeof onStickerSelected === 'function') {
          onStickerSelected(item); // item là URL của sticker
        } else {
          console.warn('onStickerSelected is not a function');
        }
      }}
    >
      <Image 
        source={{ uri: item }} 
        style={styles.stickerImage} 
        resizeMode="contain"
        onError={(error) => console.log('Sticker load error:', error)}
      />
    </TouchableOpacity>
  );

  // Render sticker collection
  const renderStickerCollection = ({ item }) => (
    <View style={styles.stickerCollection}>
      <Text style={styles.collectionName}>{item.name}</Text>
      <Text style={styles.collectionDescription}>{item.description}</Text>
      <FlatList
        key={`sticker-grid-${item._id}`}
        data={item.stickers}
        renderItem={renderSticker}
        keyExtractor={(url, idx) => `sticker-${item._id}-${idx}`}
        numColumns={STICKER_PER_ROW}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.stickerGrid}
      />
    </View>
  );

  // Render emoji item
  const renderEmoji = ({ item }) => (
    <TouchableOpacity 
      style={styles.emojiButton} 
      onPress={() => onEmojiSelected && onEmojiSelected(item)}
    >
      <Text style={styles.emoji}>{item}</Text>
    </TouchableOpacity>
  );

  // Để vừa với giao diện nhập tin nhắn, không cần modal
  if (!visible) return null;

  return (
    <View style={styles.inlineContainer}>
      <View style={styles.categoryTabs}>
        {emojiCategories.map((category, index) => (
          <TouchableOpacity
            key={`cat-${index}`}
            style={[
              styles.categoryTab,
              activeCategory === index ? styles.activeCategory : {}
            ]}
            onPress={() => setActiveCategory(index)}
          >
            <Text style={styles.categoryText}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={{ flex: 1 }}>
        {activeCategory === emojiCategories.length - 1 ? (
          // Hiển thị stickers
          loadingSticker ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Đang tải sticker...</Text>
            </View>
          ) : stickerError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{stickerError}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  setStickerError(null);
                  setLoadingSticker(true);
                  stickerApi.fetchSticker()
                    .then(res => {
                      setStickerCollections(res.data || []);
                      setStickerError(null);
                    })
                    .catch(() => setStickerError('Không thể tải sticker'))
                    .finally(() => setLoadingSticker(false));
                }}
              >
                <Text style={styles.retryText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              key="sticker-collections"
              data={stickerCollections}
              renderItem={renderStickerCollection}
              keyExtractor={item => `collection-${item._id}`}
              showsVerticalScrollIndicator={true}
            />
          )
        ) : (
          // Hiển thị emojis
          <FlatList
            key={`emoji-category-${activeCategory}`}
            data={emojiCategories[activeCategory].emojis}
            renderItem={renderEmoji}
            keyExtractor={(item, index) => `emoji-${index}`}
            numColumns={EMOJI_PER_ROW}
            showsVerticalScrollIndicator={false}
            style={styles.emojiList}
          />
        )}
      </View>
    </View>
  );
};

// Component để hiển thị các emoji reaction phổ biến
export const ReactionPicker = ({ onSelect }) => {
  return (
    <View style={styles.reactionContainer}>
      {reactions.map((emoji, index) => (
        <TouchableOpacity
          key={`reaction-${index}`}
          style={styles.reactionButton}
          onPress={() => onSelect(emoji)}
        >
          <Text style={styles.reactionEmoji}>{emoji}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Thêm styles cho sticker
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: spacing.large + (Platform.OS === 'ios' ? 20 : 0), // Extra padding for iOS
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    fontSize: 20,
    color: colors.grey,
    padding: spacing.small,
  },
  emojiList: {
    flexGrow: 0,
  },
  emojiButton: {
    width: width / EMOJI_PER_ROW,
    height: EMOJI_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  reactionContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: spacing.xsmall,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reactionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    marginHorizontal: 2,
  },
  reactionEmoji: {
    fontSize: 18,
  },
  // Thêm styles mới
  inlineContainer: {
    backgroundColor: colors.white,
    height: 250,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  categoryTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  activeCategory: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: colors.text,
  },
  stickerButton: {
    width: (width - 40) / STICKER_PER_ROW - 10,
    height: STICKER_SIZE,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  stickerImage: {
    width: '90%',
    height: '90%',
    borderRadius: 4,
  },
  stickerCollection: {
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  collectionDescription: {
    fontSize: 12,
    color: colors.grey,
    marginBottom: 10,
  },
  stickerGrid: {
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: colors.grey,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: colors.error,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryText: {
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default EmojiPicker;
