import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomAvatar from '../components/CustomAvatar';
import { colors, spacing, typography, borderRadius } from '../styles';

// Mock group members data for demonstration
const mockMembers = [
  {
    id: '1',
    name: 'Nguyễn Tuấn Anh',
    status: 'online',
    avatar: null,
    isAdmin: true,
  },
  {
    id: '2',
    name: 'Nhật Hào',
    status: 'offline',
    avatar: null,
    isAdmin: false,
  },
  {
    id: '3',
    name: 'Thanh Trọng',
    status: 'online',
    avatar: null,
    isAdmin: false,
  },
  {
    id: '4',
    name: 'Minh Hoàng',
    status: 'offline',
    avatar: null,
    isAdmin: false,
  },
  {
    id: '5',
    name: 'Thùy Linh',
    status: 'online',
    avatar: null,
    isAdmin: false,
  },
];

const MemberItem = ({ member, onRemove, onMakeAdmin, isCurrentUserAdmin }) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  return (
    <View style={styles.memberItem}>
      <CustomAvatar
        size={50}
        name={member.name}
        source={member.avatar}
        online={member.status === 'online'}
      />
      
      <View style={styles.memberInfo}>
        <View style={styles.nameContainer}>
          <Text style={styles.memberName}>{member.name}</Text>
          {member.isAdmin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
        </View>
        <Text style={styles.memberStatus}>
          {member.status === 'online' ? 'Đang hoạt động' : 'Không hoạt động'}
        </Text>
      </View>
      
      {isCurrentUserAdmin && !member.isAdmin && (
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
          <Icon name="more-vert" size={24} color={colors.gray} />
        </TouchableOpacity>
      )}
      
      {menuVisible && (
        <View style={styles.menuPopup}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              toggleMenu();
              onMakeAdmin(member);
            }}
          >
            <Icon name="person" size={18} color={colors.dark} />
            <Text style={styles.menuItemText}>Đặt làm Admin</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {
              toggleMenu();
              onRemove(member);
            }}
          >
            <Icon name="person-remove" size={18} color={colors.danger} />
            <Text style={[styles.menuItemText, { color: colors.danger }]}>
              Xóa khỏi nhóm
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const MemberScreen = ({ route, navigation }) => {
  const { conversationId, name } = route.params || {};
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(true); // For demonstration

  useEffect(() => {
    // Simulate API call to get members
    const fetchMembers = async () => {
      // In a real app, replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMembers(mockMembers);
      setIsLoading(false);
    };

    fetchMembers();
  }, [conversationId]);

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMember = () => {
    navigation.navigate('AddNewFriend', { isGroupAdd: true, conversationId });
  };

  const handleMakeAdmin = (member) => {
    Alert.alert(
      'Đặt làm Admin',
      `Bạn có chắc chắn muốn đặt ${member.name} làm Admin không?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đồng ý',
          onPress: () => {
            // In a real app, make API call to set admin
            const updatedMembers = members.map(m => 
              m.id === member.id ? { ...m, isAdmin: true } : m
            );
            setMembers(updatedMembers);
          },
        },
      ]
    );
  };

  const handleRemoveMember = (member) => {
    Alert.alert(
      'Xóa thành viên',
      `Bạn có chắc chắn muốn xóa ${member.name} khỏi nhóm không?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            // In a real app, make API call to remove member
            const updatedMembers = members.filter(m => m.id !== member.id);
            setMembers(updatedMembers);
          },
        },
      ]
    );
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
        <Text style={styles.headerTitle}>Thành viên nhóm</Text>
        {isCurrentUserAdmin && (
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleAddMember}
          >
            <Icon name="person-add" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={colors.gray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm thành viên"
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
        data={filteredMembers}
        renderItem={({ item }) => (
          <MemberItem 
            member={item} 
            onRemove={handleRemoveMember}
            onMakeAdmin={handleMakeAdmin}
            isCurrentUserAdmin={isCurrentUserAdmin}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.countContainer}>
            <Text style={styles.countText}>
              {members.length} thành viên
            </Text>
          </View>
        }
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? `Không tìm thấy kết quả cho "${searchQuery}"`
                  : 'Không có thành viên nào'}
              </Text>
            </View>
          )
        }
      />
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
  countContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  countText: {
    ...typography.body,
    color: colors.gray,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
    position: 'relative',
  },
  memberInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.dark,
    marginRight: spacing.sm,
  },
  adminBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: spacing.md,
  },
  adminBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  memberStatus: {
    fontSize: 14,
    color: colors.gray,
  },
  menuButton: {
    padding: spacing.sm,
  },
  menuPopup: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    elevation: 5,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  menuItemText: {
    ...typography.body,
    marginLeft: spacing.sm,
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
});

export default MemberScreen;
