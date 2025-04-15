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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing } from '../styles';
import conversationApi from '../api/conversationApi';
import { messageApi } from '../api/messageApi';
import CustomAvatar from '../components/CustomAvatar';

const ForwardMessage = ({ route, navigation }) => {
  const { messageId, currentConversationId, originalContent, messageType } = route.params;
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
      
      // Theo dõi kết quả chuyển tiếp
      const results = {
        success: [],
        failed: []
      };
      
      // Chuyển tiếp từng hội thoại một để có thể xử lý lỗi riêng
      for (const conversationId of selectedConversationIds) {
        try {
          await messageApi.forwardMessage(messageId, conversationId, originalContent, messageType);
          results.success.push(conversationId);
        } catch (error) {
          console.error(`Failed to forward to conversation ${conversationId}:`, error);
          results.failed.push(conversationId);
        }
      }
      
      // Hiển thị thông báo kết quả
      if (results.success.length > 0) {
        if (results.failed.length > 0) {
          Alert.alert(
            'Chuyển tiếp tin nhắn',
            `Đã chuyển tiếp đến ${results.success.length} hội thoại thành công và ${results.failed.length} thất bại.`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert(
            'Thành công',
            `Đã chuyển tiếp tin nhắn đến ${results.success.length} hội thoại.`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } else {
        Alert.alert(
          'Thất bại',
          'Không thể chuyển tiếp tin nhắn. Vui lòng thử lại sau.'
        );
      }
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
        activeOpacity={0.7}
      >
        <CustomAvatar
          size={50}
          name={getConversationName(item)}
          avatar={getConversationAvatar(item)}
          color={getConversationColor(item)}
        />
        
        <View style={styles.conversationInfo}>
          <Text style={styles.conversationName} numberOfLines={1}>
            {getConversationName(item)}
          </Text>
          {item.members && (
            <Text style={styles.membersCount} numberOfLines={1}>
              {item.members.length || 0} thành viên
            </Text>
          )}
        </View>
        
        <View style={styles.checkboxContainer}>
          {isSelected ? (
            <View style={styles.checkedBox}>
              <Icon name="check" size={20} color={colors.white} />
            </View>
          ) : (
            <View style={styles.uncheckedBox} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={colors.lightGrey} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm hội thoại..."
            placeholderTextColor={colors.lightGrey}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon name="close" size={20} color={colors.lightGrey} />
            </TouchableOpacity>
          )}
        </View>
        
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
      
      {selectedConversationIds.length > 0 && (
        <View style={styles.selectedBanner}>
          <Text style={styles.selectedCount}>
            Đã chọn {selectedConversationIds.length} hội thoại
          </Text>
        </View>
      )}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách hội thoại...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="people" size={64} color={colors.lightGrey} />
              <Text style={styles.emptyText}>
                {search.length > 0
                  ? 'Không tìm thấy hội thoại phù hợp'
                  : 'Không có hội thoại nào'}
              </Text>
              <Text style={styles.emptySubtext}>
                {search.length > 0
                  ? 'Thử tìm kiếm với từ khóa khác'
                  : 'Hãy tạo một cuộc trò chuyện mới để chia sẻ'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  searchWrapper: {
    backgroundColor: colors.primary,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    height: 44,
    flex: 1,
    marginRight: 12
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    marginLeft: 8,
    color: colors.white,
    fontSize: 15,
  },
  forwardButton: {
    backgroundColor: colors.accent || '#FF9800',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    elevation: 2,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    elevation: 0,
  },
  forwardButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  selectedBanner: {
    backgroundColor: colors.lightPrimary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedCount: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedItem: {
    backgroundColor: colors.lightPrimary,
  },
  conversationInfo: {
    marginLeft: 16,
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
  checkboxContainer: {
    width: 24,
    height: 24,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckedBox: {
    width: 20,
    height: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.grey,
  },
  checkedBox: {
    width: 24,
    height: 24,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  emptyText: {
    marginTop: 16,
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    color: colors.grey,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ForwardMessage;
