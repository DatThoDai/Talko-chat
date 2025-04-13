import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomAvatar from '../components/CustomAvatar';
import { colors, spacing, typography, borderRadius } from '../styles';
import userApi from '../api/userApi';
import friendApi from '../api/friendApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserItem = ({ user, onAddFriend, isSent }) => {
  // Determine button state
  let buttonText = 'Kết bạn';
  let buttonStyle = styles.addButton;
  let isDisabled = false;

  if (user.isFriend) {
    buttonText = 'Đã kết bạn';
    buttonStyle = styles.addedButton;
    isDisabled = true;
  } else if (isSent) {
    buttonText = 'Đã gửi';
    buttonStyle = styles.sentButton;
    isDisabled = true;
  }

  return (
    <View style={styles.userItem}>
      <CustomAvatar size={50} name={user.name} source={user.avatar} />
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name || 'Người dùng'}</Text>
        <Text style={styles.userEmail}>{user.username || ''}</Text>
      </View>
      
      <TouchableOpacity 
        style={[styles.actionButton, buttonStyle]}
        disabled={isDisabled}
        onPress={() => onAddFriend(user)}
      >
        <Text style={[styles.actionButtonText, 
          isDisabled && buttonText === 'Đã gửi' ? {color: colors.gray} : 
          isDisabled ? {color: colors.dark} : {color: colors.white}]}>
          {buttonText}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const AddNewFriendScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sentRequests, setSentRequests] = useState([]); // Track sent requests
  const [error, setError] = useState(null);

  // Load sent friend requests
  useEffect(() => {
    loadSentRequests();
  }, []);

  const loadSentRequests = async () => {
    try {
      const response = await friendApi.fetchMyRequestFriend();
      if (response && Array.isArray(response)) {
        // Extract user IDs from sent requests
        const sentIds = response.map(request => request.receiver?._id || request.receiver);
        setSentRequests(sentIds);
      }
    } catch (error) {
      console.error('Error loading sent requests:', error);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim() === '') return;
    
    setIsSearching(true);
    setHasSearched(true);
    setError(null);
    
    try {
      // Call the userApi to search for users
      const response = await userApi.fetchUser(searchQuery.trim());
      
      if (response) {
        // Normalize the response to an array
        const results = Array.isArray(response) ? response : [response];
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Không thể tìm kiếm người dùng. Vui lòng thử lại sau.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFriend = async (user) => {
    try {
      // Call the friendApi to send a friend request
      await friendApi.sendRequestFriend(user._id);
      
      // Update local state to show the request was sent
      setSentRequests(prev => [...prev, user._id]);
      
      // Show success feedback
      Alert.alert('Thành công', 'Đã gửi lời mời kết bạn');
    } catch (error) {
      console.error('Add friend error:', error);
      Alert.alert('Lỗi', 'Không thể gửi lời mời kết bạn. Vui lòng thử lại sau.');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Check if a friend request has been sent to this user
  const isRequestSent = (user) => {
    return sentRequests.includes(user._id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.white} barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm bạn bè</Text>
        <View style={styles.emptySpace} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tên đăng nhập"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity 
          style={[styles.searchButton, searchQuery.trim() === '' ? styles.disabledButton : {}]} 
          onPress={handleSearch}
          disabled={searchQuery.trim() === ''}
        >
          <Icon 
            name="search" 
            size={24} 
            color={searchQuery.trim() === '' ? colors.gray : colors.white} 
          />
        </TouchableOpacity>
      </View>

      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={50} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : hasSearched ? (
        <FlatList
          data={searchResults}
          renderItem={({ item }) => (
            <UserItem 
              user={item} 
              onAddFriend={handleAddFriend} 
              isSent={isRequestSent(item)}
            />
          )}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Không tìm thấy kết quả cho "{searchQuery}"
              </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.initialStateContainer}>
          <Icon name="search" size={80} color={colors.light} />
          <Text style={styles.initialStateText}>
            Tìm kiếm người dùng để kết bạn
          </Text>
        </View>
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
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    flex: 1,
    textAlign: 'center',
    color: colors.dark,
  },
  emptySpace: {
    width: 40, // Same width as back button for alignment
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: colors.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    fontSize: 16,
  },
  searchButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: colors.light,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
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
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: 14,
    color: colors.gray,
  },
  actionButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.md,
    marginLeft: spacing.sm,
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  addedButton: {
    backgroundColor: colors.light,
  },
  sentButton: {
    backgroundColor: colors.light,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
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
  },
  initialStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  initialStateText: {
    ...typography.body,
    color: colors.gray,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default AddNewFriendScreen;
