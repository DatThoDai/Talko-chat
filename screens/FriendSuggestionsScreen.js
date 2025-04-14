import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  TextInput, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomAvatar from '../components/CustomAvatar';
import { colors, spacing, typography, borderRadius } from '../styles';
import friendApi from '../api/friendApi'; // Import friendApi
import { userService } from '../api/userService'; // Import userService cho tìm kiếm người dùng

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
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sentRequests, setSentRequests] = useState([]);
  
  // Load gợi ý kết bạn và danh sách lời mời đã gửi
  const loadSuggestions = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Lấy gợi ý kết bạn
      const suggestionResponse = await friendApi.fetchFriendSuggests();
      setSuggestedUsers(suggestionResponse.data || []);
      
      // Lấy danh sách lời mời đã gửi
      const sentResponse = await friendApi.fetchMyFriendRequests();
      
      // Lưu ID của người dùng đã nhận lời mời
      const requestIds = sentResponse.data.map(request => request.receiver._id);
      setSentRequests(requestIds);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      Alert.alert('Lỗi', 'Không thể tải gợi ý kết bạn. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load gợi ý khi mở màn hình
  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);
  
  // Kiểm tra xem đã gửi lời mời cho người dùng nào chưa
  const isRequestSentToUser = useCallback((userId) => {
    return sentRequests.includes(userId);
  }, [sentRequests]);
  
  // Tìm kiếm người dùng
  const handleSearch = useCallback(async () => {
    if (!searchText.trim()) {
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Sử dụng userService thay vì userApi để tìm kiếm người dùng
      const response = await userService.searchUsers(searchText);
      console.log('Kết quả tìm kiếm:', response);
      
      if (response && response.data) {
        setSuggestedUsers(Array.isArray(response.data) ? response.data : [response.data]);
      } else {
        setSuggestedUsers([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Lỗi', 'Không thể tìm kiếm người dùng. Vui lòng thử lại sau.');
      setSuggestedUsers([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchText]);
  
  // Gửi lời mời kết bạn
  const handleSendRequest = useCallback(async (user) => {
    try {
      // Đảm bảo user có _id
      if (!user || !user._id) {
        console.error('User object invalid:', user);
        Alert.alert('Lỗi', 'Thông tin người dùng không hợp lệ');
        return;
      }
      
      await friendApi.addFriendRequest(user._id);
      
      // Cập nhật danh sách yêu cầu đã gửi
      setSentRequests(prev => [...prev, user._id]);
      
      Alert.alert('Thành công', 'Đã gửi lời mời kết bạn');
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert(
        'Lỗi',
        'Không thể gửi lời mời kết bạn. Vui lòng thử lại sau.',
        [{ text: 'OK' }]
      );
    }
  }, []);
  
  // Clear search results if search text is empty
  useEffect(() => {
    if (!searchText.trim()) {
      loadSuggestions();
    }
  }, [searchText, loadSuggestions]);
  
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
