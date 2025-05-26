import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, typography, borderRadius } from '../styles';
import { conversationApi, userService } from '../api'; // Thêm userService
import { useSelector } from 'react-redux'; // Import để lấy user ID
import RenameGroupModal from '../components/modal/RenameGroupModal';
import ChangeGroupAvatarModal from '../components/modal/ChangeGroupAvatarModal';

import { useDispatch } from 'react-redux';
import { fetchFiles } from '../redux/chatSlice';
import { messageType } from '../constants'; // Import messageType từ constants
const OptionItem = ({ icon, title, onPress, color = colors.dark }) => {
  return (
    <TouchableOpacity style={styles.optionItem} onPress={onPress}>
      <Icon name={icon} size={24} color={color} style={styles.optionIcon} />
      <Text style={[styles.optionText, { color }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const ConversationOptionsScreen = ({ route, navigation }) => {
  const { conversationId, name, type = 'private', avatar } = route.params || {};
  const [isLoading, setIsLoading] = useState({
    notifications: false,
    leave: false,
    delete: false,
  });
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const { user } = useSelector(state => state.auth);
  const userId = user?._id;
  const [isGroupAdmin, setIsGroupAdmin] = useState(false); // Thêm state này
  const [groupName, setGroupName] = useState(name || 'Nhóm chat');
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [changeAvatarModalVisible, setChangeAvatarModalVisible] = useState(false);
  
  // Thêm dòng này để khởi tạo dispatch
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Giả định trạng thái mặc định là "đã bật thông báo"
    setNotificationEnabled(true);
    
    // Debug thông tin để xác nhận params
    console.log('ConversationOptions loaded with params:', {
      conversationId,
      name,
      type,
      isGroupParam: route.params?.isGroupChat
    });
    
    // Thêm kiểm tra vai trò nếu là nhóm
    if (type === 'group' || route.params?.isGroupChat) {
      checkUserRole();
    }
    
  }, [conversationId]);

  // Thêm hàm mới để kiểm tra vai trò
  const checkUserRole = async () => {
    try {
      const response = await conversationApi.fetchConversation(conversationId);
      
      if (response?.data) {
        // Lấy leaderId từ response
        const leaderId = response.data.leaderId;
        let leaderIdString = '';
        
        // Xử lý cả trường hợp leaderId là string hoặc object MongoDB
        if (typeof leaderId === 'object' && leaderId.$oid) {
          leaderIdString = leaderId.$oid;
        } else {
          leaderIdString = String(leaderId);
        }
        
        let userIdToCompare = userId;
        
        // Nếu userId là email, cần lấy ID thực từ API
        if (userId && userId.includes('@')) {
          try {
            const userResponse = await userService.searchByUsername(userId);
            if (userResponse && userResponse.data && userResponse.data._id) {
              userIdToCompare = String(userResponse.data._id);
            }
          } catch (error) {
            console.error('Error getting real user ID:', error);
          }
        }
        
        // So sánh ID để xác định người dùng có phải là trưởng nhóm không
        const isAdmin = String(userIdToCompare) === leaderIdString;
        setIsGroupAdmin(isAdmin);
        
        console.log('User role check:', {
          userIdToCompare,
          leaderId: leaderIdString,
          isAdmin
        });
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const handleClose = () => {
    try {
      // Chỉ đơn giản quay lại màn hình trước đó
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error navigating back:', error);
    }
  };

  const handleViewMembers = () => {
    navigation.navigate('Member', { 
      conversationId, 
      name,
      isGroup: type === 'group' || Boolean(route.params?.isGroupChat)
    });
    // Xóa dòng navigation.goBack() ở đây vì nó sẽ làm người dùng quay lại trước khi thấy màn hình Member
  };

  // Sửa hàm handleViewMedia
const handleViewMedia = async () => {
  try {
    console.log('handleViewMedia called with conversationId:', conversationId);
    console.log('Route params:', route.params);
    // Hiển thị loading nếu cần
    setIsLoading(prev => ({ ...prev, media: true }));
    
    // Sử dụng conversationId từ route.params thay vì currentConversationId
    await dispatch(
      fetchFiles({
        conversationId: conversationId, // Sửa ở đây
        type: messageType.ALL,
      })
    );
    
    // Điều hướng đến FileScreen - đảm bảo tên này trùng khớp với định nghĩa trong navigator
    navigation.navigate('FileScreen');
  } catch (error) {
    console.error('Error loading files:', error);
    Alert.alert('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại sau.');
  } finally {
    // Tắt loading
    setIsLoading(prev => ({ ...prev, media: false }));
  }
};

  const handleNotifications = async () => {
    try {
      setIsLoading(prev => ({ ...prev, notifications: true }));
      
      // Toggle trạng thái thông báo và gọi API
      const newNotificationState = !notificationEnabled;
      
      // Gọi API để cập nhật trạng thái thông báo
      await conversationApi.updateNotify(conversationId, newNotificationState);
      
      // Cập nhật state local
      setNotificationEnabled(newNotificationState);
      
      // Hiển thị thông báo thành công bằng Alert thay vì Toast
      Alert.alert(
        'Thông báo', 
        'Thông báo đã được ' + (newNotificationState ? 'bật' : 'tắt')
      );
    } catch (error) {
      console.error('Error updating notifications:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái thông báo');
    } finally {
      setIsLoading(prev => ({ ...prev, notifications: false }));
    }
  };

  const LEAVE_GROUP_MESSAGE = 'Bạn có chắc chắn muốn rời khỏi nhóm không?';
  const DELETE_GROUP_MESSAGE = 'Bạn có chắc chắn muốn xóa cuộc trò chuyện này không? Hành động này không thể hoàn tác.';

  const handleLeaveGroup = () => {
    // Kiểm tra nếu người dùng là trưởng nhóm
    if (isGroupAdmin) {
      Alert.alert(
        'Không thể rời nhóm',
        'Bạn đang là nhóm trưởng không thể rời nhóm. Vui lòng chuyển quyền trưởng nhóm cho người khác trước khi rời nhóm.',
        [{ text: 'Đã hiểu' }]
      );
      return;
    }
    
    // Tiếp tục với code hiện tại nếu không phải trưởng nhóm
    Alert.alert(
      'Rời nhóm',
      LEAVE_GROUP_MESSAGE,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Rời nhóm',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(prev => ({ ...prev, leave: true }));
              
              // Gọi API để rời nhóm
              await conversationApi.leaveGroup(conversationId);
              
              // Hiển thị thông báo thành công bằng Alert thay vì Toast
              Alert.alert('Thông báo', 'Đã rời nhóm thành công');
              
              // Quay lại và điều hướng đến màn hình cuộc trò chuyện
              navigation.pop(2); // Pop cả màn hình options và message
              navigation.navigate('Tin nhắn'); // Quay về tab tin nhắn
            } catch (error) {
              console.error('Error leaving group:', error);
              
              // Kiểm tra lỗi cụ thể
              let errorMessage = 'Không thể rời nhóm. Vui lòng thử lại sau.';
              if (error.response?.data?.message === "Cant't leave group") {
                errorMessage = 'Bạn đang là nhóm trưởng không thể rời nhóm.';
              }
              
              Alert.alert('Lỗi', errorMessage);
            } finally {
              setIsLoading(prev => ({ ...prev, leave: false }));
            }
          }
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Giải tán nhóm',
      DELETE_GROUP_MESSAGE,
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
              setIsLoading(prev => ({ ...prev, delete: true }));
              
              // Gọi API khác nhau tùy thuộc vào loại cuộc trò chuyện
              if (type === 'group') {
                // Xóa nhóm (chỉ admin mới có thể xóa nhóm)
                await conversationApi.deleteGroup(conversationId);
              } else {
                // Xóa tất cả tin nhắn trong cuộc trò chuyện cá nhân
                await conversationApi.deleteAllMessage(conversationId);
              }
              
              // Hiển thị thông báo thành công bằng Alert thay vì Toast
              Alert.alert('Thông báo', 'Đã giải tán nhóm thành công');
              
              // Quay lại và điều hướng đến màn hình cuộc trò chuyện
              navigation.pop(2); // Pop cả màn hình options và message
              navigation.navigate('Tin nhắn'); // Quay về tab tin nhắn
            } catch (error) {
              console.error('Error deleting conversation:', error);
              Alert.alert('Lỗi', 'Không thể giải tán nhóm. Vui lòng thử lại sau.');
            } finally {
              setIsLoading(prev => ({ ...prev, delete: false }));
            }
          }
        },
      ]
    );
  };

  const handleCreateVote = () => {
    navigation.navigate('CreateVote', { conversationId });
  };

  const handleRenameGroup = () => {
    // Luôn cập nhật groupName từ tham số mới nhất
    if (route.params && route.params.name) {
      setGroupName(route.params.name);
    }
    
    setRenameModalVisible(true);
  };

  const handleRenameSuccess = (newName) => {
    setGroupName(newName);
    // Cập nhật tên trong màn hình tin nhắn
    if (navigation.canGoBack()) {
      // Cập nhật tham số cho màn hình MessageScreen
      navigation.setParams({ conversationName: newName });
      
      // Cập nhật tham số cho màn hình trước đó (MessageScreen)
      const previousScreen = navigation.getState().routes.find(route => 
        route.name === 'MessageScreen' || 
        (route.params && route.params.conversationId === conversationId)
      );
      
      if (previousScreen) {
        // Sử dụng navigate để cập nhật params cho màn hình tin nhắn
        navigation.navigate({
          name: previousScreen.name,
          params: { 
            ...previousScreen.params,
            conversationName: newName 
          },
          merge: true,
        });
      }
    }
  };

  const handleChangeAvatar = () => {
    setChangeAvatarModalVisible(true);
  };

  const handleAvatarChanged = (newAvatar) => {
    try {
      // Cập nhật params cho màn hình hiện tại trước
      if (route.params) {
        navigation.setParams({
          ...route.params,
          avatar: newAvatar
        });
      }

      // Quay về màn hình trước và cập nhật params
      if (navigation.canGoBack()) {
        navigation.navigate('MessageScreen', {
          conversationId,
          avatar: newAvatar,
          // Giữ lại các params khác
          name: route.params?.name,
          conversationName: route.params?.conversationName || groupName,
          isGroup: route.params?.isGroup || type === 'group',
          isGroupChat: route.params?.isGroupChat || type === 'group'
        });
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.lightGray} barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tùy chọn</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleClose}
        >
          <Icon name="close" size={24} color={colors.dark} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {type === 'group' && (
          <OptionItem
            icon="people"
            title="Xem thành viên"
            onPress={handleViewMembers}
          />
        )}
        
        {(type === 'group' || route.params?.isGroupChat) && (
          <>
            <OptionItem
              icon="poll"
              title="Tạo bình chọn"
              onPress={handleCreateVote}
            />
            
            <OptionItem
              icon="edit"
              title="Đổi tên nhóm"
              onPress={handleRenameGroup}
            />

            <OptionItem
              icon="photo-camera"
              title="Đổi ảnh nhóm"
              onPress={handleChangeAvatar}
            />
          </>
        )}
        
        <OptionItem
          icon="photo-library"
          title="Xem ảnh, video và files"
          onPress={handleViewMedia}
        />
        
        <OptionItem
          icon="notifications"
          title="Thông báo"
          onPress={handleNotifications}
        />
        
        {/* Chỉ hiển thị nút "Rời nhóm" nếu không phải trưởng nhóm */}
        {type === 'group' && !isGroupAdmin && (
          <OptionItem
            icon="exit-to-app"
            title="Rời nhóm"
            onPress={handleLeaveGroup}
            color={colors.danger}
          />
        )}
        
        {/* Nếu là trưởng nhóm, chỉ hiển thị "Giải tán nhóm" */}
        {type === 'group' && isGroupAdmin && (
          <OptionItem
            icon="delete"
            title="Giải tán nhóm"
            onPress={handleDelete}
            color={colors.danger}
          />
        )}
        
        {/* Nếu là chat 1-1, hiển thị "Xóa cuộc trò chuyện" */}
        {type !== 'group' && (
          <OptionItem
            icon="delete"
            title="Xóa cuộc trò chuyện"
            onPress={handleDelete}
            color={colors.danger}
          />
        )}
      </View>

      {/* Thêm modal đổi tên nhóm */}
      <RenameGroupModal 
        visible={renameModalVisible}
        onClose={() => setRenameModalVisible(false)}
        conversationId={conversationId}
        currentName={groupName}
        onRenameSuccess={handleRenameSuccess}
      />

      <ChangeGroupAvatarModal
        visible={changeAvatarModalVisible}
        onClose={() => setChangeAvatarModalVisible(false)}
        conversationId={conversationId}
        onAvatarChanged={handleAvatarChanged}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.dark,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.md,
    padding: spacing.sm,
  },
  content: {
    backgroundColor: colors.white,
    marginTop: spacing.md,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  optionIcon: {
    marginRight: spacing.md,
  },
  optionText: {
    ...typography.body,
  },
});

export default ConversationOptionsScreen;
