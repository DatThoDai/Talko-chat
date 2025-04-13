import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useDispatch, useSelector} from 'react-redux';
import {sendMessage} from '../redux/chatSlice';

// Default emoji sets
const EMOJI_SETS = [
  {
    name: 'Thường dùng',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
      '👍', '👎', '👏', '🙌', '🤝', '👊', '✌️', '🤞', '🤟', '🤘',
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '❣️', '💕',
    ],
  },
  {
    name: 'Cảm xúc',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '☺️', '😊',
      '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙',
      '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎',
      '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️',
    ],
  },
  {
    name: 'Động vật',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒',
      '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇',
      '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
    ],
  },
  {
    name: 'Thức ăn',
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈',
      '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦',
      '🥬', '🥒', '🌶', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐',
      '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇',
    ],
  },
];

const {width} = Dimensions.get('window');

const StickyBoard = ({height = 250, visible, setVisible}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [stickerSets, setStickerSets] = useState([]);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const {conversations} = useSelector(state => state.chat);

  // Load sticker sets
  useEffect(() => {
    if (visible) {
      loadStickerSets();
    }
  }, [visible]);

  // Load sticker sets (in a real app, this would be from an API)
  const loadStickerSets = async () => {
    setLoading(true);
    try {
      // In a real app, you'd fetch stickers from an API
      // For now, we'll just use the emoji sets
      setStickerSets(EMOJI_SETS);
      setLoading(false);
    } catch (error) {
      console.error('Error loading sticker sets:', error);
      setLoading(false);
    }
  };

  // Send emoji or sticker as a message
  const handleSendEmoji = (emoji) => {
    const activeConversation = conversations.find(c => c.active);
    if (!activeConversation) return;

    dispatch(sendMessage({
      conversationId: activeConversation._id,
      content: emoji,
    }))
      .unwrap()
      .then(() => {
        // Success
      })
      .catch((error) => {
        console.error('Error sending emoji:', error);
      });
  };

  // Render header tabs for switching between emoji categories
  const renderTabs = () => {
    return (
      <View style={styles.tabsContainer}>
        {stickerSets.map((set, index) => (
          <TouchableOpacity
            key={`tab-${index}`}
            style={[styles.tab, activeTab === index && styles.activeTab]}
            onPress={() => setActiveTab(index)}>
            <Text style={[styles.tabText, activeTab === index && styles.activeTabText]}>
              {set.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render emojis grid
  const renderEmojis = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }

    if (!stickerSets[activeTab]) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không có sticker</Text>
        </View>
      );
    }

    const currentEmojis = stickerSets[activeTab].emojis;

    return (
      <FlatList
        data={currentEmojis}
        keyExtractor={(item, index) => `emoji-${index}`}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.emojiContainer}
            onPress={() => handleSendEmoji(item)}>
            <Text style={styles.emoji}>{item}</Text>
          </TouchableOpacity>
        )}
        numColumns={8}
        contentContainerStyle={styles.emojiGrid}
      />
    );
  };

  if (!visible) return null;

  return (
    <View style={[styles.container, {height}]}>
      <View style={styles.header}>
        <Text style={styles.title}>Biểu tượng cảm xúc</Text>
        <TouchableOpacity onPress={() => setVisible(false)}>
          <Icon name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      
      {renderTabs()}
      {renderEmojis()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E6E7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E6E7',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E6E7',
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: '#E6F2FF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  emojiGrid: {
    padding: 8,
  },
  emojiContainer: {
    width: width / 8 - 8,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
  },
  emoji: {
    fontSize: 24,
  },
});

export default StickyBoard;
