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
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius, typography } from '../styles';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = () => {
    setIsLoading(true);
    setError(null);
    
    // Basic validation
    if (!name || !email || !password || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin');
      setIsLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp');
      setIsLoading(false);
      return;
    }
    
    // In a real app, you would have API calls here
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('ConfirmOTP', { email });
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Đăng ký tài khoản</Text>
            <View style={styles.emptySpace} />
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputWrapper}>
              <Icon name="person" size={20} color={colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Họ và tên"
                value={name}
                onChangeText={setName}
              />
            </View>

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

            <View style={styles.inputWrapper}>
              <Icon name="lock" size={20} color={colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Icon
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={colors.gray}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <Icon name="lock" size={20} color={colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Xác nhận mật khẩu"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Icon
                  name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={colors.gray}
                />
              </TouchableOpacity>
            </View>

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomContainer}>
            <Text style={styles.hasAccountText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginText}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
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
  formContainer: {
    marginVertical: spacing.xl,
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
  eyeIcon: {
    padding: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    marginVertical: spacing.sm,
    textAlign: 'center',
  },
  registerButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: spacing.md,
  },
  hasAccountText: {
    color: colors.dark,
    fontSize: 14,
  },
  loginText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
