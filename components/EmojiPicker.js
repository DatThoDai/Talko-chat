import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Modal,
  Platform
} from 'react-native';
import { colors, spacing } from '../styles';

// Danh sách emoji phổ biến
const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '😘', '😗', '😚', '😙', '😋',
  '😛', '😜', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
  '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😌', '😔', '😪',
  '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😵', '🤯',
  '👍', '👎', '👏', '🙌', '👐', '🤝', '💋', '❤️', '💔', '😢',
  '😭', '😡', '🔥', '💯', '⭐', '🎉', '🎂', '🎁', '👻', '💩'
];

// Danh sách emoji reaction
export const reactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const { width } = Dimensions.get('window');
const EMOJI_SIZE = 40;
const EMOJI_PER_ROW = 8;

const EmojiPicker = ({ visible, onClose, onEmojiSelected, title = 'Chọn emoji' }) => {
  const renderEmoji = ({ item }) => (
    <TouchableOpacity 
      style={styles.emojiButton} 
      onPress={() => {
        onEmojiSelected(item);
        onClose();
      }}
    >
      <Text style={styles.emoji}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          activeOpacity={1}
          style={styles.container}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={emojis}
            renderItem={renderEmoji}
            keyExtractor={(item, index) => `emoji-${index}`}
            numColumns={EMOJI_PER_ROW}
            showsVerticalScrollIndicator={false}
            style={styles.emojiList}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
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
  }
});

export default EmojiPicker;
