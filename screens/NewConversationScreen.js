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
  
  // Search for users
  const searchUsers = async () => {
    if (searchText.trim().length < 2) return;
    
    setIsSearching(true);
    
    try {
      // Setup API timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );
      
      // Actual API call
      const apiPromise = userService.searchUsers(searchText);
      
      // Race between timeout and API call
      const response = await Promise.race([apiPromise, timeoutPromise]);
      
      // Filter out current user and already selected users
      const filteredUsers = response.filter(user => 
        user._id !== currentUser._id && 
        !selectedUsers.some(selected => selected._id === user._id)
      );
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert(
        'Lỗi tìm kiếm',
        'Không thể tìm kiếm người dùng. Vui lòng thử lại sau.',
        [{ text: 'OK' }]
      );
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
  
  // Handle creating a conversation
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
      const userIds = selectedUsers.map(user => user._id);
      
      const data = {
        userIds,
        type: isGroup ? 'GROUP' : null,
        name: isGroup ? groupName.trim() : null
      };
      
      const result = await conversationService.createConversation(data);
      
      navigation.replace('Message', {
        conversationId: result._id,
        name: result.name,
        isGroup: !!result.type,
        avatar: result.avatar,
        avatarColor: result.avatarColor
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
      <UserItem 
        size={40} 
        imageUrl={item.avatar}
        name={item.name || item.username || 'User'}
        color={item.avatarColor}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.name || 'User'}
        </Text>
        <Text style={styles.userEmail} numberOfLines={1}>
          {item.username}
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
