import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: March 30, 2026</Text>

        <Text style={styles.sectionTitle}>Introduction</Text>
        <Text style={styles.text}>
          WayPledge ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application and services.
        </Text>
        <Text style={styles.text}>
          WayPledge is a gift economy platform where people freely offer and receive goods, services, and support without monetary exchange.
        </Text>

        <Text style={styles.sectionTitle}>Information We Collect</Text>
        
        <Text style={styles.subTitle}>Account Information</Text>
        <Text style={styles.text}>
          When you create an account, we collect:{'\n'}
          • Your name (or display name){'\n'}
          • Email address{'\n'}
          • Password (stored securely using encryption){'\n'}
          • Optional: Location, bio, profile information
        </Text>

        <Text style={styles.subTitle}>Content You Create</Text>
        <Text style={styles.text}>
          • Pledges (offers to give){'\n'}
          • Wishes (requests for help){'\n'}
          • Messages between users{'\n'}
          • Gratitude posts{'\n'}
          • Hive memberships and interactions
        </Text>

        <Text style={styles.subTitle}>Automatically Collected Information</Text>
        <Text style={styles.text}>
          • Device type and operating system{'\n'}
          • App usage patterns{'\n'}
          • Error logs for troubleshooting
        </Text>

        <Text style={styles.sectionTitle}>How We Use Your Information</Text>
        <Text style={styles.text}>
          We use your information to:{'\n'}
          • Provide and maintain the WayPledge service{'\n'}
          • Connect you with other community members{'\n'}
          • Send important notifications about your pledges, wishes, and messages{'\n'}
          • Improve our services and user experience{'\n'}
          • Ensure community safety and enforce our Do No Harm pledge{'\n'}
          • Respond to support requests
        </Text>

        <Text style={styles.sectionTitle}>Information Sharing</Text>
        <Text style={styles.text}>
          <Text style={styles.bold}>We do not sell your personal information.</Text>
          {'\n\n'}
          Your information may be visible to:{'\n'}
          • Other WayPledge users (pledges, wishes, gratitude posts, and profile information you choose to share){'\n'}
          • Hive administrators for community moderation{'\n'}
          • Our team for support and safety purposes
        </Text>

        <Text style={styles.sectionTitle}>Data Security</Text>
        <Text style={styles.text}>
          We implement appropriate security measures to protect your information:{'\n'}
          • Passwords are encrypted using industry-standard hashing{'\n'}
          • Secure HTTPS connections{'\n'}
          • Regular security reviews
        </Text>
        <Text style={styles.text}>
          However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
        </Text>

        <Text style={styles.sectionTitle}>Your Rights</Text>
        <Text style={styles.text}>
          You have the right to:{'\n'}
          • Access your personal data{'\n'}
          • Correct inaccurate information{'\n'}
          • Delete your account and associated data{'\n'}
          • Export your data{'\n'}
          • Withdraw consent at any time
        </Text>
        <Text style={styles.text}>
          To exercise these rights, contact us at privacy@waypledge.me
        </Text>

        <Text style={styles.sectionTitle}>Data Retention</Text>
        <Text style={styles.text}>
          We retain your information for as long as your account is active or as needed to provide services. If you delete your account, we will delete your personal information within 30 days, except where we are required to retain it for legal purposes.
        </Text>

        <Text style={styles.sectionTitle}>Children's Privacy</Text>
        <Text style={styles.text}>
          WayPledge is not intended for children under 16. We do not knowingly collect information from children under 16. If you believe a child has provided us with personal information, please contact us.
        </Text>

        <Text style={styles.sectionTitle}>International Users</Text>
        <Text style={styles.text}>
          WayPledge operates globally. By using our service, you consent to the transfer of your information to our servers, which may be located in different countries.
        </Text>

        <Text style={styles.sectionTitle}>Changes to This Policy</Text>
        <Text style={styles.text}>
          We may update this Privacy Policy from time to time. We will notify you of significant changes through the app or via email. Continued use of WayPledge after changes constitutes acceptance of the updated policy.
        </Text>

        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.text}>
          If you have questions about this Privacy Policy or our practices, please contact us at:{'\n\n'}
          Email: privacy@waypledge.me{'\n'}
          Website: https://waypledge.me
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            WayPledge - A Gift Economy Community
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 24,
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  bold: {
    fontWeight: '700',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
