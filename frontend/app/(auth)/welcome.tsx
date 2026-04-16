import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={require('../../assets/waypledge-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>WayPledge</Text>
          <Text style={styles.tagline}>Give and Receive With Love</Text>
        </View>

        {/* Main Message */}
        <View style={styles.messageSection}>
          <Text style={styles.mainMessage}>
            Imagine a world where help flows freely—no fees, no selling, just people supporting each other.
          </Text>
          <Text style={styles.subMessage}>
            WayPledge connects you with a community of givers and receivers. When you need help, simply ask. When you can help, simply give.
          </Text>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <MaterialIcons name="volunteer-activism" size={28} color={Colors.pledgeAccent} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Make a Pledge</Text>
              <Text style={styles.featureText}>Offer your skills, time, or resources to help others in your community</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <MaterialIcons name="auto-awesome" size={28} color={Colors.wishMedium} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Make a Wish</Text>
              <Text style={styles.featureText}>Share what you need—someone nearby may be ready to help</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <MaterialIcons name="hexagon" size={28} color={Colors.accent} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Join a Hive</Text>
              <Text style={styles.featureText}>Connect with local communities who share your values</Text>
            </View>
          </View>
        </View>

        {/* Our Promise */}
        <View style={styles.promiseSection}>
          <View style={styles.promiseHeader}>
            <MaterialIcons name="favorite" size={24} color={Colors.error} />
            <Text style={styles.promiseTitle}>Our Promise</Text>
          </View>
          <Text style={styles.promiseText}>
            <Text style={styles.bold}>"Do No Harm"</Text> — Every member pledges to treat others with kindness and respect. This isn't a marketplace—it's a movement of mutual care.
          </Text>
        </View>

        {/* Values */}
        <View style={styles.valuesSection}>
          <View style={styles.valueItem}>
            <MaterialIcons name="money-off" size={20} color={Colors.success} />
            <Text style={styles.valueText}>No money exchanged</Text>
          </View>
          <View style={styles.valueItem}>
            <MaterialIcons name="people" size={20} color={Colors.success} />
            <Text style={styles.valueText}>Community over transactions</Text>
          </View>
          <View style={styles.valueItem}>
            <MaterialIcons name="handshake" size={20} color={Colors.success} />
            <Text style={styles.valueText}>Trust through connection</Text>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.primaryButtonText}>Join the Community</Text>
            <MaterialIcons name="arrow-forward" size={20} color={Colors.surface} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.secondaryButtonText}>I Already Have an Account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Quote */}
        <View style={styles.footerSection}>
          <Text style={styles.footerQuote}>
            "When it's your turn, you only need ask."
          </Text>
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
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
  },
  logo: {
    width: 90,
    height: 90,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  messageSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mainMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 12,
  },
  subMessage: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  howItWorksSection: {
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 14,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  featureText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  promiseSection: {
    backgroundColor: Colors.primary + '10',
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  promiseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  promiseTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  promiseText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: Colors.primary,
  },
  valuesSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  valueText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: Colors.surface,
    fontSize: 17,
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
    fontSize: 15,
    fontWeight: '600',
  },
  footerSection: {
    alignItems: 'center',
    paddingTop: 8,
  },
  footerQuote: {
    fontSize: 14,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
