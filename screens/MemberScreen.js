import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  StatusBar, // Thêm StatusBar vào đây
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback // Thêm import
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import CustomAvatar from '../components/CustomAvatar';
import { colors, spacing, typography } from '../styles';
import { conversationService } from '../api';
import conversationApi from '../api/conversationApi';
import userService from '../api/userService';

// Mock group members data for demonstration

// Thay đổi định nghĩa MemberItem
const MemberItem = ({ member, onRemove, onToggleManager, isCurrentUserAdmin, isCurrentUserManager, index, totalItems, openMenuId, setOpenMenuId }) => {
  // Tính toán xem menu có đang hiển thị không
  const isMenuVisible = openMenuId === member._id;
  
  // Tính toán vị trí menu dựa vào vị trí của item
  const isNearBottom = index > totalItems - 3; // 3 item cuối cùng
  
  const menuStyle = isNearBottom ? 
    { ...styles.menuPopup, bottom: 40, top: 'auto' } : 
    styles.menuPopup;
  
  const toggleMenu = () => {
    if (isMenuVisible) {
      setOpenMenuId(null);
    } else {
      setOpenMenuId(member._id);
    }
  };

  // Xác định xem người dùng hiện tại có quyền quản lý không (admin hoặc manager)
  const hasManagementRights = isCurrentUserAdmin || isCurrentUserManager;
  
  // Xác định xem nút menu có nên hiển thị không
  const shouldShowMenuButton = (isCurrentUserAdmin || isCurrentUserManager) && 
                              !member.isLeader && 
                              !(isCurrentUserManager && member.isManager);
  
  return (
    <View style={styles.memberItem}>
      <CustomAvatar
        size={50}
        name={member.name}
        imageUrl={member.avatar} // Sử dụng imageUrl thay vì source để truyền string URL
        online={member.status === 'online'}
      />
      
      <View style={styles.memberInfo}>
        <View style={styles.nameContainer}>
          <Text style={styles.memberName}>{member.name}</Text>
          {member.isLeader && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
          {member.isManager && (
            <View style={[styles.adminBadge, styles.managerBadge]}>
              <Text style={styles.adminBadgeText}>Phó nhóm</Text>
            </View>
          )}
        </View>
        <Text style={[
          styles.memberStatus,
          member.isLeader ? styles.adminStatusText : 
          member.isManager ? styles.managerStatusText : {}
        ]}>
          {member.isLeader ? 'Trưởng nhóm' : 
           member.isManager ? 'Phó nhóm' : 'Thành viên'}
        </Text>
      </View>
      
      {/* Hiển thị nút menu cho người dùng có quyền quản lý và với các điều kiện phù hợp */}
      {shouldShowMenuButton && (
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
          <Icon name="more-vert" size={24} color={colors.gray} />
        </TouchableOpacity>
      )}
      
      {/* Menu popup với các tùy chọn tùy theo vai trò */}
      {isMenuVisible && (
        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
          <View style={menuStyle}>
            {/* Chỉ admin mới có thể thêm/xóa phó nhóm */}
            {isCurrentUserAdmin && !member.isManager && (
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  setOpenMenuId(null);
                  onToggleManager(member, true);
                }}
              >
                <Icon name="verified-user" size={18} color={colors.dark} />
                <Text style={styles.menuItemText}>Đặt làm phó nhóm</Text>
              </TouchableOpacity>
            )}
            
            {isCurrentUserAdmin && member.isManager && (
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  toggleMenu();
                  onToggleManager(member, false);
                }}
              >
                <Icon name="remove-moderator" size={18} color={colors.warning} />
                <Text style={[styles.menuItemText, { color: colors.warning }]}>Hủy phó nhóm</Text>
              </TouchableOpacity>
            )}
            
            {/* Cả admin và phó nhóm đều có thể xóa thành viên thường */}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                toggleMenu();
                onRemove(member);
              }}
            >
              <Icon name="person-remove" size={18} color={colors.danger} />
              <Text style={[styles.menuItemText, { color: colors.danger }]}>Xóa khỏi nhóm</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );
};

const MemberScreen = ({ route, navigation }) => {
  const { conversationId, name } = route.params || {};
  
  // Thêm dòng này để lấy user từ Redux store
  const { user } = useSelector(state => state.auth);
  
  const [members, setMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false); 
  const [managers, setManagers] = useState([]); // Thêm state cho danh sách phó nhóm
  const [realUserId, setRealUserId] = useState(null); // Thêm state để lưu ID thực
  // Thêm state này trong MemberScreen
  const [openMenuId, setOpenMenuId] = useState(null);
  // Trong component MemberScreen, thêm state sau
  const [isCurrentUserManager, setIsCurrentUserManager] = useState(false);

  // Thêm useEffect để fetch ID thực từ email
  useEffect(() => {
    const fetchRealUserId = async () => {
      // Kiểm tra xem user._id có phải là email không
      if (user && user._id && user._id.includes('@')) {
        try {
          // Gọi API để lấy userId thực từ email
          const response = await userService.searchByUsername(user._id);
          if (response && response.data && response.data._id) {
            setRealUserId(response.data._id);
            console.log('Tìm thấy ID MongoDB thực tế:', response.data._id);
          }
        } catch (error) {
          console.error('Lỗi khi lấy ID thực:', error);
        }
      }
    };
    
    if (user?._id) {
      fetchRealUserId();
    }
  }, [user?._id]);

  useEffect(() => {
    // Fetch both conversation details and members
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Lấy thông tin conversation để biết leaderId
        const conversationResponse = await conversationApi.fetchConversation(conversationId);
        const leaderId = conversationResponse.data.leaderId;
        
        // Thay đổi phần xử lý managerIds trong useEffect

        // XỬ LÝ MANAGERS - Phân tích cấu trúc dữ liệu từ MongoDB ObjectId
        let managerIds = [];
        if (conversationResponse.data.managerIds) { // Sửa từ managers thành managerIds
          // Kiểm tra nếu managerIds là mảng
          if (Array.isArray(conversationResponse.data.managerIds)) {
            // Xử lý cho trường hợp mỗi item là object có chứa $oid
            managerIds = conversationResponse.data.managerIds.map(item => {
              if (item && typeof item === 'object' && item.$oid) {
                return item.$oid;
              } else {
                return String(item);
              }
            });
          } 
          // Nếu không phải mảng mà là object
          else if (typeof conversationResponse.data.managerIds === 'object') {
            managerIds = [String(conversationResponse.data.managerIds)];
          }
        }

        console.log("Manager IDs (after processing):", JSON.stringify(managerIds));

        // Lấy danh sách thành viên
        const membersResponse = await conversationApi.fetchMembers(conversationId);

        // Xử lý leaderId để đảm bảo chỉ lấy $oid nếu có
        let leaderIdString = '';
        if (typeof leaderId === 'object' && leaderId.$oid) {
          leaderIdString = leaderId.$oid;
        } else {
          leaderIdString = String(leaderId);
        }

        // THAY ĐỔI: Cải thiện cách so sánh IDs trong mảng
        const membersWithRole = membersResponse.data.map(member => {
          // Chuyển đổi tất cả ID thành chuỗi để so sánh chính xác
          const memberId = String(member._id);
          
          // Debug log cho mỗi thành viên
          console.log(`Checking member ${member.name} (${memberId}): managers=${JSON.stringify(managerIds)}`);
          
          // So sánh từng ID trong mảng managerIds sau khi đã chuyển sang chuỗi
          const isManager = managerIds.some(managerId => {
            const result = String(managerId) === memberId;
            if (result) console.log(`Match found: ${member.name} is a manager`);
            return result;
          });
          
          return {
            ...member,
            isLeader: String(member._id) === leaderIdString,
            isManager: isManager
          };
        });
        
        setMembers(membersWithRole);
        setManagers(managerIds);
        
        // Đảm bảo cả hai đều là chuỗi khi so sánh
        const currentUserId = String(user?._id);
        const realUserIdStr = String(realUserId);

        console.log('DEBUG - Current User ID:', currentUserId);
        console.log('DEBUG - Leader ID:', leaderIdString); 
        console.log('DEBUG - Is current user admin?', currentUserId === leaderIdString);

        // So sánh cả ID từ Redux và ID thực với leaderId
        console.log('Current Redux ID:', currentUserId);
        console.log('Real MongoDB ID:', realUserIdStr);
        console.log('Leader ID:', leaderIdString);
        
        // Nếu một trong hai ID khớp với leaderId, người dùng là admin
        setIsCurrentUserAdmin(
          currentUserId === leaderIdString || 
          (realUserId && realUserIdStr === leaderIdString)
        );

        // Trong useEffect kiểm tra quyền, thêm đoạn code này trước khi kết thúc try block

        // Kiểm tra nếu người dùng hiện tại là phó nhóm
        // Kiểm tra xem người dùng hiện tại có trong danh sách phó nhóm không
        const isManager = managerIds.some(managerId => {
          const managerId_str = String(managerId);
          return managerId_str === currentUserId || (realUserId && managerId_str === realUserIdStr);
        });

        setIsCurrentUserManager(isManager);

        console.log('DEBUG - Is current user manager?', isManager);
      } catch (error) {
        console.error('Error fetching conversation data:', error);
        Alert.alert('Lỗi', 'Không thể tải thông tin nhóm');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [conversationId, user?._id, realUserId]);

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMember = () => {
    // Thay thế dòng hiện tại bằng dòng này
    navigation.navigate('AddToGroupScreen', { conversationId });
  };

  // Cập nhật hàm handleRemoveMember để tránh phó nhóm xóa trưởng nhóm hoặc phó nhóm khác

const handleRemoveMember = (member) => {
  // Ngăn không cho phó nhóm xóa trưởng nhóm hoặc phó nhóm khác
  if (!isCurrentUserAdmin && (member.isLeader || member.isManager)) {
    Alert.alert(
      'Không được phép',
      'Bạn không có quyền xóa trưởng nhóm hoặc phó nhóm khác.',
      [{ text: 'OK' }]
    );
    return;
  }
  
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
        onPress: async () => {
          try {
            setIsLoading(true);
            
            // Gọi API để xóa thành viên
            await conversationApi.deleteMember(conversationId, member._id);
            
            // Cập nhật UI sau khi xóa
            const updatedMembers = members.filter(m => m._id !== member._id);
            setMembers(updatedMembers);
            
            Alert.alert('Thành công', 'Đã xóa thành viên khỏi nhóm');
          } catch (error) {
            console.error('Error removing member:', error);
            Alert.alert('Lỗi', 'Không thể xóa thành viên. Vui lòng thử lại sau.');
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]
  );
};

  const handleToggleManager = (member, makeManager) => {
    const action = makeManager ? 'đặt' : 'hủy';
    Alert.alert(
      `${makeManager ? 'Đặt' : 'Hủy'} làm phó nhóm`,
      `Bạn có chắc chắn muốn ${action} ${member.name} làm phó nhóm không?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đồng ý',
          onPress: async () => {
            try {
              // Hiển thị loading
              setIsLoading(true);
              
              if (makeManager) {
                // Gọi API để thêm phó nhóm
                await conversationApi.addManager(conversationId, [member._id]);
              } else {
                // Gọi API để hủy phó nhóm
                await conversationApi.deleteManager(conversationId, [member._id]);
              }
              
              // Cập nhật UI
              const updatedMembers = members.map(m => {
                if (m._id === member._id) {
                  return {
                    ...m,
                    isManager: makeManager
                  };
                }
                return m;
              });
              
              setMembers(updatedMembers);
              
              // Cập nhật danh sách managers
              if (makeManager) {
                setManagers([...managers, member._id]);
              } else {
                setManagers(managers.filter(id => id !== member._id));
              }
              
              Alert.alert('Thành công', `Đã ${action} làm phó nhóm thành công`);
            } catch (error) {
              console.error(`Error ${makeManager ? 'adding' : 'removing'} manager:`, error);
              Alert.alert('Lỗi', `Không thể ${action} làm phó nhóm. Vui lòng thử lại sau.`);
            } finally {
              setIsLoading(false);
            }
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
      
      <TouchableWithoutFeedback onPress={() => setOpenMenuId(null)}>
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Icon name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
        
            <TouchableOpacity 
              style={styles.addButton} 
              onPress={handleAddMember}
            >
              <Icon name="person-add" size={24} color={colors.primary} />
            </TouchableOpacity>
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
            renderItem={({ item, index }) => (
              <MemberItem 
                member={item} 
                onRemove={handleRemoveMember}
                onToggleManager={handleToggleManager}
                isCurrentUserAdmin={isCurrentUserAdmin}
                isCurrentUserManager={isCurrentUserManager} // Thêm prop này
                index={index}
                totalItems={filteredMembers.length}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
              />
            )}
            keyExtractor={item => item._id || item.id}
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
        </View>
      </TouchableWithoutFeedback>
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
    borderRadius: 10,
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
    borderRadius: 10,
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
  adminStatusText: {
    color: colors.primary, // Màu đặc biệt cho trưởng nhóm
    fontWeight: '500', // Tô đậm một chút
  },
  menuButton: {
    padding: spacing.sm,
  },
  menuPopup: {
    position: 'absolute',
    right: 10,             // Giảm khoảng cách từ phải
    top: 40,               // Tăng khoảng cách từ trên xuống
    backgroundColor: colors.white,
    borderRadius: 10,
    width: 200,            // Thêm chiều rộng cố định
    elevation: 8,          // Tăng độ nổi
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,          // Đảm bảo hiện trên các thành phần khác
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,   // Tăng từ spacing.sm
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
  managerBadge: {
    backgroundColor: colors.warning || '#FFA500', // Orange color for managers
  },
  managerStatusText: {
    color: colors.warning || '#FFA500',
    fontWeight: '500',
  },
});

export default MemberScreen;
