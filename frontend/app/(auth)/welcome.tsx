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
            <Text style={styles.title} maxFontSizeMultiplier={1.1}>WayPledge</Text>
            <Text style={styles.subtitle} maxFontSizeMultiplier={1.1}>Give and Receive With Love</Text>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.description} maxFontSizeMultiplier={1.1}>
              A community of mutual support where people pledge goods and services,
              and make wishes for what they need.
            </Text>
            <Text style={styles.descriptionBold} maxFontSizeMultiplier={1.1}>
              Based on shared intention, not transaction.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.primaryButtonText} maxFontSizeMultiplier={1.1}>Get Started</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.secondaryButtonText} maxFontSizeMultiplier={1.1}>I Already Have an Account</Text>
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
    paddingTop: 20,
    paddingBottom: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  descriptionContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
    marginVertical: 16,
  },
  description: {
    fontSize: 13,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  descriptionBold: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 10,
    paddingBottom: 20,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.surface,
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
});
