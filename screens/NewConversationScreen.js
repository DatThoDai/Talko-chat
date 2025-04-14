import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, typography } from '../styles';
//import UserItem from '../components/UserItem';
import { useSelector } from 'react-redux';
import { userService, conversationService, friendService } from '../api';

const NewConversationScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const { user: currentUser } = useSelector(state => state.auth);
  
  // Load users when search text changes (with debounce)
  useEffect(() => {
    if (searchText.trim().length < 2) {
      setUsers([]);
      setIsSearching(false);
      return;
    }
    
    const timer = setTimeout(() => {
      searchUsers();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchText]);
  
  // Search for users with mock data
  const searchUsers = async () => {
    if (searchText.trim().length < 2) return;
    
    setIsSearching(true);
    
    try {
      console.log('Searching users with query:', searchText);
      
      // Dữ liệu mẫu thay thế cho API call
      const mockUsers = [
        { _id: '1', username: 'user_1', name: 'Nguyễn Văn A', email: 'nguyenvana@example.com', avatar: null },
        { _id: '2', username: 'user_2', name: 'Trần Thị B', email: 'tranthib@example.com', avatar: null },
        { _id: '3', username: 'user_3', name: 'Lê Văn C', email: 'levanc@example.com', avatar: null },
        { _id: '4', username: 'user_4', name: 'Phạm Thị D', email: 'phamthid@example.com', avatar: null },
        { _id: '5', username: 'user_5', name: 'Hoàng Văn E', email: 'hoangvane@example.com', avatar: null },
      ];
      
      // Lọc kết quả theo các ký tự được nhập
      const filteredMockUsers = mockUsers.filter(user => 
        user.name.toLowerCase().includes(searchText.toLowerCase()) || 
        user.username.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email.toLowerCase().includes(searchText.toLowerCase())
      );
      
      // Đợi 1s để giả lập API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filter out current user and already selected users
      const filteredUsers = filteredMockUsers.filter(user => 
        user._id !== (currentUser?._id || '0') && 
        !selectedUsers.some(selected => selected._id === user._id)
      );
      
      console.log(`Found ${filteredUsers.length} users matching search criteria`);
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]); 
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle user selection
  const handleSelectUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setUsers(users.filter(u => u._id !== user._id));
    setSearchText('');
  };
  
  // Handle removing a selected user
  const handleRemoveUser = (user) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
  };
  
  // Handle creating a conversation with mock data
  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một người dùng.');
      return;
    }
    
    if (isGroup && !groupName.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên nhóm.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Tạo ObjectId hợp lệ cho MongoDB (24 ký tự hex)
      const objectIdHex = [
        Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0'),
        Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0'),
        Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0'),
        Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')
      ].join('');
      const mockConversationId = objectIdHex;
      const conversationName = isGroup ? groupName.trim() : selectedUsers[0].name;
      
      console.log('Creating mock conversation with ID:', mockConversationId);
      console.log('Conversation details:', {
        name: conversationName,
        isGroup: isGroup,
        selectedUsers: selectedUsers.map(u => u.name || u.username)
      });
      
      // Giả lập thời gian API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Chuyển đến màn hình MessageScreen với dữ liệu mẫu
      navigation.replace('MessageScreen', {
        conversationId: mockConversationId,
        name: conversationName,
        conversationName: conversationName,
        isGroup: isGroup,
        avatar: null,
        avatarColor: '#' + Math.floor(Math.random()*16777215).toString(16),
        participants: selectedUsers
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert(
        'Lỗi',
        'Không thể tạo cuộc trò chuyện. Vui lòng thử lại sau.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render selected user chip
  const renderSelectedUserChip = ({ item }) => (
    <View style={styles.selectedUserChip}>
      <Text style={styles.selectedUserText} numberOfLines={1}>
        {item.name || item.username || 'User'}
      </Text>
      <TouchableOpacity onPress={() => handleRemoveUser(item)}>
        <Icon name="close" size={18} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
  
  // Render user item in search results
  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem} 
      onPress={() => handleSelectUser(item)}
    >
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: item.avatarColor || '#' + Math.floor(Math.random()*16777215).toString(16),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
      }}>
        <Text style={{color: 'white', fontWeight: 'bold'}}>
          {(item.name || item.username || 'U').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.name || item.username || 'User'}
        </Text>
        <Text style={styles.userEmail} numberOfLines={1}>
          {item.email || item.username || ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cuộc trò chuyện mới</Text>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <TouchableOpacity 
            style={[
              styles.createButton, 
              { opacity: selectedUsers.length > 0 ? 1 : 0.5 }
            ]} 
            disabled={selectedUsers.length === 0}
            onPress={handleCreateConversation}
          >
            <Text style={styles.createButtonText}>Tạo</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.content}>
        {/* Toggle group/individual chat */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Tạo nhóm chat</Text>
          <TouchableOpacity 
            style={[
              styles.toggleButton, 
              { backgroundColor: isGroup ? colors.primary : colors.light }
            ]}
            onPress={() => setIsGroup(!isGroup)}
          >
            <View style={[
              styles.toggleKnob, 
              { transform: [{ translateX: isGroup ? 20 : 0 }] }
            ]} />
          </TouchableOpacity>
        </View>
        
        {/* Group name input (only for group chats) */}
        {isGroup && (
          <View style={styles.groupNameContainer}>
            <Icon name="group" size={20} color={colors.gray} style={styles.groupIcon} />
            <TextInput
              style={styles.groupNameInput}
              placeholder="Nhập tên nhóm"
              placeholderTextColor={colors.gray}
              value={groupName}
              onChangeText={setGroupName}
            />
          </View>
        )}
        
        {/* Selected users */}
        {selectedUsers.length > 0 && (
          <View style={styles.selectedUsersContainer}>
            <Text style={styles.sectionTitle}>
              Đã chọn ({selectedUsers.length})
            </Text>
            <FlatList
              data={selectedUsers}
              renderItem={renderSelectedUserChip}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.selectedUsersList}
            />
          </View>
        )}
        
        {/* Search input */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={colors.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm người dùng"
            placeholderTextColor={colors.gray}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={() => setSearchText('')}
            >
              <Icon name="cancel" size={20} color={colors.gray} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Search results */}
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={
              searchText.length >= 2 ? (
                <View style={styles.emptyContainer}>
                  <Icon name="search-off" size={48} color={colors.gray} />
                  <Text style={styles.emptyText}>
                    Không tìm thấy người dùng
                  </Text>
                </View>
              ) : searchText.length > 0 ? (
                <Text style={styles.searchTip}>
                  Nhập ít nhất 2 ký tự để tìm kiếm
                </Text>
              ) : null
            }
          />
        )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
  },
  createButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  createButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  toggleLabel: {
    fontSize: 16,
    color: colors.dark,
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    padding: 5,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  groupNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  groupIcon: {
    marginRight: spacing.md,
  },
  groupNameInput: {
    flex: 1,
    fontSize: 16,
    color: colors.dark,
  },
  selectedUsersContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.gray,
    marginBottom: spacing.sm,
  },
  selectedUsersList: {
    paddingVertical: spacing.xs,
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  selectedUserText: {
    color: colors.white,
    marginRight: spacing.xs,
    maxWidth: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light,
    borderRadius: 10,
    margin: spacing.md,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: colors.dark,
  },
  clearButton: {
    padding: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.primary,
    fontSize: 16,
  },
  userItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  userInfo: {
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
  },
  userEmail: {
    fontSize: 14,
    color: colors.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.md,
    color: colors.gray,
    fontSize: 16,
    textAlign: 'center',
  },
  searchTip: {
    padding: spacing.md,
    textAlign: 'center',
    color: colors.gray,
  },
});

export default NewConversationScreen;
