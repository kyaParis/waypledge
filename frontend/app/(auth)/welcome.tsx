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
            A space where you experience your own value directly—not measured through money or exchange.
          </Text>
          <Text style={styles.subMessage}>
            Here, giving and receiving move naturally. What you have is already enough, and it's already in motion.
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
              <Text style={styles.featureText}>Offer your skills, time, or resources—when you can, simply give</Text>
            </View>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <MaterialIcons name="auto-awesome" size={28} color={Colors.wishMedium} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Make a Wish</Text>
              <Text style={styles.featureText}>When you need help, simply ask—someone nearby may be ready</Text>
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

        {/* The Vision */}
        <View style={styles.visionSection}>
          <Text style={styles.visionText}>
            WayPledge is for people who feel there's another way of living and connecting—even if they can't fully explain it yet.
          </Text>
          <Text style={styles.visionHighlight}>
            People ready to participate, not just consume.
          </Text>
        </View>

        {/* What You'll Experience */}
        <View style={styles.experienceSection}>
          <Text style={styles.sectionTitle}>What You'll Experience</Text>
          
          <View style={styles.experienceItem}>
            <MaterialIcons name="spa" size={20} color={Colors.success} />
            <Text style={styles.experienceText}>A natural ease in giving and asking</Text>
          </View>
          
          <View style={styles.experienceItem}>
            <MaterialIcons name="favorite" size={20} color={Colors.error} />
            <Text style={styles.experienceText}>Feel your own value, without needing approval</Text>
          </View>
          
          <View style={styles.experienceItem}>
            <MaterialIcons name="people" size={20} color={Colors.primary} />
            <Text style={styles.experienceText}>Connection becomes simple</Text>
          </View>
          
          <View style={styles.experienceItem}>
            <MaterialIcons name="handshake" size={20} color={Colors.accent} />
            <Text style={styles.experienceText}>Support without pressure or expectation</Text>
          </View>
        </View>

        {/* Our Promise */}
        <View style={styles.promiseSection}>
          <View style={styles.promiseHeader}>
            <MaterialIcons name="shield" size={22} color={Colors.primary} />
            <Text style={styles.promiseTitle}>Our Promise</Text>
          </View>
          <Text style={styles.promiseText}>
            <Text style={styles.bold}>"Do No Harm"</Text> — Every member pledges to treat others with kindness and respect. As this shifts how we relate, something more honest and supportive emerges.
          </Text>
        </View>

        {/* Values Tags */}
        <View style={styles.valuesSection}>
          <View style={styles.valueItem}>
            <MaterialIcons name="money-off" size={18} color={Colors.success} />
            <Text style={styles.valueText}>No money exchanged</Text>
          </View>
          <View style={styles.valueItem}>
            <MaterialIcons name="loop" size={18} color={Colors.success} />
            <Text style={styles.valueText}>Give and receive naturally</Text>
          </View>
          <View style={styles.valueItem}>
            <MaterialIcons name="groups" size={18} color={Colors.success} />
            <Text style={styles.valueText}>Community over transaction</Text>
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
    paddingBottom: 16,
  },
  logo: {
    width: 85,
    height: 85,
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  messageSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mainMessage: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 12,
  },
  subMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  howItWorksSection: {
    paddingVertical: 22,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  featureText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  visionSection: {
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  visionText: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 21,
    fontStyle: 'italic',
  },
  visionHighlight: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 10,
  },
  experienceSection: {
    marginBottom: 20,
  },
  experienceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  experienceText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  promiseSection: {
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: 14,
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  promiseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  promiseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  promiseText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '700',
    color: Colors.primary,
  },
  valuesSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 18,
    gap: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  valueText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    paddingVertical: 13,
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
    paddingTop: 4,
  },
  footerQuote: {
    fontSize: 13,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
