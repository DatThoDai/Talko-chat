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
} from 'react-native';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, spacing, borderRadius, typography } from '../styles';

const CELL_COUNT = 6;
const RESEND_TIMEOUT = 60;

const ConfirmOTPScreen = ({ route, navigation }) => {
  const { email, isResetPassword = false } = route.params || {};
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);
  
  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue,
  });
  
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
  
  const handleVerify = () => {
    setIsLoading(true);
    setError(null);
    
    // Basic validation
    if (value.length !== CELL_COUNT) {
      setError('Vui lòng nhập đủ mã xác nhận');
      setIsLoading(false);
      return;
    }
    
    // In a real app, you would have API calls here
    setTimeout(() => {
      setIsLoading(false);
      
      // For demo purposes, consider any code valid
      if (isResetPassword) {
        // Navigate to set new password screen (not implemented yet)
        navigation.navigate('Login');
      } else {
        // Registration completed successfully
        navigation.navigate('Login');
      }
    }, 1500);
  };
  
  const handleResendCode = () => {
    if (!canResend) return;
    
    // In a real app, you would have API calls here
    setTimeLeft(RESEND_TIMEOUT);
    setCanResend(false);
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
              Chúng tôi đã gửi mã xác nhận đến {email}
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

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerify}
              disabled={isLoading || value.length !== CELL_COUNT}
            >
              <Text style={styles.verifyButtonText}>
                {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Không nhận được mã? {' '}
              </Text>
              {canResend ? (
                <TouchableOpacity onPress={handleResendCode}>
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
