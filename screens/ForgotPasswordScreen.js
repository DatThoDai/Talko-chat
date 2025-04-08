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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius, typography } from '../styles';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleResetPassword = () => {
    setIsLoading(true);
    setError(null);
    
    // Basic validation
    if (!email) {
      setError('Vui lòng nhập email hoặc số điện thoại');
      setIsLoading(false);
      return;
    }
    
    // In a real app, you would have API calls here
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('ConfirmOTP', { email, isResetPassword: true });
    }, 1500);
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
              Nhập email hoặc số điện thoại của bạn để nhận mã xác nhận
            </Text>

            <View style={styles.inputWrapper}>
              <Icon name="email" size={20} color={colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email hoặc số điện thoại"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Đang xử lý...' : 'Tiếp tục'}
              </Text>
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
