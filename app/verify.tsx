import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';

export default function VerifyScreen() {
  const router = useRouter();
  const { user, verifyEmail, resendVerification } = useAuthStore();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Refs for input focus management
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Redirect if already verified
  useEffect(() => {
    if (user?.email_verified) {
      router.replace('/(tabs)/home');
    }
  }, [user?.email_verified]);

  const handleCodeChange = (text: string, index: number) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setErrorMessage('');

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (digit && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (codeString?: string) => {
    const fullCode = codeString || code.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    
    try {
      await verifyEmail(fullCode);
      setSuccessMessage('Email verified! Welcome to WayPledge!');
      setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 1000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Verification failed');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setErrorMessage('');
    
    try {
      await resendVerification();
      setSuccessMessage('New verification code sent! Check your email.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <MaterialIcons name="mark-email-read" size={80} color={Colors.primary} />
          </View>

          {/* Header */}
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to{'\n'}
            <Text style={styles.email}>{user?.email}</Text>
          </Text>

          {/* Code Input */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.codeInput,
                  digit ? styles.codeInputFilled : null,
                ]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={index === 0}
              />
            ))}
          </View>

          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={18} color={Colors.error} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Success Message */}
          {successMessage ? (
            <View style={styles.successContainer}>
              <MaterialIcons name="check-circle" size={18} color={Colors.success} />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
            onPress={() => handleVerify()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.verifyButtonText}>Verify Email</Text>
            )}
          </TouchableOpacity>

          {/* Resend Link */}
          <TouchableOpacity 
            onPress={handleResend} 
            disabled={isResending}
            style={styles.resendButton}
          >
            {isResending ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.resendText}>
                Didn't receive the code? <Text style={styles.resendLink}>Resend</Text>
              </Text>
            )}
          </TouchableOpacity>

          {/* Skip for now */}
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip for now (limited access)</Text>
          </TouchableOpacity>

          {/* Info */}
          <View style={styles.infoContainer}>
            <MaterialIcons name="info-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              You can browse and join Communities, but you'll need to verify your email to create Pledges or Wishes.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  email: {
    color: Colors.primary,
    fontWeight: '600',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: Colors.text,
  },
  codeInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.pledgeLight,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '15',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    width: '100%',
  },
  errorText: {
    flex: 1,
    color: Colors.error,
    fontSize: 14,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '15',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    width: '100%',
  },
  successText: {
    flex: 1,
    color: Colors.success,
    fontSize: 14,
    fontWeight: '500',
  },
  verifyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 20,
    padding: 8,
  },
  resendText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  resendLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 16,
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginTop: 32,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
