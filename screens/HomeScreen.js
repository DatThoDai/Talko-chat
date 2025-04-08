import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  StatusBar 
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomAvatar from '../components/CustomAvatar';
import { fetchConversations } from '../redux/chatSlice';
import { colors, spacing, typography } from '../styles';

const ConversationItem = ({ item, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.conversationItem} 
      onPress={() => onPress(item)}
    >
      <CustomAvatar 
        size={50} 
        name={item.name} 
        source={item.avatar} 
        online={false} 
      />
      
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{item.name}</Text>
          <Text style={styles.conversationTime}>{item.timestamp}</Text>
        </View>
        
        <Text 
          style={[
            styles.conversationMessage,
            item.unread > 0 && styles.unreadMessage
          ]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>
      
      {item.unread > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{item.unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { conversations, isLoading } = useSelector(state => state.chat);
  const { user } = useSelector(state => state.auth);
  
  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);
  
  const handleConversationPress = (conversation) => {
    navigation.navigate('Message', { conversationId: conversation.id, name: conversation.name });
  };
  
  const handleAddNew = () => {
    navigation.navigate('Contact');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.white} barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => {}}
          >
            <Icon name="search" size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleAddNew}
          >
            <Icon name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        data={conversations}
        renderItem={({ item }) => (
          <ConversationItem 
            item={item} 
            onPress={handleConversationPress} 
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Không có cuộc trò chuyện nào
              </Text>
              <TouchableOpacity 
                style={styles.startChatButton}
                onPress={handleAddNew}
              >
                <Text style={styles.startChatButtonText}>
                  Bắt đầu trò chuyện mới
                </Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
      
      <View style={styles.bottomTabs}>
        <TouchableOpacity style={[styles.tabButton, styles.activeTab]}>
          <Icon name="chat" size={24} color={colors.primary} />
          <Text style={styles.activeTabText}>Tin nhắn</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => navigation.navigate('Contact')}
        >
          <Icon name="people" size={24} color={colors.gray} />
          <Text style={styles.tabText}>Danh bạ</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Icon name="person" size={24} color={colors.gray} />
          <Text style={styles.tabText}>Cá nhân</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.primary,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: spacing.md,
    padding: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  conversationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
  },
  conversationTime: {
    fontSize: 12,
    color: colors.gray,
  },
  conversationMessage: {
    fontSize: 14,
    color: colors.gray,
  },
  unreadMessage: {
    fontWeight: 'bold',
    color: colors.dark,
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  unreadBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    ...typography.body,
    color: colors.gray,
    marginBottom: spacing.md,
  },
  startChatButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.md,
  },
  startChatButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  bottomTabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.light,
    backgroundColor: colors.white,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: colors.gray,
    marginTop: spacing.xs,
  },
  activeTabText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
});

export default HomeScreen;
