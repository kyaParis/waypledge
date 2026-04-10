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

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.lastUpdated}>Last Updated: March 30, 2026</Text>

        <Text style={styles.sectionTitle}>Welcome to WayPledge</Text>
        <Text style={styles.text}>
          WayPledge is a gift economy platform that enables people to freely offer and receive goods, services, and support without monetary exchange. By using WayPledge, you agree to these Terms of Service and our community principles.
        </Text>

        <View style={styles.highlightBox}>
          <MaterialIcons name="favorite" size={24} color={Colors.accent} />
          <Text style={styles.highlightText}>
            "Give Freely. Receive Gratefully. Trust Flows in Circles."
          </Text>
        </View>

        <Text style={styles.sectionTitle}>1. The Do No Harm Pledge</Text>
        <Text style={styles.text}>
          By using WayPledge, you commit to our core principles:
        </Text>
        <View style={styles.pledgeList}>
          <View style={styles.pledgeItem}>
            <MaterialIcons name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.pledgeText}><Text style={styles.bold}>Act with Integrity</Text> - Be honest and transparent in all interactions</Text>
          </View>
          <View style={styles.pledgeItem}>
            <MaterialIcons name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.pledgeText}><Text style={styles.bold}>Respect Boundaries</Text> - Honor others' time, space, and limits</Text>
          </View>
          <View style={styles.pledgeItem}>
            <MaterialIcons name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.pledgeText}><Text style={styles.bold}>Give Freely</Text> - No hidden expectations or strings attached</Text>
          </View>
          <View style={styles.pledgeItem}>
            <MaterialIcons name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.pledgeText}><Text style={styles.bold}>Protect Vulnerability</Text> - Never exploit someone's need</Text>
          </View>
          <View style={styles.pledgeItem}>
            <MaterialIcons name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.pledgeText}><Text style={styles.bold}>Build Trust</Text> - Follow through on commitments</Text>
          </View>
          <View style={styles.pledgeItem}>
            <MaterialIcons name="check-circle" size={20} color={Colors.success} />
            <Text style={styles.pledgeText}><Text style={styles.bold}>Seek Resolution</Text> - Address concerns through our Mediation Centre</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>2. What WayPledge Is (And Isn't)</Text>
        <Text style={styles.subTitle}>WayPledge IS:</Text>
        <Text style={styles.text}>
          • A platform for freely giving and receiving{'\n'}
          • A community based on trust and generosity{'\n'}
          • A space to share skills, items, time, and support{'\n'}
          • A network of connected local communities (Hives)
        </Text>
        
        <Text style={styles.subTitle}>WayPledge is NOT:</Text>
        <Text style={styles.text}>
          • A marketplace - no money changes hands{'\n'}
          • A barter system - gifts have no obligation for return{'\n'}
          • A dating or social networking service{'\n'}
          • A platform for commercial transactions
        </Text>

        <Text style={styles.sectionTitle}>3. Account Responsibilities</Text>
        <Text style={styles.text}>
          <Text style={styles.bold}>You are responsible for:</Text>{'\n'}
          • Maintaining the security of your account{'\n'}
          • All activity that occurs under your account{'\n'}
          • Providing accurate information{'\n'}
          • Keeping your contact information current{'\n\n'}
          <Text style={styles.bold}>You must be at least 16 years old</Text> to use WayPledge.
        </Text>

        <Text style={styles.sectionTitle}>4. Acceptable Use</Text>
        <Text style={styles.text}>
          <Text style={styles.bold}>You agree NOT to:</Text>{'\n'}
          • Post illegal content or promote illegal activities{'\n'}
          • Harass, threaten, or harm other users{'\n'}
          • Post false or misleading information{'\n'}
          • Attempt to sell goods or services for money{'\n'}
          • Spam or post repetitive content{'\n'}
          • Impersonate others or misrepresent yourself{'\n'}
          • Collect user data without consent{'\n'}
          • Attempt to circumvent security measures{'\n'}
          • Use the platform for commercial advertising
        </Text>

        <Text style={styles.sectionTitle}>5. Content Guidelines</Text>
        <Text style={styles.text}>
          <Text style={styles.bold}>Pledges and Wishes must be:</Text>{'\n'}
          • Genuine offers or requests{'\n'}
          • Free of monetary conditions{'\n'}
          • Legal in your jurisdiction{'\n'}
          • Respectful and appropriate{'\n\n'}
          <Text style={styles.bold}>Prohibited content includes:</Text>{'\n'}
          • Anything requiring payment{'\n'}
          • Illegal items or services{'\n'}
          • Weapons or dangerous materials{'\n'}
          • Adult content{'\n'}
          • Discriminatory content{'\n'}
          • Personal attacks or harassment
        </Text>

        <View style={styles.warningBox}>
          <MaterialIcons name="warning" size={24} color={Colors.warning} />
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningTitle}>Age-Restricted Items Prohibited</Text>
            <Text style={styles.warningText}>
              The following items may NOT be pledged or requested:{'\n'}
              • Alcohol or tobacco products{'\n'}
              • Cannabis or controlled substances{'\n'}
              • Weapons, ammunition, or explosives{'\n'}
              • Adult/explicit content or services{'\n'}
              • Gambling services or equipment
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>6. Safety & Meetings</Text>
        <Text style={styles.text}>
          When meeting other WayPledge members:{'\n'}
          • Meet in public places when possible{'\n'}
          • Tell someone where you're going{'\n'}
          • Trust your instincts{'\n'}
          • Report any concerning behavior{'\n\n'}
          <Text style={styles.bold}>WayPledge is not responsible for interactions between users.</Text> We provide tools to connect; you are responsible for your own safety.
        </Text>

        <Text style={styles.sectionTitle}>7. Hive Communities</Text>
        <Text style={styles.text}>
          Hives are local communities within WayPledge. Each Hive may have additional guidelines set by its administrators. Hive admins can:{'\n'}
          • Moderate content within their Hive{'\n'}
          • Remove members who violate community standards{'\n'}
          • Set local guidelines (within WayPledge's overall terms)
        </Text>

        <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
        <Text style={styles.text}>
          • You retain ownership of content you create{'\n'}
          • By posting, you grant WayPledge a license to display your content on the platform{'\n'}
          • The WayPledge name, logo, and platform are our property{'\n'}
          • Don't use our branding without permission
        </Text>

        <Text style={styles.sectionTitle}>9. Disclaimers</Text>
        <Text style={styles.text}>
          WayPledge is provided "as is" without warranties. We do not guarantee:{'\n'}
          • The quality of gifts exchanged{'\n'}
          • The reliability of other users{'\n'}
          • Uninterrupted service{'\n'}
          • That all content is accurate or legal{'\n\n'}
          <Text style={styles.bold}>Use WayPledge at your own risk.</Text> We facilitate connections but are not responsible for what happens between users.
        </Text>

        <Text style={styles.sectionTitle}>10. Limitation of Liability</Text>
        <Text style={styles.text}>
          To the maximum extent permitted by law, WayPledge shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform.
        </Text>

        <Text style={styles.sectionTitle}>11. Termination</Text>
        <Text style={styles.text}>
          We may suspend or terminate your account if you:{'\n'}
          • Violate these terms{'\n'}
          • Violate the Do No Harm pledge{'\n'}
          • Engage in harmful behavior{'\n'}
          • Are reported by multiple users{'\n\n'}
          You may delete your account at any time through the app settings.
        </Text>

        <Text style={styles.sectionTitle}>12. Changes to Terms</Text>
        <Text style={styles.text}>
          We may update these terms from time to time. Continued use of WayPledge after changes constitutes acceptance of the new terms. We will notify you of significant changes.
        </Text>

        <Text style={styles.sectionTitle}>13. Governing Law</Text>
        <Text style={styles.text}>
          These terms are governed by the laws of Spain. Any disputes shall be resolved in the courts of Murcia, Spain.
        </Text>

        <Text style={styles.sectionTitle}>14. Contact</Text>
        <Text style={styles.text}>
          Questions about these Terms?{'\n\n'}
          Email: legal@waypledge.me{'\n'}
          Website: https://waypledge.me
        </Text>

        <View style={styles.acceptBox}>
          <MaterialIcons name="handshake" size={32} color={Colors.primary} />
          <Text style={styles.acceptText}>
            By using WayPledge, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            WayPledge - Give and Receive With Love
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
    marginTop: 12,
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
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.accent + '15',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  highlightText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accent,
    fontStyle: 'italic',
  },
  pledgeList: {
    marginTop: 8,
  },
  pledgeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  pledgeText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  acceptBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginTop: 32,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  acceptText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary,
    lineHeight: 22,
    fontWeight: '500',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFB300',
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#5D4037',
    lineHeight: 22,
  },
});
