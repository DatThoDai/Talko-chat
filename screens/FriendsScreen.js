import React, { useState, useEffect, useCallback } from 'react';
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
  
  const { user } = useSelector((state) => state.auth);
  
  const loadFriends = useCallback(async () => {
    if (refreshing) return;
    
    setIsLoading(true);
    setRefreshing(true);
    
    try {
      const friendList = await friendApi.getFriends();
      setFriends(friendList || []);
      setFilteredFriends(friendList || []);
    } catch (error) {
      console.error('Failed to load friends:', error);
      Alert.alert(
        'Lỗi',
        'Không thể tải danh sách bạn bè. Vui lòng thử lại sau.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);
  
  // Filter friends based on search text
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
  
  // Load friends when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFriends();
    }, [loadFriends])
  );
  
  const handleUnfriend = useCallback((friend) => {
    Alert.alert(
      'Xóa bạn',
      `Bạn có chắc muốn xóa ${friend.name || 'người dùng này'} khỏi danh sách bạn bè không?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendApi.unfriend(friend._id);
              // Refresh friend list
              loadFriends();
              Alert.alert('Thành công', 'Đã xóa bạn bè thành công');
            } catch (error) {
              console.error('Error unfriending:', error);
              Alert.alert('Lỗi', 'Không thể xóa bạn bè. Vui lòng thử lại sau.');
            }
          },
        },
      ]
    );
  }, [loadFriends]);
  
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
              onRefresh={loadFriends}
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
