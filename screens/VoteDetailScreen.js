import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, typography } from '../styles';
import VoteProgress from '../components/VoteProgress';
import CustomAvatar from '../components/CustomAvatar';
import voteApi from '../api/voteApi';
import { updateVoteInfo, setCurrentVote } from '../redux/chatSlice';
import userService from '../api/userService';
import socketService from '../utils/socketService';

const VoteDetailScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  
  const chatState = useSelector(state => state.chat);
  const currentVote = chatState?.currentVote || route.params?.voteData;
  const { user } = useSelector(state => state.auth);
  
  // Thêm state để quản lý loading
  const [loading, setLoading] = useState(false);
  // Mapping người dùng với ID
  const [userMapping, setUserMapping] = useState({});
  // Thay đổi state để lưu nhiều lựa chọn
  const [selectedOptions, setSelectedOptions] = useState([]);
  // Lưu trạng thái ban đầu (mảng các phương án)
  const [initialVoteState, setInitialVoteState] = useState([]);
  // Kiểm tra nếu đã thay đổi lựa chọn
  const [hasChanged, setHasChanged] = useState(false);

  // Sửa phần useEffect fetch dữ liệu ban đầu
  useEffect(() => {
    // Fetch dữ liệu vote nếu: không có currentVote HOẶC có forceRefresh từ navigation
    if ((!currentVote && route.params?.conversationId) || route.params?.forceRefresh) {
      const fetchVoteDetails = async () => {
        setLoading(true);
        try {
          console.log('Fetching votes with conversationId:', route.params.conversationId, 
                      '- MessageId:', route.params?.messageId,
                      '- ForceRefresh:', route.params?.forceRefresh);
          
          // Reset selected options khi load lại dữ liệu
          setSelectedOptions([]);
          setInitialVoteState([]);
          
          // Sửa từ getVoteById thành getVotesByConversationId
          const response = await voteApi.getVotesByConversationId(route.params.conversationId);
          
          // Xử lý data từ API
          if (response && response.data) {
            console.log('Vote response received:', response.data);
            
            // Xác định cấu trúc dữ liệu và lấy vote đầu tiên
            let voteData;
            if (response.data.data && Array.isArray(response.data.data)) {
              // Cấu trúc như trong Postman: { data: [...votes] }
              voteData = response.data.data[0];
            } else if (Array.isArray(response.data)) {
              // Nếu API trả về trực tiếp một mảng
              voteData = response.data[0];
            } else {
              // Trường hợp API trả về một vote đơn lẻ
              voteData = response.data;
            }
            
            // Tìm đúng vote theo messageId trong danh sách kết quả
            // (Thêm vào sau dòng kiểm tra response.data)
            if (response && response.data) {
              let votes = [];
              if (response.data.data && Array.isArray(response.data.data)) {
                votes = response.data.data;
              } else if (Array.isArray(response.data)) {
                votes = response.data;
              }
              
              // Nếu có route.params.messageId thì dùng để tìm vote cụ thể
              if (route.params?.messageId && votes.length > 0) {
                const targetVote = votes.find(vote => vote._id === route.params.messageId);
                if (targetVote) {
                  voteData = targetVote;
                } else {
                  voteData = votes[0]; // Mặc định lấy vote đầu tiên
                }
              } else {
                voteData = votes[0]; // Mặc định lấy vote đầu tiên
              }
              // Tiếp tục xử lý với voteData...
            }
            
            if (voteData) {
              console.log('Selected vote data:', voteData._id);
              dispatch(setCurrentVote(voteData));
              
              // Tạo mapping userIds và thông tin người dùng
              if (voteData.userOptions && Array.isArray(voteData.userOptions)) {
                const mapping = {};
                voteData.userOptions.forEach(user => {
                  mapping[user._id] = user;
                });
                setUserMapping(mapping);
              }
              
              // Khởi tạo các lựa chọn đã chọn
              if (voteData.options && user) {
                const userChoices = voteData.options
                  .filter(opt => opt.userIds && Array.isArray(opt.userIds) && opt.userIds.includes(user._id))
                  .map(opt => opt.name);
                
                console.log('User choices:', userChoices);
                setSelectedOptions([...userChoices]);
                setInitialVoteState([...userChoices]);
              }
            } else {
              console.error('No vote data found');
              Alert.alert('Lỗi', 'Không tìm thấy dữ liệu bình chọn');
            }
          }
        } catch (error) {
          console.error('Error fetching vote details:', error);
          Alert.alert('Lỗi', 'Không thể tải thông tin bình chọn');
        } finally {
          setLoading(false);
        }
      };
      
      fetchVoteDetails();
    } else if (currentVote && currentVote.userOptions) {
      // Code xử lý mapping khi đã có sẵn currentVote
      const mapping = {};
      currentVote.userOptions.forEach(user => {
        mapping[user._id] = user;
      });
      setUserMapping(mapping);
    }
  }, [route.params?.conversationId, currentVote?.userOptions, route.params?.forceRefresh, route.params?.timestamp]);

  // Sửa phần xác định các lựa chọn của người dùng
  useEffect(() => {
    if (currentVote && currentVote.options && user) {
      console.log('Current user:', user);
      const fetchCorrectUserId = async () => {
        try {
          // Sử dụng email của người dùng để tìm MongoDB ID
          const userEmail = user.email || user._id;
          console.log('Searching for userId with email:', userEmail);

          // Gọi API để lấy thông tin user từ email
          const response = await userService.searchByUsername(userEmail);
          
          if (response && response.data) {
            // Lấy _id từ response
            const mongoUserId = response.data._id || (Array.isArray(response.data) && response.data[0]?._id);
            console.log('Found MongoDB user ID:', mongoUserId);
            
            if (mongoUserId) {
              // Tìm các lựa chọn mà người dùng đã chọn dựa trên mongoUserId
              const userChoices = currentVote.options
                .filter(opt => opt.userIds && Array.isArray(opt.userIds) && 
                        opt.userIds.some(id => id === mongoUserId))
                .map(opt => opt.name);
                
              console.log('User choices found with correct ID:', userChoices);
              
              // Cập nhật state với các lựa chọn đã tìm thấy
              setSelectedOptions([...userChoices]);
              setInitialVoteState([...userChoices]);
            } else {
              console.log('MongoDB ID not found in response');
            }
          } else {
            console.log('User not found by email');
          }
        } catch (error) {
          console.error('Error finding user ID:', error);
        }
      };

      fetchCorrectUserId();
    }
  }, [currentVote, user]);

  // Thêm useEffect để lắng nghe socket events
  useEffect(() => {
    // Đăng ký event listener khi component mount
    if (currentVote && currentVote._id) {
      const handleVoteUpdated = (updatedMessage) => {
        console.log('Received socket vote-updated event');
        
        // Chỉ xử lý nếu là vote hiện tại
        if (updatedMessage._id === currentVote._id && updatedMessage.type === 'VOTE') {
          console.log('Updating current vote from socket event');
          dispatch(setCurrentVote(updatedMessage));
          
          // Cập nhật mapping
          if (updatedMessage.userOptions && Array.isArray(updatedMessage.userOptions)) {
            const mapping = {};
            updatedMessage.userOptions.forEach(user => {
              mapping[user._id] = user;
            });
            setUserMapping(mapping);
          }
          
          // Fetch lại các lựa chọn của người dùng hiện tại
          if (user && updatedMessage.options) {
            const userEmail = user.email || user._id;
            userService.searchByUsername(userEmail)
              .then(response => {
                if (response && response.data) {
                  const mongoUserId = response.data._id || (Array.isArray(response.data) && response.data[0]?._id);
                  if (mongoUserId) {
                    const userChoices = updatedMessage.options
                      .filter(opt => opt.userIds && Array.isArray(opt.userIds) && 
                              opt.userIds.some(id => id === mongoUserId))
                      .map(opt => opt.name);
                    
                    setSelectedOptions([...userChoices]);
                    setInitialVoteState([...userChoices]);
                  }
                }
              })
              .catch(err => console.error('Error finding user ID from socket update:', err));
          }
        }
      };
      
      // Đăng ký lắng nghe event socket
      socketService.on('vote-updated', handleVoteUpdated);
      socketService.on('new-message', handleVoteUpdated);
      
      // Cleanup khi component unmount
      return () => {
        socketService.off('vote-updated', handleVoteUpdated);
        socketService.off('new-message', handleVoteUpdated);
      };
    }
  }, [currentVote?._id, user]);

  const voteUtils = {
    getTotalOfVotes: (options) => {
      if (!options || !Array.isArray(options)) return 0;
      return options.reduce((total, option) => {
        return total + (option.userIds ? option.userIds.length : 0);
      }, 0);
    },
    getPercentOfVotes: (total, count) => {
      if (total === 0) return 0;
      return Math.round((count / total) * 100);
    },
    getNumOfPeopleVoted: (options) => {
      if (!options || !Array.isArray(options)) return 0;
      
      const allUserIds = [];
      options.forEach(option => {
        if (option.userIds && Array.isArray(option.userIds)) {
          option.userIds.forEach(userId => {
            if (!allUserIds.includes(userId)) {
              allUserIds.push(userId);
            }
          });
        }
      });
      
      return allUserIds.length;
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết bình chọn</Text>
          <View style={styles.rightButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải thông tin bình chọn...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!currentVote) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết bình chọn</Text>
          <View style={styles.rightButton} />
        </View>
        <View style={styles.emptyContainer}>
          <Text>Không có dữ liệu bình chọn</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { content, options = [] } = currentVote;
  
  // Sắp xếp options theo số người bình chọn (giảm dần)
  const sortedOptions = [...options].sort((a, b) => 
    (b.userIds?.length || 0) - (a.userIds?.length || 0)
  );
  
  const totalVotes = voteUtils.getTotalOfVotes(options);
  const totalVoters = voteUtils.getNumOfPeopleVoted(options);

  // Tạo thời gian hiển thị
  const createdDate = new Date(currentVote.createdAt);
  const formattedDate = createdDate.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Kiểm tra xem hai mảng có các phần tử khác nhau không
  const areArraysDifferent = (arr1, arr2) => {
    if (arr1.length !== arr2.length) return true;
    
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    
    for (let i = 0; i < sorted1.length; i++) {
      if (sorted1[i] !== sorted2[i]) return true;
    }
    
    return false;
  };

  // Xử lý khi người dùng chọn một phương án
  const handleVoteChange = (isChecked, optionName) => {
    console.log(`Option ${optionName} changed to ${isChecked ? 'checked' : 'unchecked'}`);
    
    let updatedOptions = [...selectedOptions];
    
    if (isChecked) {
      // Thêm phương án vào danh sách đã chọn nếu chưa có
      if (!updatedOptions.includes(optionName)) {
        updatedOptions.push(optionName);
      }
    } else {
      // Xóa phương án khỏi danh sách đã chọn nếu có
      updatedOptions = updatedOptions.filter(option => option !== optionName);
    }
    
    console.log('Updated options:', updatedOptions);
    setSelectedOptions(updatedOptions);
    setHasChanged(areArraysDifferent(updatedOptions, initialVoteState));
  };

  // Cập nhật hàm handleConfirm
const handleConfirm = async () => {
  try {
    if (!user) {
      Alert.alert('Lỗi', 'Bạn cần đăng nhập để bình chọn');
      return;
    }
    
    setLoading(true);
    
    // Lấy MongoDB ID từ email
    const userEmail = user.email || user._id;
    const response = await userService.searchByUsername(userEmail);
    let mongoUserId = null;
    
    if (response && response.data) {
      mongoUserId = response.data._id || (Array.isArray(response.data) && response.data[0]?._id);
      console.log('Using MongoDB ID for API calls:', mongoUserId);
    }
    
    if (!mongoUserId) {
      console.error('Could not determine MongoDB ID for user');
      Alert.alert('Lỗi', 'Không thể xác định thông tin người dùng');
      setLoading(false);
      return;
    }
    
    // Tìm phương án đã chọn trước đây nhưng không còn được chọn nữa
    const optionsToRemove = initialVoteState.filter(
      option => !selectedOptions.includes(option)
    );
    
    // Tìm phương án mới được chọn
    const optionsToAdd = selectedOptions.filter(
      option => !initialVoteState.includes(option)
    );
    
    console.log('Options to remove:', optionsToRemove);
    console.log('Options to add:', optionsToAdd);
    
    // Xóa các phương án không còn được chọn
    if (optionsToRemove.length > 0) {
      const removeResponse = await voteApi.deleteSelectOption(currentVote._id, { options: optionsToRemove });
      console.log('Remove response:', removeResponse);
      
      // Cập nhật Redux store với MongoDB ID đúng
      optionsToRemove.forEach(optionName => {
        dispatch(updateVoteInfo({
          messageId: currentVote._id,
          optionName,
          userId: mongoUserId, // Sử dụng MongoDB ID thay vì user._id
          isAdd: false
        }));
      });
    }
    
    // Thêm các phương án mới được chọn
    if (optionsToAdd.length > 0) {
      const addResponse = await voteApi.selectOption(currentVote._id, { options: optionsToAdd });
      console.log('Add response:', addResponse);
      
      // Cập nhật Redux store với MongoDB ID đúng
      optionsToAdd.forEach(optionName => {
        dispatch(updateVoteInfo({
          messageId: currentVote._id,
          optionName,
          userId: mongoUserId, // Sử dụng MongoDB ID thay vì user._id
          isAdd: true
        }));
      });
    }
    
    // Cập nhật trạng thái ban đầu
    setInitialVoteState([...selectedOptions]);
    setHasChanged(false);
    
    // Fetch lại thông tin vote để cập nhật UI
    try {
      // Sử dụng route.params.conversationId nếu có, hoặc lấy từ currentVote
      const conversationId = route.params?.conversationId || currentVote.conversationId;
      console.log('Refreshing votes with conversationId:', conversationId);
      
      const response = await voteApi.getVotesByConversationId(conversationId);
      if (response && response.data) {
        // Tìm vote hiện tại trong danh sách
        let votes = [];
        if (response.data.data && Array.isArray(response.data.data)) {
          votes = response.data.data;
        } else if (Array.isArray(response.data)) {
          votes = response.data;
        }
        
        const updatedVote = votes.find(vote => vote._id === currentVote._id);
        if (updatedVote) {
          console.log('Found updated vote data, updating UI');
          dispatch(setCurrentVote(updatedVote));
          
          // Cập nhật mapping để hiển thị thông tin người dùng chính xác
          if (updatedVote.userOptions && Array.isArray(updatedVote.userOptions)) {
            const mapping = {};
            updatedVote.userOptions.forEach(user => {
              mapping[user._id] = user;
            });
            setUserMapping(mapping);
          }
          
          // Cập nhật các lựa chọn đã chọn với MongoDB ID đúng
          if (updatedVote.options && mongoUserId) {
            const newUserChoices = updatedVote.options
              .filter(opt => opt.userIds && Array.isArray(opt.userIds) && 
                      opt.userIds.some(id => id === mongoUserId))
              .map(opt => opt.name);
            
            console.log('Updated user choices:', newUserChoices);
            setSelectedOptions([...newUserChoices]);
            setInitialVoteState([...newUserChoices]);
          }
        }
      }
    } catch (refreshError) {
      console.error('Error refreshing vote data:', refreshError);
    }
    
    Alert.alert('Thành công', 'Đã cập nhật lựa chọn của bạn');
  } catch (error) {
    console.error('Error confirming vote:', error);
    Alert.alert('Lỗi', 'Không thể cập nhật bình chọn');
  } finally {
    setLoading(false);
  }
};

  // Xử lý khi nhấn nút hủy
  const handleCancel = () => {
    // Khôi phục lại trạng thái ban đầu
    setSelectedOptions([...initialVoteState]);
    setHasChanged(false);
  };

  // Lấy thông tin người tạo bình chọn
  const creatorName = currentVote.user?.name || 'Người dùng';
  const creatorAvatar = currentVote.user?.avatar || '';
  const creatorAvatarColor = currentVote.user?.avatarColor || '#1194ff';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.white} barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết bình chọn</Text>
        <View style={styles.rightButton} />
      </View>
      
      <View style={styles.questionContainer}>
        <View style={styles.creatorInfo}>
          <CustomAvatar
            size={40}
            name={creatorName}
            imageUrl={creatorAvatar}
            backgroundColor={creatorAvatarColor}
          />
          <View style={styles.creatorTextContainer}>
            <Text style={styles.creatorName}>{creatorName}</Text>
            <Text style={styles.creationTime}>{formattedDate}</Text>
          </View>
        </View>
        
        <Text style={styles.questionText}>{content}</Text>
        <Text style={styles.voteSummary}>
          {totalVoters} người đã bình chọn • Tổng cộng {totalVotes} lựa chọn • Chọn nhiều phương án
        </Text>
      </View>
      
      <View style={styles.optionsContainer}>
        {sortedOptions.map((option, index) => {
          // Kiểm tra xem option này có được chọn không
          const isOptionSelected = selectedOptions.includes(option.name);
          
          return (
            <View key={option._id || index} style={styles.optionItem}>
              <VoteProgress
                totalOfVotes={totalVotes}
                option={option}
                voteUtils={voteUtils}
                isCheckBoxType={true}
                onChange={handleVoteChange}
                checked={isOptionSelected} // Truyền prop rõ ràng
              />
              
              {option.userIds && option.userIds.length > 0 && (
                <View style={styles.votersContainer}>
                  <Text style={styles.votersTitle}>
                    Người đã bình chọn ({option.userIds.length}):
                  </Text>
                  <FlatList
                    data={option.userIds}
                    keyExtractor={(item, i) => `voter-${option.name}-${i}`}
                    renderItem={({ item: userId }) => {
                      // Lấy thông tin user từ mapping
                      const voterInfo = userMapping[userId] || { name: "Người dùng", avatar: "" };
                      
                      return (
                        <View style={styles.voterItem}>
                          <CustomAvatar 
                            size={30}
                            name={voterInfo.name}
                            imageUrl={voterInfo.avatar}
                            backgroundColor={voterInfo.avatarColor || "#1194ff"}
                          />
                          <Text style={styles.voterName}>{voterInfo.name}</Text>
                        </View>
                      );
                    }}
                    style={styles.votersList}
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Thêm phần nút hủy và xác nhận */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={handleCancel}
          disabled={!hasChanged || loading}
        >
          <Text style={[
            styles.actionButtonText, 
            (!hasChanged || loading) && styles.disabledButtonText
          ]}>Hủy</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.actionButton, 
            styles.confirmButton, 
            (!hasChanged || loading) && styles.disabledConfirmButton
          ]}
          onPress={handleConfirm}
          disabled={!hasChanged || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={[
              styles.actionButtonText,
              styles.confirmButtonText,
              (!hasChanged || loading) && styles.disabledButtonText
            ]}>Xác nhận</Text>
          )}
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
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.dark,
  },
  rightButton: {
    width: 40,
  },
  questionContainer: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  creatorTextContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  creatorName: {
    ...typography.subtitle,
    color: colors.dark,
    fontWeight: 'bold',
  },
  creationTime: {
    ...typography.caption,
    color: colors.gray,
  },
  questionText: {
    ...typography.h2,
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  voteSummary: {
    ...typography.caption,
    color: colors.gray,
  },
  optionsContainer: {
    padding: spacing.md,
    flex: 1,
  },
  optionItem: {
    marginBottom: spacing.lg,
  },
  votersContainer: {
    marginTop: spacing.sm,
    marginLeft: spacing.lg,
  },
  votersTitle: {
    ...typography.subtitle,
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  votersList: {
    maxHeight: 120, // Giới hạn chiều cao danh sách người bình chọn
  },
  voterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  voterName: {
    ...typography.body,
    marginLeft: spacing.sm,
    color: colors.dark,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.light,
  },
  actionButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  cancelButton: {
    backgroundColor: colors.light,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  disabledConfirmButton: {
    backgroundColor: colors.light,
  },
  actionButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmButtonText: {
    color: colors.white,
  },
  disabledButtonText: {
    color: colors.gray,
  },
});

export default VoteDetailScreen;