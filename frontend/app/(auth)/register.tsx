import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';

// BETA MODE - Set to true to disable registration
const BETA_MODE = false;  // Registration open with approval required

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  
  // If in beta mode, show beta message instead of registration form
  if (BETA_MODE) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.betaContainer}>
          <View style={styles.betaIconContainer}>
            <MaterialIcons name="science" size={64} color={Colors.accent} />
          </View>
          
          <Text style={styles.betaTitle}>Beta Testing</Text>
          
          <Text style={styles.betaMessage}>
            WayPledge is currently in private beta testing.
          </Text>
          
          <Text style={styles.betaMessage}>
            We're building a community where people give and receive freely, without money changing hands.
          </Text>
          
          <View style={styles.betaBox}>
            <MaterialIcons name="email" size={24} color={Colors.primary} />
            <Text style={styles.betaBoxText}>
              Want to be a tester?{'\n'}
              Email us at:
            </Text>
            <TouchableOpacity 
              onPress={() => Linking.openURL('mailto:together@waypledge.me?subject=Beta%20Tester%20Request')}
            >
              <Text style={styles.betaEmail}>together@waypledge.me</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.betaNote}>
            Tell us a bit about yourself and why you'd like to join the WayPledge community!
          </Text>
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={20} color={Colors.primary} />
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Anti-spam: Honeypot field (invisible to users, only bots fill it)
  const [website, setWebsite] = useState('');
  
  // Anti-spam: Track form load time to detect instant bot submissions
  const formLoadTime = useRef<number>(Date.now());
  const MIN_SUBMIT_TIME_MS = 3000; // 3 seconds minimum

  const getMyLocation = async () => {
    setIsGettingLocation(true);
    setErrorMessage('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Location permission denied. Please enter your location manually.');
        setIsGettingLocation(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude: lat, longitude: lng } = currentLocation.coords;
      
      // Store coordinates
      setLatitude(lat);
      setLongitude(lng);

      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        // Build a readable location string
        const parts = [];
        if (addr.city) parts.push(addr.city);
        if (addr.region) parts.push(addr.region);
        if (addr.country) parts.push(addr.country);
        
        const locationString = parts.join(', ') || `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
        setLocation(locationString);
      } else {
        setLocation(`${lat.toFixed(2)}, ${lng.toFixed(2)}`);
      }
    } catch (error) {
      setErrorMessage('Could not get your location. Please enter it manually.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleRegister = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    
    // Anti-spam check 1: Honeypot - if filled, it's a bot
    if (website) {
      // Silently reject bot submissions (don't tell them why)
      setErrorMessage('Registration failed. Please try again later.');
      return;
    }
    
    // Anti-spam check 2: Time-based - reject instant submissions
    const timeSinceLoad = Date.now() - formLoadTime.current;
    if (timeSinceLoad < MIN_SUBMIT_TIME_MS) {
      setErrorMessage('Please take a moment to fill out the form properly.');
      return;
    }
    
    // Validation with specific error messages
    if (!name.trim()) {
      setErrorMessage('Please enter your name');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }
    if (!email.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter a password');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    if (!location.trim()) {
      setErrorMessage('Please enter your location or tap the GPS button');
      return;
    }

    setIsLoading(true);
    setSuccessMessage('Creating your account...');
    
    try {
      await register(
        email.toLowerCase().trim(), 
        password, 
        name.trim(), 
        bio.trim(), 
        location.trim(), 
        latitude, 
        longitude,
        displayName.trim() || undefined
      );
      setSuccessMessage('Account created! Taking you to WayPledge...');
      setTimeout(() => {
        // Go directly to home - email verification disabled
        router.replace('/(tabs)/home');
      }, 500);
    } catch (error: any) {
      setSuccessMessage('');
      setErrorMessage(error.message || 'Registration failed. Please try again.');
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
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Join WayPledge</Text>
            <Text style={styles.subtitle}>Create your account to start pledging and wishing</Text>
          </View>

          <View style={styles.form}>
            {/* Honeypot field - invisible to users, only bots fill this */}
            <TextInput
              style={styles.honeypot}
              placeholder="Website"
              value={website}
              onChangeText={setWebsite}
              autoComplete="off"
              tabIndex={-1}
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
            />
            
            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your Name *"
                value={name}
                onChangeText={setName}
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
            <Text style={styles.fieldHint}>Your real name (kept private, only shared when you choose)</Text>

            <View style={styles.inputContainer}>
              <MaterialIcons name="badge" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Display Name (optional)"
                value={displayName}
                onChangeText={setDisplayName}
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
            <Text style={styles.fieldHint}>Public nickname shown on pledges & wishes (e.g., "Sarah M" or "HelpfulNeighbour")</Text>

            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email *"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password *"
                value={password}
                onChangeText={(text) => { setPassword(text); setErrorMessage(''); }}
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

            <View style={styles.locationContainer}>
              <View style={[styles.inputContainer, styles.locationInput]}>
                <MaterialIcons name="location-on" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Location *"
                  value={location}
                  onChangeText={setLocation}
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>
              <TouchableOpacity 
                style={styles.gpsButton} 
                onPress={getMyLocation}
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <ActivityIndicator size="small" color={Colors.surface} />
                ) : (
                  <MaterialIcons name="my-location" size={22} color={Colors.surface} />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.locationHint}>Enter your city/area or tap the GPS button</Text>

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={18} color={Colors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Success Message Display */}
            {successMessage ? (
              <View style={styles.successContainer}>
                <MaterialIcons name="check-circle" size={18} color={Colors.success} />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.surface} />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              style={styles.loginLink}
            >
              <Text style={styles.loginLinkText}>
                Already have an account?{' '}
                <Text style={styles.loginLinkTextBold}>Sign In</Text>
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
  // Honeypot field - completely hidden from users
  honeypot: {
    position: 'absolute',
    left: -9999,
    width: 1,
    height: 1,
    opacity: 0,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
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
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationInput: {
    flex: 1,
  },
  gpsButton: {
    backgroundColor: Colors.primary,
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: -8,
    marginLeft: 4,
  },
  eyeButton: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error + '15',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
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
    marginBottom: 8,
    gap: 8,
  },
  successText: {
    flex: 1,
    color: Colors.success,
    fontSize: 14,
    fontWeight: '500',
  },
  fieldHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: -4,
    marginBottom: 8,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  registerButton: {
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
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: Colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  loginLinkText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  loginLinkTextBold: {
    color: Colors.primary,
    fontWeight: '600',
  },
  // Beta mode styles
  betaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  betaIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  betaTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  betaMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  betaBox: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  betaBoxText: {
    fontSize: 15,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  betaEmail: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  betaNote: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
    padding: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
});
