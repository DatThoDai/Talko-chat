import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../redux/authSlice';
import { colors, typography, spacing, borderRadius } from '../styles';
import Icon from 'react-native-vector-icons/MaterialIcons';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { isLoading, error } = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const handleLogin = () => {
    dispatch(loginUser({ email, password }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Talko</Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Icon name="email" size={20} color={colors.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email/Số điện thoại"
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

            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            {error && (
              <Text style={styles.errorText}>
                {error}
              </Text>
            )}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.loginButtonText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.bottomContainer}>
            <Text style={styles.noAccountText}>Không có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}>Đăng ký</Text>
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
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl * 2,
  },
  logoText: {
    ...typography.h1,
    color: colors.primary,
    fontSize: 48,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginVertical: spacing.xl,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.light,
    marginBottom: spacing.md,
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
  },
  errorText: {
    color: colors.danger,
    marginVertical: spacing.sm,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  noAccountText: {
    color: colors.dark,
    fontSize: 14,
  },
  registerText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
