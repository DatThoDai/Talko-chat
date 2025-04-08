import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomAvatar from '../components/CustomAvatar';
import { colors, spacing, typography, borderRadius } from '../styles';

// Mock user search results for demonstration
const mockSearchResults = [
  {
    id: '10',
    name: 'Ngọc Hân',
    email: 'ngochan@example.com',
    avatar: null,
    isFriend: false,
  },
  {
    id: '11',
    name: 'Thanh Tùng',
    email: 'thanhtung@example.com',
    avatar: null,
    isFriend: false,
  },
  {
    id: '12',
    name: 'Minh Tuấn',
    email: 'minhtuan@example.com',
    avatar: null,
    isFriend: true,
  },
];

const UserItem = ({ user, onAddFriend }) => {
  return (
    <View style={styles.userItem}>
      <CustomAvatar size={50} name={user.name} source={user.avatar} />
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.actionButton,
          user.isFriend ? styles.addedButton : styles.addButton,
        ]}
        disabled={user.isFriend}
        onPress={() => onAddFriend(user)}
      >
        <Text style={styles.actionButtonText}>
          {user.isFriend ? 'Đã kết bạn' : 'Kết bạn'}
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

  const handleSearch = () => {
    if (searchQuery.trim() === '') return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    // Simulate API call to search users
    setTimeout(() => {
      setSearchResults(mockSearchResults);
      setIsSearching(false);
    }, 1000);
  };

  const handleAddFriend = (user) => {
    // Simulate API call to add friend
    const updatedResults = searchResults.map(result => 
      result.id === user.id ? { ...result, isFriend: true } : result
    );
    
    setSearchResults(updatedResults);
    
    // Show success feedback here (could be a toast message in a real app)
  };

  const handleBack = () => {
    navigation.goBack();
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
          placeholder="Tìm kiếm theo tên, email hoặc số điện thoại"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity 
          style={styles.searchButton} 
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
      ) : hasSearched ? (
        <FlatList
          data={searchResults}
          renderItem={({ item }) => (
            <UserItem user={item} onAddFriend={handleAddFriend} />
          )}
          keyExtractor={item => item.id}
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
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
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
