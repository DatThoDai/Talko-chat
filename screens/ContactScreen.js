import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomAvatar from '../components/CustomAvatar';
import { colors, spacing, typography, borderRadius } from '../styles';

// Mock contacts data for demonstration
const mockContacts = [
  {
    id: '1',
    name: 'Nguyễn Tuấn Anh',
    status: 'online',
    avatar: null,
  },
  {
    id: '2',
    name: 'Nhật Hào',
    status: 'offline',
    avatar: null,
  },
  {
    id: '3',
    name: 'Thanh Trọng',
    status: 'online',
    avatar: null,
  },
  {
    id: '4',
    name: 'Minh Hoàng',
    status: 'offline',
    avatar: null,
  },
  {
    id: '5',
    name: 'Thùy Linh',
    status: 'online',
    avatar: null,
  },
];

const ContactItem = ({ contact, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.contactItem}
      onPress={() => onPress(contact)}
    >
      <CustomAvatar
        size={50}
        name={contact.name}
        source={contact.avatar}
        online={contact.status === 'online'}
      />
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{contact.name}</Text>
        <Text style={styles.contactStatus}>
          {contact.status === 'online' ? 'Đang hoạt động' : 'Không hoạt động'}
        </Text>
      </View>
      <TouchableOpacity style={styles.chatButton}>
        <Icon name="chat" size={24} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const ContactScreen = ({ navigation }) => {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulating API call to get contacts
    const fetchContacts = async () => {
      // In a real app, replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setContacts(mockContacts);
      setIsLoading(false);
    };

    fetchContacts();
  }, []);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactPress = (contact) => {
    navigation.navigate('FriendDetails', { friendId: contact.id, name: contact.name });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAddNewFriend = () => {
    navigation.navigate('AddNewFriend');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.white} barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh bạ</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={handleAddNewFriend}
        >
          <Icon name="person-add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={colors.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm bạn bè"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close" size={20} color={colors.gray} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredContacts}
        renderItem={({ item }) => (
          <ContactItem contact={item} onPress={handleContactPress} />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? `Không tìm thấy kết quả cho "${searchQuery}"`
                  : 'Bạn chưa có liên hệ nào'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity 
                  style={styles.addFriendButton}
                  onPress={handleAddNewFriend}
                >
                  <Text style={styles.addFriendButtonText}>
                    Thêm bạn bè
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
      />

      <View style={styles.bottomTabs}>
        <TouchableOpacity 
          style={styles.tabButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Icon name="chat" size={24} color={colors.gray} />
          <Text style={styles.tabText}>Tin nhắn</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.tabButton, styles.activeTab]}>
          <Icon name="people" size={24} color={colors.primary} />
          <Text style={styles.activeTabText}>Danh bạ</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabButton}>
          <Icon name="person" size={24} color={colors.gray} />
          <Text style={styles.tabText}>Cá nhân</Text>
        </TouchableOpacity>
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
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.dark,
  },
  addButton: {
    padding: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.light,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    marginLeft: spacing.sm,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  contactInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  contactStatus: {
    fontSize: 14,
    color: colors.gray,
  },
  chatButton: {
    padding: spacing.sm,
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
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  addFriendButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.md,
  },
  addFriendButtonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  bottomTabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.light,
    backgroundColor: colors.white,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  activeTab: {
    borderTopWidth: 2,
    borderTopColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: colors.gray,
    marginTop: spacing.xs,
  },
  activeTabText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
});

export default ContactScreen;
