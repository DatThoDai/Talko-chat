import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { useSelector } from 'react-redux';
import MessageItem from './MessageItem';
import { colors, spacing } from '../styles';

const MessageList = ({
  messages,
  isLoading,
  loadingMore,
  hasMoreMessages,
  onRefresh,
  onLoadMore,
  onMessageLongPress,
  onReaction,
  typingUsers = [],
  currentUserId
}) => {
  const flatListRef = useRef(null);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current && !isLoading && !loadingMore) {
      // Small timeout to ensure the FlatList has rendered the new items
      setTimeout(() => {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }, 300);
    }
  }, [messages, isLoading, loadingMore]);
  
  // Render a typing indicator
  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    // Filter out current user if they're in typing users
    const activeTypers = typingUsers.filter(user => user._id !== currentUserId);
    
    if (activeTypers.length === 0) return null;
    
    let typingText = '';
    if (activeTypers.length === 1) {
      typingText = `${activeTypers[0].name} đang nhập...`;
    } else if (activeTypers.length === 2) {
      typingText = `${activeTypers[0].name} và ${activeTypers[1].name} đang nhập...`;
    } else {
      typingText = `${activeTypers.length} người đang nhập...`;
    }
    
    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, styles.typingDot1]} />
            <View style={[styles.typingDot, styles.typingDot2]} />
            <View style={[styles.typingDot, styles.typingDot3]} />
          </View>
          <Text style={styles.typingText}>{typingText}</Text>
        </View>
      </View>
    );
  };
  
  // Render a message item
  const renderItem = ({ item }) => (
    <MessageItem
      message={item}
      onLongPress={() => onMessageLongPress && onMessageLongPress(item)}
      onReaction={(reaction) => onReaction && onReaction(item._id, reaction)}
      isOwnMessage={item.sender._id === currentUserId}
    />
  );
  
  // Render header (loading indicator when loading more)
  const renderHeader = () => {
    if (loadingMore) {
      return (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải tin nhắn cũ hơn...</Text>
        </View>
      );
    }
    return hasMoreMessages ? (
      <TouchableOpacity style={styles.loadMoreButton} onPress={onLoadMore}>
        <Text style={styles.loadMoreText}>Tải thêm tin nhắn</Text>
      </TouchableOpacity>
    ) : null;
  };
  
  // Render footer (typing indicator)
  const renderFooter = () => renderTypingIndicator();
  
  // Empty state when no messages
  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.emptyText}>Đang tải tin nhắn...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Chưa có tin nhắn nào.</Text>
        <Text style={styles.emptySubtext}>Hãy bắt đầu cuộc trò chuyện!</Text>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        inverted // Display newest messages at the bottom
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyComponent}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !loadingMore}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={
          messages.length === 0 ? styles.emptyList : styles.messagesList
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  messagesList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.darkGray,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  loadingText: {
    marginLeft: spacing.sm,
    color: colors.dark,
    fontSize: 14,
  },
  loadMoreButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  loadMoreText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  typingContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: spacing.sm,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.darkGray,
    marginRight: 3,
  },
  typingDot1: {
    opacity: 0.4,
    transform: [{ scale: 0.9 }],
  },
  typingDot2: {
    opacity: 0.7,
    transform: [{ scale: 1 }],
  },
  typingDot3: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  typingText: {
    fontSize: 14,
    color: colors.darkGray,
  },
});

export default MessageList;
