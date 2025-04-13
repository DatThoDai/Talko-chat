import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius, typography } from '../styles';
import { authApi } from '../api/authService';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Xác thực đầu vào
  const validateEmail = () => {
    if (!email.trim()) {
      setEmailError('Vui lòng nhập email');
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Email không hợp lệ');
      return false;
    } 
    setEmailError('');
    return true;
  };

  const handleResetPassword = async () => {
    // Xác thực email trước khi gửi yêu cầu
    if (!validateEmail()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Gửi API reset OTP
      await authApi.forgotPassword(email);
      
      setIsLoading(false);
      
      // Chuyển hướng đến màn hình xác thực OTP
      Alert.alert(
        'Gửi yêu cầu thành công',
        'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email và nhập mã OTP.',
        [{ text: 'OK', onPress: () => navigation.navigate('ConfirmOTP', { username: email, isResetPassword: true }) }]
      );
    } catch (error) {
      setIsLoading(false);
      setError(error.message || 'Gửi yêu cầu lỗi, vui lòng thử lại');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Quên mật khẩu</Text>
            <View style={styles.emptySpace} />
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.description}>
              Nhập email của bạn để nhận mã xác nhận
            </Text>

            <View style={styles.inputWrapper}>
              <Icon name="email" size={20} color={colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError('');
                  setError('');
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Tiếp tục</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  inner: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.dark,
  },
  emptySpace: {
    width: 40, // Same width as back button for alignment
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    marginTop: spacing.xl,
  },
  description: {
    ...typography.body,
    color: colors.gray,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
    marginBottom: spacing.lg,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  errorText: {
    color: colors.danger,
    marginVertical: spacing.sm,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;
