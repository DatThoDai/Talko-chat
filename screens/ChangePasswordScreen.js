import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { colors, spacing } from '../styles';

const validationSchema = Yup.object().shape({
  currentPassword: Yup.string().required('Vui lòng nhập mật khẩu hiện tại'),
  newPassword: Yup.string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .required('Vui lòng nhập mật khẩu mới'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'Mật khẩu không khớp')
    .required('Vui lòng xác nhận mật khẩu mới'),
});

const ChangePasswordScreen = ({ navigation }) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (values, { resetForm }) => {
    // In a real app, make API call to change password
    Alert.alert(
      'Thành công',
      'Mật khẩu của bạn đã được thay đổi',
      [
        { text: 'OK', onPress: () => {
          resetForm();
          navigation.goBack();
        }}
      ]
    );
  };

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
        <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
        <View style={styles.placeholder} />
      </View>
      
      <Formik
        initialValues={{
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <ScrollView style={styles.content}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Mật khẩu hiện tại</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={values.currentPassword}
                  onChangeText={handleChange('currentPassword')}
                  onBlur={handleBlur('currentPassword')}
                  placeholder="Nhập mật khẩu hiện tại"
                  secureTextEntry={!showCurrentPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Icon
                    name={showCurrentPassword ? 'visibility-off' : 'visibility'}
                    size={24}
                    color={colors.gray}
                  />
                </TouchableOpacity>
              </View>
              {touched.currentPassword && errors.currentPassword && (
                <Text style={styles.errorText}>{errors.currentPassword}</Text>
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Mật khẩu mới</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={values.newPassword}
                  onChangeText={handleChange('newPassword')}
                  onBlur={handleBlur('newPassword')}
                  placeholder="Nhập mật khẩu mới"
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Icon
                    name={showNewPassword ? 'visibility-off' : 'visibility'}
                    size={24}
                    color={colors.gray}
                  />
                </TouchableOpacity>
              </View>
              {touched.newPassword && errors.newPassword && (
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={values.confirmPassword}
                  onChangeText={handleChange('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  placeholder="Nhập lại mật khẩu mới"
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon
                    name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                    size={24}
                    color={colors.gray}
                  />
                </TouchableOpacity>
              </View>
              {touched.confirmPassword && errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSubmit}
            >
              <Text style={styles.saveButtonText}>Cập nhật mật khẩu</Text>
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
  passwordContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.light,
    borderRadius: 8,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  eyeIcon: {
    padding: spacing.sm,
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
});

export default ChangePasswordScreen;
