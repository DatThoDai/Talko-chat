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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { colors, spacing } from '../styles';
import { updateProfile, clearError, getUserProfile } from '../redux/authSlice';

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Tên không được để trống'),
  email: Yup.string().email('Email không hợp lệ').required('Email không được để trống'),
  phone: Yup.string().matches(/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số'),
});

const EditProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, isLoading, error, profileUpdateSuccess } = useSelector((state) => state.auth);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(parseDate(user?.birthdate || '20/11/2000'));
  const [gender, setGender] = useState(user?.gender || 'Nam');
  
  // Xóa lỗi khi vào màn hình
  useEffect(() => {
    dispatch(clearError());
    // Tải lại thông tin người dùng khi vào màn hình
    dispatch(getUserProfile());
    return () => dispatch(clearError());
  }, [dispatch]);
  
  // Xử lý khi cập nhật hồ sơ thành công
  useEffect(() => {
    if (profileUpdateSuccess) {
      Alert.alert(
        'Thành công',
        'Thông tin cá nhân đã được cập nhật',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [profileUpdateSuccess, navigation]);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const parseDate = (dateString) => {
    if (!dateString) return new Date();
    const [day, month, year] = dateString.split('/');
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  };

  const handleSubmit = (values) => {
    // Gọi API cập nhật hồ sơ thông qua Redux
    dispatch(updateProfile({
      ...values,
      gender,
      birthdate: formatDate(selectedDate),
    }));
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Đang tải...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      
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
      
      <Formik
        initialValues={{
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          birthdate: user.birthdate || '20/11/2000',
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
          <ScrollView style={styles.content}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Họ và tên</Text>
              <TextInput
                style={styles.input}
                value={values.name}
                onChangeText={handleChange('name')}
                onBlur={handleBlur('name')}
                placeholder="Nhập họ và tên"
              />
              {touched.name && errors.name && (
                <Text style={styles.errorText}>{errors.name}</Text>
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={values.email}
                onChangeText={handleChange('email')}
                onBlur={handleBlur('email')}
                placeholder="Nhập email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {touched.email && errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                value={values.phone}
                onChangeText={handleChange('phone')}
                onBlur={handleBlur('phone')}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
              />
              {touched.phone && errors.phone && (
                <Text style={styles.errorText}>{errors.phone}</Text>
              )}
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
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ngày sinh</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text>{values.birthdate}</Text>
              </TouchableOpacity>
              
              <Modal
                transparent={true}
                visible={showDatePicker}
                animationType="slide"
                onRequestClose={() => setShowDatePicker(false)}
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
                        {/* Day Selector */}
                        <View style={styles.pickerColumn}>
                          <Text style={styles.pickerLabel}>Ngày</Text>
                          <FlatList
                            data={Array.from({length: 31}, (_, i) => String(i + 1).padStart(2, '0'))}
                            renderItem={({item}) => (
                              <TouchableOpacity 
                                style={[styles.pickerItem, 
                                  item === String(selectedDate.getDate()).padStart(2, '0') && styles.selectedPickerItem]}
                                onPress={() => {
                                  const newDate = new Date(selectedDate);
                                  newDate.setDate(parseInt(item));
                                  setSelectedDate(newDate);
                                }}
                              >
                                <Text style={[styles.pickerItemText, 
                                  item === String(selectedDate.getDate()).padStart(2, '0') && styles.selectedPickerItemText]}>
                                  {item}
                                </Text>
                              </TouchableOpacity>
                            )}
                            keyExtractor={item => `day-${item}`}
                            style={styles.pickerList}
                            showsVerticalScrollIndicator={false}
                            initialScrollIndex={selectedDate.getDate() - 1}
                            getItemLayout={(data, index) => (
                              {length: 44, offset: 44 * index, index}
                            )}
                          />
                        </View>
                        
                        {/* Month Selector */}
                        <View style={styles.pickerColumn}>
                          <Text style={styles.pickerLabel}>Tháng</Text>
                          <FlatList
                            data={Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0'))}
                            renderItem={({item}) => (
                              <TouchableOpacity 
                                style={[styles.pickerItem, 
                                  item === String(selectedDate.getMonth() + 1).padStart(2, '0') && styles.selectedPickerItem]}
                                onPress={() => {
                                  const newDate = new Date(selectedDate);
                                  newDate.setMonth(parseInt(item) - 1);
                                  setSelectedDate(newDate);
                                }}
                              >
                                <Text style={[styles.pickerItemText, 
                                  item === String(selectedDate.getMonth() + 1).padStart(2, '0') && styles.selectedPickerItemText]}>
                                  {item}
                                </Text>
                              </TouchableOpacity>
                            )}
                            keyExtractor={item => `month-${item}`}
                            style={styles.pickerList}
                            showsVerticalScrollIndicator={false}
                            initialScrollIndex={selectedDate.getMonth()}
                            getItemLayout={(data, index) => (
                              {length: 44, offset: 44 * index, index}
                            )}
                          />
                        </View>
                        
                        {/* Year Selector */}
                        <View style={styles.pickerColumn}>
                          <Text style={styles.pickerLabel}>Năm</Text>
                          <FlatList
                            data={Array.from({length: 100}, (_, i) => String(2024 - i))}
                            renderItem={({item}) => (
                              <TouchableOpacity 
                                style={[styles.pickerItem, 
                                  item === String(selectedDate.getFullYear()) && styles.selectedPickerItem]}
                                onPress={() => {
                                  const newDate = new Date(selectedDate);
                                  newDate.setFullYear(parseInt(item));
                                  setSelectedDate(newDate);
                                }}
                              >
                                <Text style={[styles.pickerItemText, 
                                  item === String(selectedDate.getFullYear()) && styles.selectedPickerItemText]}>
                                  {item}
                                </Text>
                              </TouchableOpacity>
                            )}
                            keyExtractor={item => `year-${item}`}
                            style={styles.pickerList}
                            showsVerticalScrollIndicator={false}
                            initialScrollIndex={2024 - selectedDate.getFullYear()}
                            getItemLayout={(data, index) => (
                              {length: 44, offset: 44 * index, index}
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
                        onPress={() => {
                          setShowDatePicker(false);
                          setFieldValue('birthdate', formatDate(selectedDate));
                        }}
                      >
                        <Text style={styles.confirmButtonText}>Xác nhận</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            </View>
            
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </Formik>
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
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
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
