import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Button } from 'react-native-elements';
import { colors, spacing, typography } from '../styles';
import voteApi from '../api/voteApi';
import { useDispatch, useSelector } from 'react-redux'; // Thêm import này
import { addNewMessage } from '../redux/chatSlice'; // Thêm import này

const CreateVoteScreen = ({ route, navigation }) => {
  const { conversationId } = route.params || {};
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch(); // Thêm dòng này
  const { user } = useSelector(state => state.auth); // Lấy thông tin user

  // Thêm tùy chọn bình chọn mới
  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    } else {
      Alert.alert('Thông báo', 'Không thể thêm quá 10 phương án bình chọn');
    }
  };

  // Xóa tùy chọn bình chọn
  const removeOption = (index) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    } else {
      Alert.alert('Thông báo', 'Cần ít nhất 2 phương án bình chọn');
    }
  };

  // Cập nhật giá trị của tùy chọn bình chọn
  const updateOption = (text, index) => {
    const newOptions = [...options];
    newOptions[index] = text;
    setOptions(newOptions);
  };

  // Kiểm tra form có hợp lệ không
  const isFormValid = () => {
    if (!title.trim()) return false;
    
    // Kiểm tra có ít nhất 2 tùy chọn không rỗng
    const validOptions = options.filter(option => option.trim() !== '');
    if (validOptions.length < 2) return false;
    
    // Kiểm tra có tùy chọn trùng nhau không
    const uniqueOptions = new Set(options.map(opt => opt.trim()).filter(opt => opt !== ''));
    if (uniqueOptions.size < validOptions.length) return false;
    
    return true;
  };

  // Cập nhật phần xử lý tạo vote

const handleSubmit = async () => {
  if (!isFormValid()) {
    Alert.alert(
      'Lỗi',
      'Vui lòng nhập tiêu đề và ít nhất 2 phương án bình chọn khác nhau'
    );
    return;
  }

  setIsSubmitting(true);

  try {
    // Sửa ở đây - API yêu cầu một mảng string đơn giản
    const validOptions = options
      .filter(option => option.trim() !== '')
      .map(option => option.trim());
    
    // Chuẩn bị dữ liệu để gửi API
    const voteData = {
      content: title.trim(),
      options: validOptions, // Chỉ gửi mảng string
      conversationId: conversationId,
      type: 'VOTE'
    };
    
    console.log('Sending vote data:', JSON.stringify(voteData));
    
    // Gọi API tạo bình chọn
    const response = await voteApi.addVote(voteData);
    
    if (response && response.data) {
      // Dispatch thêm tin nhắn vote mới vào danh sách tin nhắn
      const newVoteMessage = {
        ...response.data,
        sender: user,
        isMyMessage: true,
        forceMyMessage: true
      };
      
      dispatch(addNewMessage(newVoteMessage));
      
      // Hiển thị thông báo thành công và quay lại màn hình chat
      Alert.alert('Thành công', 'Đã tạo bình chọn thành công', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  } catch (error) {
    console.error('Error creating vote:', error);
    console.log('Error details:', JSON.stringify(error.response?.data || error.message));
    Alert.alert('Lỗi', 'Không thể tạo bình chọn. Vui lòng thử lại sau.');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo bình chọn</Text>
          <TouchableOpacity
            style={[
              styles.createButton,
              !isFormValid() && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid() || isSubmitting}
          >
            <Text style={[
              styles.createButtonText,
              !isFormValid() && styles.disabledButtonText
            ]}>Tạo</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Câu hỏi bình chọn</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Nhập câu hỏi bình chọn"
              value={title}
              onChangeText={setTitle}
              multiline
            />
          </View>
          
          <Text style={styles.label}>Các phương án bình chọn</Text>
          
          {options.map((option, index) => (
            <View key={index} style={styles.optionContainer}>
              <TextInput
                style={styles.optionInput}
                placeholder={`Phương án ${index + 1}`}
                value={option}
                onChangeText={(text) => updateOption(text, index)}
              />
              {options.length > 2 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeOption(index)}
                >
                  <Icon name="close" size={20} color={colors.danger} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          <Button
            title="+ Thêm phương án"
            type="clear"
            onPress={addOption}
            buttonStyle={styles.addOptionButton}
            titleStyle={styles.addOptionButtonText}
          />
          
          <View style={styles.noteContainer}>
            <Icon name="info" size={16} color={colors.gray} style={styles.infoIcon} />
            <Text style={styles.noteText}>
              Bình chọn cho phép người tham gia chọn nhiều phương án
            </Text>
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <Button
            title="Tạo bình chọn"
            disabled={!isFormValid() || isSubmitting}
            loading={isSubmitting}
            buttonStyle={styles.submitButton}
            containerStyle={styles.submitButtonContainer}
            onPress={handleSubmit}
          />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
  createButton: {
    padding: spacing.sm,
  },
  createButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: colors.gray,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.subtitle,
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  optionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 16,
  },
  removeButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  addOptionButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.light,
    borderRadius: 8,
  },
  addOptionButtonText: {
    color: colors.primary,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
  },
  infoIcon: {
    marginRight: spacing.sm,
  },
  noteText: {
    ...typography.caption,
    color: colors.gray,
    flex: 1,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.light,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: spacing.sm,
  },
  submitButtonContainer: {
    borderRadius: 50,
  },
});

export default CreateVoteScreen;