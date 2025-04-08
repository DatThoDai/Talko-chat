import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import * as authService from '../api/authService';
import { useDispatch } from 'react-redux';
import { loginUser } from '../redux/authSlice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius, typography } from '../styles';

const CELL_COUNT = 6;
const RESEND_TIMEOUT = 60;

const ConfirmOTPScreen = ({ route, navigation }) => {
  const { username, isResetPassword = false } = route.params || {};
  const [value, setValue] = useState('');
  const [timeLeft, setTimeLeft] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const dispatch = useDispatch();
  
  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue,
  });
  
  // Đếm ngược thời gian gửi lại OTP
  useEffect(() => {
    let timer;
    if (timeLeft > 0 && !canResend) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [timeLeft, canResend]);
  
  // Xác thực OTP
  const handleVerify = async () => {
    setError('');
    setCodeError('');
    
    // Xác thực đầu vào
    if (value.length !== CELL_COUNT) {
      setCodeError('Vui lòng nhập đủ mã xác nhận');
      return;
    }
    
    setIsLoading(true);
    try {
      // Gửi API xác thực OTP
      const response = await authService.confirmAccount(username, value);
      setIsLoading(false);

      // Xử lý response
      if (response.token) {
        // Đăng nhập tự động sau khi xác thực thành công
        dispatch(loginUser({ email: username, password: '' })); // Password không quan trọng vì đã có token
        Alert.alert(
          'Xác nhận thành công',
          'Tài khoản của bạn đã được xác nhận thành công. Bạn đã được đăng nhập tự động.',
          [{ text: 'OK' }]
        );
      } else {
        // Trường hợp không có token, hiển thị thông báo lỗi
        Alert.alert(
          'Xác nhận tài khoản thất bại',
          'Bạn đã xác nhận thành công, nhưng không thể đăng nhập tự động. Vui lòng đăng nhập lại.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Có lỗi xảy ra khi xác thực OTP');
    }
  };
  
  // Gửi lại mã OTP
  const handleResendCode = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    try {
      // TODO: Implement resend OTP API call when available
      // await authService.resendOTP(username);
      
      // Tạm thời dùng mock call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTimeLeft(RESEND_TIMEOUT);
      setCanResend(false);
      setIsLoading(false);
      Alert.alert(
        'Gửi lại OTP thành công',
        'Chúng tôi đã gửi lại mã OTP mới đến ' + username,
        [{ text: 'OK' }]
      );
    } catch (err) {
      setIsLoading(false);
      setError('Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
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
            <Text style={styles.headerTitle}>Xác nhận OTP</Text>
            <View style={styles.emptySpace} />
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.description}>
              Chúng tôi đã gửi mã xác nhận đến {username}
            </Text>
            
            <CodeField
              ref={ref}
              {...props}
              value={value}
              onChangeText={setValue}
              cellCount={CELL_COUNT}
              rootStyle={styles.codeFieldRoot}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              renderCell={({ index, symbol, isFocused }) => (
                <View
                  key={index}
                  style={[
                    styles.cell,
                    isFocused && styles.focusCell,
                  ]}
                  onLayout={getCellOnLayoutHandler(index)}
                >
                  <Text style={styles.cellText}>
                    {symbol || (isFocused ? <Cursor /> : null)}
                  </Text>
                </View>
              )}
            />

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {codeError ? (
              <Text style={styles.errorText}>{codeError}</Text>
            ) : null}
            
            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerify}
              disabled={isLoading || value.length !== CELL_COUNT}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.verifyButtonText}>Xác nhận</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Không nhận được mã? {' '}
              </Text>
              {canResend ? (
                <TouchableOpacity onPress={handleResendCode} disabled={isLoading}>
                  <Text style={styles.resendActionText}>Gửi lại</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.resendTimeText}>
                  Gửi lại sau {timeLeft}s
                </Text>
              )}
            </View>
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
  codeFieldRoot: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    justifyContent: 'center',
  },
  cell: {
    width: 40,
    height: 50,
    borderBottomWidth: 2,
    borderColor: colors.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
  },
  focusCell: {
    borderColor: colors.primary,
  },
  cellText: {
    ...typography.h2,
    color: colors.dark,
    textAlign: 'center',
  },
  errorText: {
    color: colors.danger,
    marginVertical: spacing.sm,
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  resendText: {
    ...typography.body,
    color: colors.gray,
  },
  resendActionText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: 'bold',
  },
  resendTimeText: {
    ...typography.body,
    color: colors.gray,
  },
});

export default ConfirmOTPScreen;
