import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomAvatar from '../components/CustomAvatar';
import { colors, spacing, typography } from '../styles';
import { friendService } from '../api';

const UserItem = ({ user, onSendRequest, isRequestSent }) => {
  return (
    <View style={styles.userItem}>
      <CustomAvatar 
        size={50} 
        name={user.name}
        color={user.avatarColor}
        imageUrl={user.avatar}
      />
      
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {user.name || 'Người dùng'}
        </Text>
        <Text style={styles.userEmail} numberOfLines={1}>
          {user.username || ''}
        </Text>
      </View>
      
      {isRequestSent ? (
        <View style={styles.requestSentContainer}>
          <Text style={styles.requestSentText}>Đã gửi</Text>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => onSendRequest(user)}
        >
          <Icon name="person-add" size={20} color={colors.white} />
          <Text style={styles.addButtonText}>Kết bạn</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const FriendSuggestionsScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState([]);
  
  // Load suggested friends and sent requests
  const loadData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Get suggested friends
      const suggestionsResponse = await friendService.fetchSuggestFriend();
      const suggestions = Array.isArray(suggestionsResponse) ? suggestionsResponse : (suggestionsResponse.content || []);

      // Get sent friend requests
      const sentResponse = await friendService.fetchMyRequestFriend();
      const sent = Array.isArray(sentResponse) ? sentResponse : [];
      
      setSuggestedUsers(suggestions || []);
      setSentRequests(sent || []);
    } catch (error) {
      console.error('Failed to load friend suggestions:', error);
      Alert.alert(
        'Lỗi',
        'Không thể tải gợi ý bạn bè. Vui lòng thử lại sau.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );
  
  // Check if request was sent to a user
  const isRequestSentToUser = useCallback((userId) => {
    return sentRequests.some(request => {
      // Different api might return different structures
      const receiverId = request.receiver?._id || request.receiver;
      return receiverId === userId;
    });
  }, [sentRequests]);
  
  const handleSearch = useCallback(async () => {
    if (!searchText.trim()) {
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Use the userApi to search for users
      const results = await userApi.fetchUser(searchText.trim());
      // Normalize response to always be an array
      const normalizedResults = Array.isArray(results) ? results : [results];
      setSuggestedUsers(normalizedResults || []);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Lỗi', 'Không thể tìm kiếm người dùng. Vui lòng thử lại sau.');
    } finally {
      setIsSearching(false);
    }
  }, [searchText]);
  
  const handleSendRequest = useCallback(async (user) => {
    try {
      // Use the friendApi to send a friend request
      await friendService.sendRequestFriend(user._id);
      
      // Update local state - we may need to transform the user object
      // to match the structure expected by sentRequests
      const newRequest = {
        receiver: user._id,
        status: 'PENDING'
      };
      
      setSentRequests(prevSent => [...prevSent, newRequest]);
      Alert.alert('Thành công', 'Đã gửi lời mời kết bạn');
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Lỗi', 'Không thể gửi lời mời kết bạn. Vui lòng thử lại sau.');
    }
  }, []);
  
  // Clear search results if search text is empty
  useEffect(() => {
    if (!searchText.trim()) {
      loadData();
    }
  }, [searchText, loadData]);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gợi ý kết bạn</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Icon 
          name="search" 
          size={20} 
          color={colors.gray} 
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm người dùng"
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        {searchText ? (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setSearchText('')}
          >
            <Icon name="close" size={20} color={colors.gray} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={!searchText.trim()}
        >
          <Text style={styles.searchButtonText}>Tìm</Text>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={suggestedUsers}
          renderItem={({ item }) => (
            <UserItem 
              user={item} 
              onSendRequest={handleSendRequest}
              isRequestSent={isRequestSentToUser(item._id)}
            />
          )}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            searchText.trim() ? (
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsHeaderText}>
                  Kết quả tìm kiếm cho "{searchText}"
                </Text>
              </View>
            ) : (
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsHeaderText}>
                  Gợi ý kết bạn
                </Text>
              </View>
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {searchText.trim() ? (
                <>
                  <Icon name="search-off" size={80} color={colors.gray} />
                  <Text style={styles.emptyText}>
                    Không tìm thấy người dùng phù hợp với "{searchText}"
                  </Text>
                </>
              ) : (
                <>
                  <Icon name="person-search" size={80} color={colors.gray} />
                  <Text style={styles.emptyText}>
                    Không có gợi ý kết bạn nào
                  </Text>
                </>
              )}
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.dark,
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
  searchButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  searchButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
  },
  userEmail: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    marginLeft: spacing.xs,
  },
  requestSentContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  requestSentText: {
    color: colors.gray,
    fontWeight: 'bold',
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
  emptyText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  resultsHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.lightGray,
  },
  resultsHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.gray,
  },
});

export default FriendSuggestionsScreen;
