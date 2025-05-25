import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomAvatar from '../components/CustomAvatar';
import { colors, spacing, typography } from '../styles';
import friendApi from '../api/friendApi';
import conversationApi from '../api/conversationApi';

const FriendItem = ({ friend, onSelect, isSelected }) => {
  return (
    <TouchableOpacity 
      style={styles.friendItem} 
      onPress={() => onSelect(friend)}
    >
      <View style={styles.avatarContainer}>
        <CustomAvatar
          size={50}
          name={friend.name || friend.username}
          avatar={friend.avatar}
          online={friend.status === 'online'}
        />
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Icon name="check" size={16} color={colors.white} />
          </View>
        )}
      </View>
      
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{friend.name || friend.username}</Text>
        <Text style={styles.friendStatus}>
          {friend.status === 'online' ? 'Đang hoạt động' : 'Không hoạt động'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const AddToGroupScreen = ({ navigation, route }) => {
  const { conversationId } = route.params || {};
  const [searchText, setSearchText] = useState('');
  const [friends, setFriends] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Lấy danh sách bạn bè và thành viên nhóm
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Lấy danh sách thành viên trong nhóm
        const membersResponse = await conversationApi.fetchMembers(conversationId);
        setGroupMembers(membersResponse.data || []);
        
        // Lấy danh sách tất cả bạn bè
        const friendsResponse = await friendApi.fetchFriends();
        const allFriends = friendsResponse.data || [];
        
        // Lọc ra những bạn bè chưa có trong nhóm
        const availableFriends = allFriends.filter(friend => 
          !membersResponse.data.some(member => member._id === friend._id)
        );
        
        setFriends(availableFriends);
        setFilteredFriends(availableFriends);
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert(
          'Lỗi',
          'Không thể tải danh sách bạn bè. Vui lòng thử lại sau.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    if (conversationId) {
      fetchData();
    } else {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin nhóm chat.');
      navigation.goBack();
    }
  }, [conversationId]);
  
  // Lọc danh sách bạn bè theo từ khóa tìm kiếm
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredFriends(friends);
      return;
    }
    
    const lowerCaseSearch = searchText.toLowerCase();
    const filtered = friends.filter(friend => 
      (friend.name && friend.name.toLowerCase().includes(lowerCaseSearch)) ||
      (friend.username && friend.username.toLowerCase().includes(lowerCaseSearch))
    );
    
    setFilteredFriends(filtered);
  }, [searchText, friends]);
  
  const handleSelect = (friend) => {
    setSelectedFriends(prev => {
      // Nếu friend đã được chọn, loại bỏ khỏi danh sách
      if (prev.some(f => f._id === friend._id)) {
        return prev.filter(f => f._id !== friend._id);
      }
      // Ngược lại, thêm vào danh sách chọn
      return [...prev, friend];
    });
  };
  
  const handleAddToGroup = async () => {
    if (selectedFriends.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất một người bạn để thêm vào nhóm.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Chuẩn bị danh sách ID người dùng để thêm vào nhóm
      const userIds = selectedFriends.map(friend => friend._id);
      
      // Gọi API để thêm thành viên vào nhóm
      await conversationApi.addMembers(conversationId, userIds);
      
      Alert.alert(
        'Thành công',
        'Đã thêm thành viên vào nhóm thành công.',
        [
          { 
            text: 'OK',
            onPress: () => navigation.navigate('MemberScreen', { conversationId })
          }
        ]
      );
    } catch (error) {
      console.error('Error adding members:', error);
      Alert.alert('Lỗi', 'Không thể thêm thành viên vào nhóm. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBack = () => {
    navigation.goBack();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm thành viên</Text>
        <TouchableOpacity 
          style={[
            styles.addButton, 
            { opacity: selectedFriends.length > 0 ? 1 : 0.5 }
          ]} 
          onPress={handleAddToGroup}
          disabled={selectedFriends.length === 0 || isLoading}
        >
          <Text style={styles.addButtonText}>Thêm</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={colors.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm bạn bè"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText !== '' && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Icon name="close" size={20} color={colors.gray} />
          </TouchableOpacity>
        )}
      </View>
      
      {selectedFriends.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedText}>Đã chọn {selectedFriends.length} người</Text>
        </View>
      )}
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách bạn bè...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFriends}
          renderItem={({ item }) => (
            <FriendItem 
              friend={item} 
              onSelect={handleSelect}
              isSelected={selectedFriends.some(f => f._id === item._id)}
            />
          )}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="people-outline" size={60} color={colors.gray} />
              <Text style={styles.emptyText}>
                {searchText 
                  ? `Không tìm thấy bạn bè phù hợp với "${searchText}"`
                  : 'Tất cả bạn bè của bạn đã có trong nhóm'
                }
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
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.dark,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    marginLeft: spacing.sm,
    fontSize: 16,
  },
  selectedContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.light,
  },
  selectedText: {
    ...typography.body,
    color: colors.dark,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  avatarContainer: {
    position: 'relative',
  },
  selectedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
  },
  friendStatus: {
    fontSize: 14,
    color: colors.gray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.gray,
    marginTop: spacing.md,
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
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});

export default AddToGroupScreen;