import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing } from '../styles';
import conversationApi from '../api/conversationApi';
import { messageApi } from '../api/messageApi';
import CustomAvatar from '../components/CustomAvatar';

const ForwardMessage = ({ route, navigation }) => {
  const { messageId, currentConversationId } = route.params;
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedConversationIds, setSelectedConversationIds] = useState([]);
  const [sending, setSending] = useState(false);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await conversationApi.fetchConversations();
        
        // Filter out current conversation
        const conversationList = response.data?.filter(
          conversation => conversation._id !== currentConversationId
        ) || [];
        
        setConversations(conversationList);
        setFilteredConversations(conversationList);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        Alert.alert(
          'Lỗi',
          'Không thể tải danh sách hội thoại. Vui lòng thử lại sau.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [currentConversationId]);

  // Filter conversations based on search text
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const searchText = search.toLowerCase().trim();
      const filtered = conversations.filter(conversation => {
        // Filter by conversation name (which might be a group name or member name)
        const conversationName = conversation.name?.toLowerCase() || '';
        // Filter by member names
        const memberNames = conversation.members
          ?.map(member => member.name?.toLowerCase() || '')
          .join(' ');
        
        return conversationName.includes(searchText) || memberNames.includes(searchText);
      });
      
      setFilteredConversations(filtered);
    }
  }, [search, conversations]);

  // Toggle conversation selection
  const toggleSelection = (conversationId) => {
    setSelectedConversationIds(prevSelected => {
      if (prevSelected.includes(conversationId)) {
        return prevSelected.filter(id => id !== conversationId);
      } else {
        return [...prevSelected, conversationId];
      }
    });
  };

  // Forward message to selected conversations
  const handleForward = async () => {
    if (selectedConversationIds.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một hội thoại để chuyển tiếp');
      return;
    }

    try {
      setSending(true);
      
      // Create an array of promises to forward the message to all selected conversations
      const forwardPromises = selectedConversationIds.map(conversationId => 
        messageApi.forwardMessage(messageId, conversationId)
      );
      
      // Wait for all forwards to complete
      await Promise.all(forwardPromises);
      
      Alert.alert(
        'Thành công',
        'Tin nhắn đã được chuyển tiếp',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error forwarding message:', error);
      Alert.alert(
        'Lỗi',
        'Không thể chuyển tiếp tin nhắn. Vui lòng thử lại sau.'
      );
    } finally {
      setSending(false);
    }
  };

  // Get conversation display name
  const getConversationName = (conversation) => {
    if (!conversation) return 'Hội thoại';
    
    // If it's a group chat with a name
    if (conversation.name) {
      return conversation.name;
    }
    
    // If it's a direct message, show the other person's name
    if (conversation.members && conversation.members.length > 0) {
      return conversation.members[0]?.name || 'Người dùng';
    }
    
    return 'Hội thoại';
  };

  // Get conversation avatar
  const getConversationAvatar = (conversation) => {
    if (conversation.avatar) {
      return conversation.avatar;
    }
    
    // If it's a direct message, show the other person's avatar
    if (conversation.members && conversation.members.length > 0) {
      return conversation.members[0]?.avatar || '';
    }
    
    return '';
  };

  // Get conversation color
  const getConversationColor = (conversation) => {
    if (conversation.avatarColor) {
      return conversation.avatarColor;
    }
    
    // If it's a direct message, show the other person's avatar color
    if (conversation.members && conversation.members.length > 0) {
      return conversation.members[0]?.avatarColor || 'blue';
    }
    
    return 'blue';
  };

  // Render conversation item
  const renderItem = ({ item }) => {
    const isSelected = selectedConversationIds.includes(item._id);
    
    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          isSelected && styles.selectedItem
        ]}
        onPress={() => toggleSelection(item._id)}
      >
        <CustomAvatar
          size={40}
          name={getConversationName(item)}
          avatar={getConversationAvatar(item)}
          color={getConversationColor(item)}
        />
        
        <View style={styles.conversationInfo}>
          <Text style={styles.conversationName} numberOfLines={1}>
            {getConversationName(item)}
          </Text>
          <Text style={styles.membersCount} numberOfLines={1}>
            {item.members?.length || 0} thành viên
          </Text>
        </View>
        
        {isSelected && (
          <Icon name="check-circle" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Chuyển tiếp tin nhắn</Text>
        
        <TouchableOpacity
          style={[
            styles.forwardButton,
            (selectedConversationIds.length === 0 || sending) && styles.disabledButton
          ]}
          onPress={handleForward}
          disabled={selectedConversationIds.length === 0 || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.forwardButtonText}>Gửi</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={colors.grey} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm hội thoại..."
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close" size={20} color={colors.grey} />
          </TouchableOpacity>
        )}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách hội thoại...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.selectedCount}>
            Đã chọn: {selectedConversationIds.length}
          </Text>
          
          <FlatList
            data={filteredConversations}
            renderItem={renderItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {search.length > 0
                    ? 'Không tìm thấy hội thoại phù hợp'
                    : 'Không có hội thoại nào'}
                </Text>
              </View>
            }
          />
        </>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  forwardButton: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  disabledButton: {
    backgroundColor: colors.lightGrey,
  },
  forwardButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.medium,
    paddingHorizontal: spacing.medium,
    backgroundColor: colors.lightBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: spacing.small,
  },
  selectedCount: {
    marginHorizontal: spacing.medium,
    marginBottom: spacing.small,
    color: colors.text,
  },
  listContent: {
    paddingBottom: spacing.large,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedItem: {
    backgroundColor: colors.lightPrimary,
  },
  conversationInfo: {
    marginLeft: spacing.medium,
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  membersCount: {
    fontSize: 14,
    color: colors.grey,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.medium,
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: colors.grey,
    fontSize: 16,
  },
});

export default ForwardMessage;
