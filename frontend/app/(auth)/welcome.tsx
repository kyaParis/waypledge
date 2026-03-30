import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';

const { width, height } = Dimensions.get('window');
const isSmallScreen = height < 700;

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/waypledge-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>WayPledge</Text>
            <Text style={styles.subtitle}>Give and Receive With Love</Text>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              A community of mutual support where people pledge goods and services,
              and make wishes for what they need.
            </Text>
            <Text style={styles.descriptionBold}>
              Based on shared intention, not transaction.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.secondaryButtonText}>I Already Have an Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: isSmallScreen ? 20 : 40,
    paddingBottom: 30,
    minHeight: height - 100,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: isSmallScreen ? 10 : 20,
  },
  logo: {
    width: isSmallScreen ? 120 : 160,
    height: isSmallScreen ? 120 : 160,
    marginBottom: 12,
  },
  title: {
    fontSize: isSmallScreen ? 28 : 36,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: isSmallScreen ? 14 : 16,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  descriptionContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
    marginVertical: 20,
  },
  description: {
    fontSize: isSmallScreen ? 14 : 15,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  descriptionBold: {
    fontSize: isSmallScreen ? 14 : 15,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
