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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, typography } from '../styles';
import CustomAvatar from '../components/CustomAvatar';
import { useSelector } from 'react-redux';
import friendApi from '../api/friendApi';
import conversationApi from '../api/conversationApi';

const NewConversationScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [allFriends, setAllFriends] = useState([]); // Danh sách tất cả bạn bè
  const [users, setUsers] = useState([]); // Danh sách bạn bè đã lọc theo tìm kiếm
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Bắt đầu với loading
  
  const { user: currentUser } = useSelector(state => state.auth);
  
  // Load danh sách bạn bè khi màn hình được khởi tạo
  useEffect(() => {
    const fetchFriends = async () => {
      setIsLoading(true);
      try {
        const response = await friendApi.fetchFriends();
        if (response && response.data) {
          console.log('Loaded friends:', response.data.length);
          setAllFriends(response.data);
          setUsers(response.data); // Hiển thị tất cả bạn bè ban đầu
        } else {
          console.log('No friends data received');
          setAllFriends([]);
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
        Alert.alert('Lỗi', 'Không thể tải danh sách bạn bè. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFriends();
  }, []);
  
  // Tìm kiếm bạn bè từ danh sách local
  useEffect(() => {
    // Lọc danh sách bạn bè theo từ khóa tìm kiếm
    if (searchText.trim() === '') {
      // Hiển thị tất cả bạn bè trừ những người đã được chọn
      const unselectedFriends = allFriends.filter(friend => 
        !selectedUsers.some(selected => selected._id === friend._id)
      );
      setUsers(unselectedFriends);
      return;
    }
    
    const lowerCaseSearch = searchText.toLowerCase();
    const filteredUsers = allFriends.filter(friend => 
      // Chỉ hiển thị bạn bè chưa được chọn và tên/username khớp với từ khóa
      !selectedUsers.some(selected => selected._id === friend._id) &&
      ((friend.name && friend.name.toLowerCase().includes(lowerCaseSearch)) || 
      (friend.username && friend.username.toLowerCase().includes(lowerCaseSearch)) ||
      (friend.email && friend.email.toLowerCase().includes(lowerCaseSearch)))
    );
    
    setUsers(filteredUsers);
  }, [searchText, allFriends, selectedUsers]);
  
  // Thêm useEffect để tự động bật chức năng nhóm khi có từ 2 người được chọn
  useEffect(() => {
    // Nếu người dùng chọn từ 2 người trở lên, tự động bật chế độ nhóm
    if (selectedUsers.length >= 2 && !isGroup) {
      setIsGroup(true);
    }
  }, [selectedUsers]);

  // Handle user selection
  const handleSelectUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchText(''); // Xóa ô tìm kiếm sau khi chọn
  };
  
  // Handle removing a selected user
  const handleRemoveUser = (user) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
  };
  
  // Xử lý tạo cuộc trò chuyện mới
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
      const participantIds = selectedUsers.map(user => user._id);
      
      let response;
      if (isGroup) {
        response = await conversationApi.createGroup(groupName.trim(), participantIds);
      } else {
        const userId = participantIds[0];
        response = await conversationApi.addConversation(userId);
      }
      
      if (response && response.data) {
        const conversation = response.data;
        console.log('Conversation created:', conversation);
        
        navigation.replace('MessageScreen', {
          conversationId: conversation._id,
          name: groupName,
          conversationName: groupName || conversation.name,
          isGroup: true, // Bắt buộc set true khi là nhóm
          isGroupChat: true, // Thêm prop này
          avatar: conversation.avatar || '',
          avatarColor: conversation.avatarColor || '#' + Math.floor(Math.random()*16777215).toString(16),
          participants: selectedUsers
        });
      } else {
        throw new Error('Invalid response from server');
      }
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
  
  // Render người dùng đã được chọn
  const renderSelectedUserChip = ({ item }) => (
    <View style={styles.selectedUserChip}>
      <CustomAvatar 
        size={24}
        name={item.name || item.username}
        color={item.avatarColor}
        imageUrl={item.avatar}
        style={styles.selectedUserAvatar}
      />
      <Text style={styles.selectedUserText} numberOfLines={1}>
        {item.name || item.username || 'User'}
      </Text>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => handleRemoveUser(item)}
      >
        <Icon name="close" size={18} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
  
  // Render người dùng trong danh sách
  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem} 
      onPress={() => handleSelectUser(item)}
    >
      <CustomAvatar 
        size={40}
        name={item.name || item.username}
        color={item.avatarColor}
        imageUrl={item.avatar}
      />
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
  
  // Rest of your component remains the same...
  return (
    <SafeAreaView style={styles.container}>
      {/* Header section */}
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
            <View style={styles.selectedHeaderRow}>
              <Text style={styles.sectionTitle}>
                Đã chọn ({selectedUsers.length})
              </Text>
              {selectedUsers.length > 3 && (
                <Text style={styles.scrollIndicator}>
                  ← Lướt để xem thêm →
                </Text>
              )}
            </View>
            
            <FlatList
              data={selectedUsers}
              renderItem={renderSelectedUserChip}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={styles.selectedUsersList}
              indicatorStyle="white" // iOS only
              style={styles.selectedUsersScroll}
            />
          </View>
        )}
        
        {/* Search input */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={colors.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm bạn bè"
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
        
        {/* Friend list and search results */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải danh sách bạn bè...</Text>
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item._id}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                {searchText.length > 0 ? (
                  <>
                    <Icon name="search-off" size={48} color={colors.gray} />
                    <Text style={styles.emptyText}>
                      Không tìm thấy bạn bè phù hợp
                    </Text>
                  </>
                ) : (
                  <>
                    <Icon name="people-outline" size={48} color={colors.gray} />
                    <Text style={styles.emptyText}>
                      Bạn chưa có bạn bè nào
                    </Text>
                  </>
                )}
              </View>
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
    paddingRight: 20, // Đảm bảo chip cuối cùng có không gian bên phải
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: spacing.sm,
    marginBottom: 5,
    // Thêm shadow nhẹ để tăng hiệu ứng nổi
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  selectedUserText: {
    color: colors.white,
    marginHorizontal: spacing.xs, // Tăng khoảng cách giữa các phần tử
    maxWidth: 120, // Cho phép tên dài hơn
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
  selectedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  scrollIndicator: {
    fontSize: 12,
    color: colors.gray,
    fontStyle: 'italic',
  },
  selectedUsersScroll: {
    maxHeight: 50, // Đảm bảo chiều cao phù hợp
    paddingBottom: 5, // Thêm padding để hiển thị scrollbar
  },
  removeButton: {
    padding: 2,
  },
});

export default NewConversationScreen;
