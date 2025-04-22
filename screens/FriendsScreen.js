import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomAvatar from '../components/CustomAvatar';
import { colors, spacing, borderRadius } from '../styles';
import friendApi from '../api/friendApi';

const FriendItem = ({ friend, onPress, onUnfriend }) => {
  return (
    <TouchableOpacity style={styles.friendItem} onPress={() => onPress(friend)}>
      <CustomAvatar 
        size={50} 
        name={friend.name}
        color={friend.avatarColor}
        imageUrl={friend.avatar}
      />
      
      <View style={styles.friendInfo}>
        <Text style={styles.friendName} numberOfLines={1}>
          {friend.name || 'Người dùng'}
        </Text>
        <Text style={styles.friendEmail} numberOfLines={1}>
          {friend.username || ''}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.actionButton}
        onPress={() => onUnfriend(friend)}
      >
        <Icon name="person-remove" size={20} color={colors.dark} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const FriendsScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Thêm refs để theo dõi trạng thái nhưng không gây render
  const hasLoadedRef = useRef(false);
  const isMountedRef = useRef(true);
  const loadingRef = useRef(false);
  
  const { user } = useSelector((state) => state.auth);
  
  // Hàm loadFriends mới, kiểm tra trạng thái loading
  const loadFriends = useCallback(async () => {
    if (loadingRef.current) return; // Ngăn gọi API khi đang loading
    
    loadingRef.current = true;
    try {
      const response = await friendApi.fetchFriends();
      if (isMountedRef.current) {
        setFriends(response.data || []);
        setFilteredFriends(response.data || []);
        hasLoadedRef.current = true;
      }
    } catch (error) {
      console.error('Failed to load friends:', error);
      if (isMountedRef.current) {
        Alert.alert(
          'Lỗi',
          'Không thể tải danh sách bạn bè. Vui lòng thử lại sau.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      if (isMountedRef.current) {
        loadingRef.current = false;
      }
    }
  }, []);
  
  // Hàm refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFriends();
    if (isMountedRef.current) {
      setRefreshing(false);
    }
  }, [loadFriends]);
  
  // Không cần hàm này nữa, gộp với useFocusEffect
  // const handleInitialLoad = useCallback...
  
  // Search filter không thay đổi
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const lowerCaseSearch = searchText.toLowerCase();
      const filtered = friends.filter(friend => 
        (friend.name && friend.name.toLowerCase().includes(lowerCaseSearch)) ||
        (friend.username && friend.username.toLowerCase().includes(lowerCaseSearch))
      );
      setFilteredFriends(filtered);
    }
  }, [searchText, friends]);
  
  // Thiết lập cleanup khi component unmount 
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Sửa useFocusEffect để tránh vòng lặp vô hạn
  useFocusEffect(
    useCallback(() => {
      // Chỉ load khi chưa từng load hoặc khi refresh thủ công
      if (!hasLoadedRef.current && !loadingRef.current) {
        setIsLoading(true);
        loadFriends().finally(() => {
          if (isMountedRef.current) {
            setIsLoading(false);
          }
        });
      }
      
      return () => {
        // Cleanup nếu cần
      };
    }, [loadFriends]) // Giảm dependencies
  );
  
  // Sửa hàm handleUnfriend để đảm bảo không gọi lại screen
  const handleUnfriend = useCallback((friend) => {
    Alert.alert(
      'Xóa bạn',
      `Bạn có chắc muốn xóa ${friend.name || 'người dùng này'} khỏi danh sách bạn bè không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendApi.deleteFriend(friend._id);
              
              // Cập nhật state local thay vì gọi API lại
              if (isMountedRef.current) {
                const newFriends = friends.filter(f => f._id !== friend._id);
                setFriends(newFriends);
                setFilteredFriends(
                  searchText ? 
                    newFriends.filter(f => 
                      f.name?.toLowerCase().includes(searchText.toLowerCase()) || 
                      f.username?.toLowerCase().includes(searchText.toLowerCase())
                    ) : 
                    newFriends
                );
                
                Alert.alert('Thành công', 'Đã xóa bạn bè thành công');
              }
            } catch (error) {
              console.error('Error unfriending:', error);
              if (isMountedRef.current) {
                Alert.alert('Lỗi', 'Không thể xóa bạn bè. Vui lòng thử lại sau.');
              }
            }
          },
        },
      ]
    );
  }, [friends, searchText]); // Phụ thuộc vào friends và searchText
  
  const handleFriendPress = useCallback((friend) => {
    // Create or navigate to an existing conversation with this friend
    navigation.navigate('Message', {
      userId: friend._id,
      name: friend.name,
      avatar: friend.avatar,
      avatarColor: friend.avatarColor
    });
  }, [navigation]);
  
  const handleAddFriend = useCallback(() => {
    navigation.navigate('FriendSuggestions');
  }, [navigation]);
  
  const handleFriendRequests = useCallback(() => {
    navigation.navigate('FriendRequests');
  }, [navigation]);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bạn bè</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.actionIcon}
            onPress={handleFriendRequests}
          >
            <Icon name="person-add" size={24} color={colors.dark} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionIcon}
            onPress={handleAddFriend}
          >
            <Icon name="person-search" size={24} color={colors.dark} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={colors.gray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm bạn bè"
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={() => setSearchText('')}>
            <Icon name="close" size={20} color={colors.gray} />
          </TouchableOpacity>
        )}
      </View>
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách bạn bè...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <FriendItem 
              friend={item} 
              onPress={handleFriendPress}
              onUnfriend={handleUnfriend}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh} // Sử dụng handleRefresh thay vì loadFriends trực tiếp
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={
            filteredFriends.length === 0 
              ? styles.emptyContainer 
              : styles.listContent
          }
          ListEmptyComponent={
            searchText.length > 0 ? (
              <View style={styles.emptySearchContainer}>
                <Icon name="search-off" size={60} color={colors.gray} />
                <Text style={styles.emptyText}>
                  Không tìm thấy bạn bè phù hợp với "{searchText}"
                </Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="people-outline" size={80} color={colors.gray} />
                <Text style={styles.emptyText}>
                  Bạn chưa có bạn bè nào
                </Text>
                <TouchableOpacity 
                  style={styles.addFriendButton}
                  onPress={handleAddFriend}
                >
                  <Text style={styles.addFriendButtonText}>Tìm bạn</Text>
                </TouchableOpacity>
              </View>
            )
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginLeft: spacing.md,
    padding: spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light,
    borderRadius: borderRadius.md,
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
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
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
  friendEmail: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 2,
  },
  actionButton: {
    padding: spacing.sm,
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
  listContent: {
    paddingBottom: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptySearchContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  addFriendButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  addFriendButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default FriendsScreen;
