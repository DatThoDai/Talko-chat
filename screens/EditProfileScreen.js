import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { colors, spacing } from '../styles';
import meApi from '../api/meApi';
import { updateProfile, clearError, resetSuccess } from '../redux/authSlice';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Tên không được để trống'),
  //email: Yup.string().email('Email không hợp lệ').required('Email không được để trống'),
});

// Format date for API submission - try object format since backend calls dateUtils.toDateFromObject
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  
  // Return a date object with day, month, year properties
  // Based on backend code: dateUtils.toDateFromObject(dateOfBirth)
  return {
    day: d.getDate(),
    month: d.getMonth() + 1,
    year: d.getFullYear()
  };
};

// Format date for display - DD/MM/YYYY for user interface
const formatDateForDisplay = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

// Chuyển đổi chuỗi ngày dạng DD/MM/YYYY hoặc ISO format hoặc object format thành Date object
const parseDate = (dateString) => {
  if (!dateString) return new Date(2000, 0, 1); // Default to January 1, 2000
  
  // If already a Date object
  if (dateString instanceof Date) {
    return dateString;
  }
  
  // Handle object format from backend {day, month, year}
  if (typeof dateString === 'object' && dateString.day && dateString.month && dateString.year) {
    return new Date(dateString.year, dateString.month - 1, dateString.day);
  }
  
  // Handle DD/MM/YYYY format
  if (typeof dateString === 'string' && dateString.includes('/')) {
    const [day, month, year] = dateString.split('/');
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  }
  
  // Handle YYYY-MM-DD format
  if (typeof dateString === 'string' && dateString.includes('-')) {
    const [year, month, day] = dateString.split('-');
    // If day contains time info (like "01T00:00:00")
    const cleanDay = day.split('T')[0];
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(cleanDay, 10));
  }
  
  // Handle ISO string or other formats
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    } else {
      console.error('Invalid date format:', dateString);
      return new Date(2000, 0, 1); // Default date
    }
  } catch (e) {
    console.error('Error parsing date:', e, dateString);
    return new Date(2000, 0, 1); // Default date
  }
};

const EditProfileScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { user: authUser, isLoading, error, profileUpdateSuccess } = useSelector((state) => state.auth);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Get user data from route params if available
  const userData = route.params?.userData;
  
  // Use a ref to make sure we update the date only once initially
  const initialDateSet = React.useRef(false);
  
  // Initialize with a safe default date
  const [selectedDate, setSelectedDate] = useState(new Date(2000, 0, 1));
  
  // Use userData for gender if available, otherwise fall back to authUser
  const [gender, setGender] = useState(() => {
    if (userData?.gender !== undefined) {
      return userData.gender === 1 ? 'Nam' : 'Nữ';
    } else if (authUser?.gender !== undefined) {
      return authUser.gender === 1 ? 'Nam' : 'Nữ';
    }
    return 'Nam'; // Default
  });
  
  // Combine userData and authUser to get the most complete user object
  const user = React.useMemo(() => {
    if (!userData && !authUser) return null;
    
    return {
      ...authUser,
      ...userData,
      // Ensure we have these fields
      name: userData?.name || authUser?.name || '',
      username: userData?.username || authUser?.username || '',
      dateOfBirth: userData?.dateOfBirth || authUser?.dateOfBirth,
      gender: userData?.gender !== undefined ? userData.gender : authUser?.gender
    };
  }, [userData, authUser]);
  
  // Set initial date when user data is available
  useEffect(() => {
    // First try the userData from route params
    const dateSource = userData?.dateOfBirth || user?.dateOfBirth;
    
    if (dateSource && !initialDateSet.current) {
      try {
        const parsedDate = parseDate(dateSource);
        console.log('Initial date parsing:', {
          source: 'userData or user',
          original: typeof dateSource === 'object' ? 
            JSON.stringify(dateSource) : 
            dateSource,
          parsed: parsedDate,
          formatted: formatDateForDisplay(parsedDate)
        });
        
        if (!isNaN(parsedDate.getTime())) {
          setSelectedDate(parsedDate);
          initialDateSet.current = true;
        }
      } catch (err) {
        console.error('Error parsing initial date:', err);
      }
    }
    
    // Set gender based on user data - backend uses 1 for Male, 0 for Female
    if (userData?.gender !== undefined) {
      setGender(userData.gender === 1 ? 'Nam' : 'Nữ');
    } else if (user?.gender !== undefined) {
      setGender(user.gender === 1 ? 'Nam' : 'Nữ');
    }
  }, [userData, user]);
  
  // Xóa lỗi khi vào màn hình và xử lý khi thoát
  useEffect(() => {
    dispatch(clearError());
    return () => {
      dispatch(clearError());
      dispatch(resetSuccess());
    };
  }, [dispatch]);
  
  // Xử lý khi cập nhật hồ sơ thành công
  useEffect(() => {
    if (profileUpdateSuccess) {
      console.log('Profile update successful!');
      
      // Log thông tin ngày sinh sau khi cập nhật thành công
      if (authUser && authUser.dateOfBirth) {
        console.log('Updated date of birth in Redux store:', {
          value: authUser.dateOfBirth,
          type: typeof authUser.dateOfBirth,
          isObject: typeof authUser.dateOfBirth === 'object',
          objectProps: typeof authUser.dateOfBirth === 'object' ? Object.keys(authUser.dateOfBirth) : 'not an object'
        });
      }
      
      Alert.alert(
        'Thành công',
        'Thông tin cá nhân đã được cập nhật',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      dispatch(resetSuccess());
    }
  }, [profileUpdateSuccess, navigation, dispatch, authUser]);

  // Debug user data when component mounts
  useEffect(() => {
    console.log('User data sources in EditProfileScreen:', {
      fromRoute: userData ? {
        name: userData.name,
        username: userData.username,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender
      } : 'No route params',
      fromRedux: authUser ? {
        name: authUser.name,
        username: authUser.username,
        dateOfBirth: authUser.dateOfBirth,
        gender: authUser.gender
      } : 'No auth user',
      combinedUser: user ? {
        name: user.name,
        username: user.username,
        dateOfBirth: user.dateOfBirth ? 
          (typeof user.dateOfBirth === 'object' ? 
            JSON.stringify(user.dateOfBirth) : 
            user.dateOfBirth) 
          : 'No date',
        parsedDate: user.dateOfBirth ? 
          formatDateForDisplay(parseDate(user.dateOfBirth)) 
          : 'No date',
        gender: user.gender,
      } : 'No user'
    });
  }, [user, userData, authUser]);

  // Create form initial values - make sure we always have valid values
  const getInitialFormValues = () => {
    // Prefer userData from route params if available
    if (userData) {
      return {
        name: userData.name || '',
        email: userData.username || '',
      };
    }
    
    // Fall back to combined user object
    return {
      name: user?.name || '',
      email: user?.username || '',
    };
  };

  const handleSubmit = async (values) => {
    console.log('Submitting profile update with values:', values);
    
    // Validate date
    const birthDate = parseDate(selectedDate);
    if (isNaN(birthDate.getTime())) {
      Alert.alert(
        'Lỗi',
        'Ngày sinh không hợp lệ. Vui lòng chọn lại.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Format date as object with day, month, year for API (based on backend code)
    const formattedDate = formatDate(birthDate);
    console.log('Formatted birth date:', JSON.stringify(formattedDate));
    
    // Format gender as EXACTLY 0 or 1 number (not string, not boolean)
    // Based on backend code: if (gender !== 0 && gender !== 1) error.gender = GENDER_INVALID;
    const genderValue = gender === 'Nam' ? 1 : 0;
    
    // Ensure we have valid username - prefer route params first, then combined user, then auth user
    const username = userData?.username || user?.username || authUser?.username || '';
    
    // Chuẩn bị dữ liệu để cập nhật hồ sơ
    const profileData = {
      name: values.name.trim(),
      dateOfBirth: formattedDate,
      gender: genderValue,
      username: username
    };
    
    console.log('Sending profile data:', JSON.stringify(profileData, null, 2));
    
    // Gọi action Redux để cập nhật hồ sơ
    try {
      await dispatch(updateProfile(profileData)).unwrap();
      // Thông báo thành công sẽ được xử lý bởi useEffect khi profileUpdateSuccess thay đổi
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Try to get more information about the error
      const errorMessage = typeof error === 'string' 
        ? error 
        : (error?.message || 'Không thể cập nhật thông tin cá nhân');
      
      Alert.alert(
        'Lỗi',
        errorMessage,
        [{ text: 'OK' }]
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user && !userData && !authUser) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Không tìm thấy thông tin người dùng</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.saveButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 40 : 0;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đổi thông tin</Text>
          <View style={styles.placeholder} />
        </View>
      </View>
      
      <SafeAreaView style={styles.contentContainer}>
        <Formik
          initialValues={getInitialFormValues()}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
            <ScrollView style={styles.content}>
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorMessage}>{error}</Text>
                </View>
              )}
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Họ và tên</Text>
                <TextInput
                  style={styles.input}
                  value={values.name}
                  onChangeText={handleChange('name')}
                  onBlur={handleBlur('name')}
                  placeholder="Nhập họ và tên của bạn"
                />
                {touched.name && errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email (không thể thay đổi)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.light }]}
                  value={values.email}
                  editable={false}
                />
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Ngày sinh</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text>
                    {formatDateForDisplay(selectedDate)}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={styles.label}>Giới tính</Text>
                <View style={styles.radioGroup}>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setGender('Nam')}
                  >
                    <View style={styles.radioCircle}>
                      {gender === 'Nam' && <View style={styles.selectedRadio} />}
                    </View>
                    <Text style={styles.radioText}>Nam</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => setGender('Nữ')}
                  >
                    <View style={styles.radioCircle}>
                      {gender === 'Nữ' && <View style={styles.selectedRadio} />}
                    </View>
                    <Text style={styles.radioText}>Nữ</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </Formik>
        
        {/* Modal chọn ngày tháng năm sinh */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Chọn ngày sinh</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Icon name="close" size={24} color={colors.dark} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.datePickerContent}>
                <View style={styles.pickerRow}>
                  {/* Ngày */}
                  <View style={styles.pickerColumn}>
                    <Text style={styles.pickerLabel}>Ngày</Text>
                    <FlatList
                      style={styles.pickerList}
                      data={Array.from({ length: 31 }, (_, i) => i + 1)}
                      keyExtractor={(item) => `day-${item}`}
                      showsVerticalScrollIndicator={false}
                      initialScrollIndex={selectedDate.getDate() - 1}
                      getItemLayout={(data, index) => ({
                        length: 44,
                        offset: 44 * index,
                        index,
                      })}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.pickerItem,
                            selectedDate.getDate() === item && styles.selectedPickerItem,
                          ]}
                          onPress={() => {
                            const newDate = new Date(selectedDate);
                            newDate.setDate(item);
                            setSelectedDate(newDate);
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerItemText,
                              selectedDate.getDate() === item && styles.selectedPickerItemText,
                            ]}
                          >
                            {item}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                  
                  {/* Tháng */}
                  <View style={styles.pickerColumn}>
                    <Text style={styles.pickerLabel}>Tháng</Text>
                    <FlatList
                      style={styles.pickerList}
                      data={Array.from({ length: 12 }, (_, i) => i + 1)}
                      keyExtractor={(item) => `month-${item}`}
                      showsVerticalScrollIndicator={false}
                      initialScrollIndex={selectedDate.getMonth()}
                      getItemLayout={(data, index) => ({
                        length: 44,
                        offset: 44 * index,
                        index,
                      })}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.pickerItem,
                            selectedDate.getMonth() + 1 === item && styles.selectedPickerItem,
                          ]}
                          onPress={() => {
                            const newDate = new Date(selectedDate);
                            newDate.setMonth(item - 1);
                            setSelectedDate(newDate);
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerItemText,
                              selectedDate.getMonth() + 1 === item && styles.selectedPickerItemText,
                            ]}
                          >
                            {item}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                  
                  {/* Năm */}
                  <View style={styles.pickerColumn}>
                    <Text style={styles.pickerLabel}>Năm</Text>
                    <FlatList
                      style={styles.pickerList}
                      data={Array.from(
                        { length: 100 },
                        (_, i) => new Date().getFullYear() - 99 + i
                      )}
                      keyExtractor={(item) => `year-${item}`}
                      showsVerticalScrollIndicator={false}
                      initialScrollIndex={
                        selectedDate.getFullYear() - (new Date().getFullYear() - 99)
                      }
                      getItemLayout={(data, index) => ({
                        length: 44,
                        offset: 44 * index,
                        index,
                      })}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.pickerItem,
                            selectedDate.getFullYear() === item && styles.selectedPickerItem,
                          ]}
                          onPress={() => {
                            const newDate = new Date(selectedDate);
                            newDate.setFullYear(item);
                            setSelectedDate(newDate);
                          }}
                        >
                          <Text
                            style={[
                              styles.pickerItemText,
                              selectedDate.getFullYear() === item && styles.selectedPickerItemText,
                            ]}
                          >
                            {item}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                </View>
              </View>
              
              <View style={styles.datePickerActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.confirmButtonText}>Xác nhận</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerContainer: {
    backgroundColor: colors.primary,
    paddingTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.gray,
  },
  header: {
    height: 86, // Standard Material Design app bar height
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  backButton: {
    padding: spacing.xs,
  },
  placeholder: {
    width: 24,
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  selectedRadio: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioText: {
    fontSize: 16,
    color: colors.dark,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: colors.danger,
    marginTop: spacing.xs,
    fontSize: 14,
  },
  errorContainer: {
    padding: spacing.md,
    backgroundColor: colors.dangerLight,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorMessage: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: spacing.md,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.dark,
  },
  datePickerContent: {
    padding: spacing.md,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 200,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: colors.dark,
  },
  pickerList: {
    maxHeight: 180,
  },
  pickerItem: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  selectedPickerItem: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 16,
    color: colors.dark,
  },
  selectedPickerItemText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.light,
  },
  cancelButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.md,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.gray,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: 'bold',
  },
});

export default EditProfileScreen;
