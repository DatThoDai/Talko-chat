import React from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {addReaction} from '../../redux/chatSlice';
import CustomAvatar from '../CustomAvatar';
// Ensure REACTIONS is imported from the correct path
import {REACTIONS} from '../../constants/index';

const ReactionModal = ({reactProps, setReactProps}) => {
  const dispatch = useDispatch();
  // Sửa tên trường từ 'reacts' thành 'reactions' để khớp với MessageScreen
  const {isVisible, messageId, reactions = []} = reactProps || {}; // Thêm fallback khi reactProps là undefined

  // Function to close the modal
  const handleClose = () => {
    setReactProps({
      isVisible: false,
      messageId: '',
      reactions: [], // Sửa từ reacts thành reactions để khớp với DEFAULT_REACTION_MODAL_VISIBLE
    });
  };

  // Function to add a reaction
  const handleAddReaction = (reactionType) => {
    if (!messageId) return;

    dispatch(addReaction({
      messageId,
      reactionType,
    }))
    .unwrap()
    .then(() => {
      handleClose();
    })
    .catch((error) => {
      console.error('Failed to add reaction:', error);
    });
  };

  // Render reaction selector at the top
  const renderReactionSelector = () => {
    // Check if REACTIONS is defined to prevent map errors
    const emojiReactions = REACTIONS || ['👍', '♥️', '😄', '😲', '😭', '😡'];
    
    return (
      <View style={styles.reactionsSelector}>
        {emojiReactions.map((reaction, index) => (
          <TouchableOpacity
            key={`reaction-${index}`}
            style={styles.reactionItem}
            onPress={() => handleAddReaction(reaction)}>
            <Text style={styles.reactionEmoji}>{reaction}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Group reactions by type
  const groupReactionsByType = () => {
    // Đảm bảo reactions luôn là một mảng
    if (!Array.isArray(reactions) || reactions.length === 0) return [];
    
    // Handle case when any reaction is undefined
    const validReactions = reactions.filter(reaction => reaction != null);

    const groupedReactions = {};
    
    validReactions.forEach(reaction => {
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

  // Render a single reaction group
  const renderReactionGroup = ({item}) => {
    // Ensure we have valid item with all required properties
    if (!item) return null;
    
    const {type = '👍', reactions = [], count = 0} = item;

    return (
      <View style={styles.reactionGroup}>
        <View style={styles.reactionHeader}>
          <Text style={styles.reactionEmoji}>{type}</Text>
          <Text style={styles.reactionCount}>{count}</Text>
        </View>
        
        <FlatList
          data={Array.isArray(reactions) ? reactions : []}
          keyExtractor={(item, index) => `reaction-user-${index}-${(item && item.userId) || index}`}
          renderItem={({item}) => (
            item ? (
            <View style={styles.userItem}>
              <CustomAvatar
                size={36}
                name={item.userName}
                avatar={item.userAvatar}
                color={item.userAvatarColor}
              />
              <Text style={styles.userName}>{item.userName || 'Unknown User'}</Text>
            </View>
            ) : null
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  // Ensure we have valid props
  const safeIsVisible = Boolean(isVisible);
  
  return (
    <Modal
      transparent
      visible={safeIsVisible}
      animationType="fade"
      onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Phản ứng</Text>
                <TouchableOpacity onPress={handleClose}>
                  <Text style={styles.closeButton}>Đóng</Text>
                </TouchableOpacity>
              </View>
              
              {renderReactionSelector()}
              
              <FlatList
                data={groupReactionsByType()}
                keyExtractor={(item) => `reaction-group-${(item && item.type) || 'unknown'}`}
                renderItem={renderReactionGroup}
                contentContainerStyle={styles.reactionList}
                showsVerticalScrollIndicator={false}
              />
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
    width: '80%',
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
  closeButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  reactionsSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E6E7',
  },
  reactionItem: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionList: {
    padding: 16,
  },
  reactionGroup: {
    marginBottom: 16,
  },
  reactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reactionEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  reactionCount: {
    fontSize: 16,
    color: '#666',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  userName: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
});

export default ReactionModal;
