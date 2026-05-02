import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');

  const handleSendCode = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage('If your email is registered, you will receive a reset code shortly. Check your inbox!');
        setStep('code');
      } else {
        setErrorMessage(data.detail || 'Failed to send reset code');
      }
    } catch (error: any) {
      setErrorMessage('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!code.trim()) {
      setErrorMessage('Please enter the 6-digit code from your email');
      return;
    }
    if (!newPassword) {
      setErrorMessage('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          code: code.trim(),
          new_password: newPassword,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 2000);
      } else {
        setErrorMessage(data.detail || 'Failed to reset password');
      }
    } catch (error: any) {
      setErrorMessage('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => step === 'code' ? setStep('email') : router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <MaterialIcons name="lock-reset" size={60} color={Colors.primary} style={styles.icon} />
            <Text style={styles.title}>
              {step === 'email' ? 'Forgot Password?' : 'Enter Reset Code'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'email' 
                ? "No worries! Enter your email and we'll send you a reset code."
                : "Enter the 6-digit code we sent to your email."}
            </Text>
          </View>

          <View style={styles.form}>
            {step === 'email' ? (
              <>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="email" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={(text) => { setEmail(text); setErrorMessage(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>

                {/* Success Message */}
                {successMessage ? (
                  <View style={styles.successContainer}>
                    <MaterialIcons name="check-circle" size={18} color={Colors.primary} />
                    <Text style={styles.successText}>{successMessage}</Text>
                  </View>
                ) : null}

                {/* Error Message */}
                {errorMessage ? (
                  <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={18} color={Colors.error} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleSendCode}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.surface} />
                  ) : (
                    <Text style={styles.buttonText}>Send Reset Code</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="pin" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="6-digit code"
                    value={code}
                    onChangeText={(text) => { setCode(text.replace(/[^0-9]/g, '').slice(0, 6)); setErrorMessage(''); }}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <MaterialIcons name="lock" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    value={newPassword}
                    onChangeText={(text) => { setNewPassword(text); setErrorMessage(''); }}
                    secureTextEntry={!showPassword}
                    placeholderTextColor={Colors.textSecondary}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <MaterialIcons 
                      name={showPassword ? "visibility-off" : "visibility"} 
                      size={22} 
                      color={Colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <MaterialIcons name="lock-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChangeText={(text) => { setConfirmPassword(text); setErrorMessage(''); }}
                    secureTextEntry={!showPassword}
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>

                {/* Success Message */}
                {successMessage ? (
                  <View style={styles.successContainer}>
                    <MaterialIcons name="check-circle" size={18} color={Colors.primary} />
                    <Text style={styles.successText}>{successMessage}</Text>
                  </View>
                ) : null}

                {/* Error Message */}
                {errorMessage ? (
                  <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={18} color={Colors.error} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.surface} />
                  ) : (
                    <Text style={styles.buttonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSendCode}
                  style={styles.resendLink}
                  disabled={isLoading}
                >
                  <Text style={styles.resendLinkText}>
                    Didn't receive the code?{' '}
                    <Text style={styles.resendLinkTextBold}>Resend</Text>
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              style={styles.backToLoginLink}
            >
              <Text style={styles.backToLoginText}>
                <MaterialIcons name="arrow-back" size={14} color={Colors.textSecondary} />
                {' '}Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.text,
  },
  eyeButton: {
    padding: 8,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  successText: {
    flex: 1,
    color: Colors.primary,
    fontSize: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '15',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: Colors.error,
    fontSize: 14,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  resendLink: {
    alignItems: 'center',
    marginTop: 8,
  },
  resendLinkText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resendLinkTextBold: {
    color: Colors.primary,
    fontWeight: '600',
  },
  backToLoginLink: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  backToLoginText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
