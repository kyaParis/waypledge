import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Do No Harm Pledge</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.introSection}>
          <MaterialIcons name="favorite" size={48} color={Colors.primary} />
          <Text style={styles.introTitle}>We Create This Together</Text>
          <Text style={styles.introText}>
            WayPledge is not a company. It's a movement of hearts choosing to give and receive in trust. 
            By joining, you become a co-creator of a world beyond transaction.
          </Text>
        </View>

        <View style={styles.pledgeSection}>
          <Text style={styles.sectionTitle}>Your Do No Harm Pledge</Text>
          <Text style={styles.pledgeIntro}>
            By using WayPledge, you make these commitments from the heart:
          </Text>

          <View style={styles.pledgeItem}>
            <View style={styles.pledgeIcon}>
              <MaterialIcons name="volunteer-activism" size={24} color={Colors.pledgeDark} />
            </View>
            <View style={styles.pledgeContent}>
              <Text style={styles.pledgeTitle}>I Give Freely</Text>
              <Text style={styles.pledgeText}>
                When I offer a pledge, it comes from genuine desire to help - not for personal gain, 
                recognition, or hidden expectation of return.
              </Text>
            </View>
          </View>

          <View style={styles.pledgeItem}>
            <View style={styles.pledgeIcon}>
              <MaterialIcons name="handshake" size={24} color={Colors.wishDark} />
            </View>
            <View style={styles.pledgeContent}>
              <Text style={styles.pledgeTitle}>I Ask With Honesty</Text>
              <Text style={styles.pledgeText}>
                When I share a wish, it reflects a genuine need. I trust that support will come 
                when it's meant to, without manipulation or false urgency.
              </Text>
            </View>
          </View>

          <View style={styles.pledgeItem}>
            <View style={styles.pledgeIcon}>
              <MaterialIcons name="shield" size={24} color={Colors.primary} />
            </View>
            <View style={styles.pledgeContent}>
              <Text style={styles.pledgeTitle}>I Protect This Space</Text>
              <Text style={styles.pledgeText}>
                I will not use WayPledge for selling, marketing, scams, or any form of exploitation. 
                This is sacred ground for genuine human connection.
              </Text>
            </View>
          </View>

          <View style={styles.pledgeItem}>
            <View style={styles.pledgeIcon}>
              <MaterialIcons name="groups" size={24} color={Colors.accent} />
            </View>
            <View style={styles.pledgeContent}>
              <Text style={styles.pledgeTitle}>I Respect All</Text>
              <Text style={styles.pledgeText}>
                Every person here deserves dignity. I will communicate with kindness, honor 
                commitments I make, and assume good faith in others.
              </Text>
            </View>
          </View>

          <View style={styles.pledgeItem}>
            <View style={styles.pledgeIcon}>
              <MaterialIcons name="eco" size={24} color={Colors.success} />
            </View>
            <View style={styles.pledgeContent}>
              <Text style={styles.pledgeTitle}>I Trust the Circle</Text>
              <Text style={styles.pledgeText}>
                I understand that giving and receiving flow in cycles. I don't keep score. 
                When I give, the universe balances itself in time.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.understandingSection}>
          <Text style={styles.sectionTitle}>Shared Understanding</Text>
          
          <View style={styles.understandingItem}>
            <MaterialIcons name="info" size={20} color={Colors.primary} />
            <Text style={styles.understandingText}>
              <Text style={styles.bold}>Voluntary Participation: </Text>
              Using WayPledge is entirely voluntary. You are responsible for your own choices 
              and interactions. No one is obligated to give or receive.
            </Text>
          </View>

          <View style={styles.understandingItem}>
            <MaterialIcons name="info" size={20} color={Colors.primary} />
            <Text style={styles.understandingText}>
              <Text style={styles.bold}>No Liability: </Text>
              WayPledge is a platform for connection, not a guarantor of outcomes. We cannot be 
              held responsible for the actions of community members or results of connections made here.
            </Text>
          </View>

          <View style={styles.understandingItem}>
            <MaterialIcons name="info" size={20} color={Colors.primary} />
            <Text style={styles.understandingText}>
              <Text style={styles.bold}>Community Self-Governance: </Text>
              We rely on each other to maintain trust. If someone violates the Do No Harm Pledge, 
              please report it so we can gently guide them or, if necessary, remove them from the space.
            </Text>
          </View>

          <View style={styles.understandingItem}>
            <MaterialIcons name="info" size={20} color={Colors.primary} />
            <Text style={styles.understandingText}>
              <Text style={styles.bold}>Personal Judgment: </Text>
              Use your wisdom when connecting with others. Start small, build trust gradually, 
              and always prioritize your safety and wellbeing.
            </Text>
          </View>
        </View>

        <View style={styles.closingSection}>
          <Text style={styles.closingTitle}>Those Who Break The Pledge</Text>
          <Text style={styles.closingText}>
            If someone uses WayPledge for personal gain, exploitation, or harm, they will be 
            lovingly but firmly removed from our community. This isn't punishment - it's 
            protection of the sacred space we're building together.
          </Text>
          <Text style={styles.closingText}>
            We trust that everyone here wants the same thing: a world where giving and receiving 
            move freely, where asking for help carries no shame, and where abundance is shared.
          </Text>
        </View>

        <View style={styles.finalSection}>
          <MaterialIcons name="auto-awesome" size={32} color={Colors.accent} />
          <Text style={styles.finalText}>
            Together, we are building something beautiful.
          </Text>
          <Text style={styles.finalSubtext}>
            Every pledge lights the way.
          </Text>
        </View>

        <View style={{ height: 40 }} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  introSection: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  introText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    textAlign: 'center',
  },
  pledgeSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  pledgeIntro: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  pledgeItem: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  pledgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pledgeContent: {
    flex: 1,
  },
  pledgeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  pledgeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  understandingSection: {
    marginBottom: 32,
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
  },
  understandingItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  understandingText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginLeft: 12,
  },
  bold: {
    fontWeight: '600',
    color: Colors.text,
  },
  closingSection: {
    marginBottom: 32,
  },
  closingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  closingText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 12,
  },
  finalSection: {
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  finalText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 12,
    textAlign: 'center',
  },
  finalSubtext: {
    fontSize: 16,
    color: Colors.accent,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
