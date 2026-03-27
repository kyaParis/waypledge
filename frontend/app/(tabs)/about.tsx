import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

type SectionKey = 'philosophy' | 'howItWorks' | 'pledgesWishes' | 'hives' | 'doNoHarm';

export default function AboutScreen() {
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>('philosophy');

  const toggleSection = (section: SectionKey) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/waypledge-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>WayPledge</Text>
          <Text style={styles.subtitle}>A Gift Economy Community</Text>
        </View>

        {/* SECTION 1: THE PHILOSOPHY */}
        <TouchableOpacity 
          style={styles.sectionHeader} 
          onPress={() => toggleSection('philosophy')}
        >
          <View style={styles.sectionHeaderLeft}>
            <MaterialIcons name="auto-awesome" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>The Philosophy</Text>
          </View>
          <MaterialIcons 
            name={expandedSection === 'philosophy' ? "expand-less" : "expand-more"} 
            size={24} 
            color={Colors.textSecondary} 
          />
        </TouchableOpacity>
        {expandedSection === 'philosophy' && (
          <View style={styles.sectionContent}>
            <View style={styles.heroQuoteBox}>
              <Text style={styles.heroQuote}>
                Give Freely. Receive Gratefully.
              </Text>
              <Text style={styles.heroQuoteSub}>
                Trust Flows in Circles.
              </Text>
            </View>

            <Text style={styles.introText}>
              WayPledge is the flagship of The Way - a place where wishes and pledges move in trust.
            </Text>

            <View style={styles.principleBox}>
              <MaterialIcons name="money-off" size={32} color={Colors.error} />
              <View style={styles.principleText}>
                <Text style={styles.principleTitle}>No Money. No Fees. No Selling.</Text>
                <Text style={styles.principleDesc}>
                  This is not a marketplace. Everything is given freely from the heart.
                </Text>
              </View>
            </View>

            <View style={styles.principleBox}>
              <MaterialIcons name="favorite" size={32} color={Colors.accent} />
              <View style={styles.principleText}>
                <Text style={styles.principleTitle}>Pure Generosity</Text>
                <Text style={styles.principleDesc}>
                  You give because you can. You receive because you need. No hidden expectations or strings attached.
                </Text>
              </View>
            </View>

            <View style={styles.principleBox}>
              <MaterialIcons name="all-inclusive" size={32} color={Colors.primary} />
              <View style={styles.principleText}>
                <Text style={styles.principleTitle}>The Circle of Trust</Text>
                <Text style={styles.principleDesc}>
                  What goes around comes around. Communities become self-supporting through simple acts of kindness.
                </Text>
              </View>
            </View>

            <Text style={styles.text}>
              Each act makes the next easier, safer, and clearer. Over time, giving and receiving move in unity.
            </Text>
          </View>
        )}

        {/* SECTION 2: HOW IT WORKS */}
        <TouchableOpacity 
          style={styles.sectionHeader} 
          onPress={() => toggleSection('howItWorks')}
        >
          <View style={styles.sectionHeaderLeft}>
            <MaterialIcons name="play-circle-outline" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>How It Works</Text>
          </View>
          <MaterialIcons 
            name={expandedSection === 'howItWorks' ? "expand-less" : "expand-more"} 
            size={24} 
            color={Colors.textSecondary} 
          />
        </TouchableOpacity>
        {expandedSection === 'howItWorks' && (
          <View style={styles.sectionContent}>
            <View style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: Colors.pledgeLight }]}>
                <MaterialIcons name="card-giftcard" size={28} color={Colors.pledgeDark} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>1. Offer What You Can Give</Text>
                <Text style={styles.stepText}>
                  Create a "Pledge" - share your skills, time, items, or services freely with the community. Add your location to help local members find you.
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: Colors.wishLight }]}>
                <MaterialIcons name="star" size={28} color={Colors.wishDark} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>2. Ask When You Need</Text>
                <Text style={styles.stepText}>
                  Create a "Wish" - share what you need without shame or judgment. The community is here to help. Add location to connect with nearby supporters.
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: Colors.primary + '20' }]}>
                <MaterialIcons name="search" size={28} color={Colors.primary} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>3. Browse & Search</Text>
                <Text style={styles.stepText}>
                  Find pledges and wishes by category, keywords, or location. Filter by your community, city, region, or country.
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: Colors.accent + '20' }]}>
                <MaterialIcons name="chat" size={28} color={Colors.accent} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>4. Connect & Coordinate</Text>
                <Text style={styles.stepText}>
                  Click "Connect" on any pledge or wish to start a private conversation. Chat to coordinate the details of giving and receiving.
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: Colors.success + '20' }]}>
                <MaterialIcons name="favorite" size={28} color={Colors.success} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>5. Express Gratitude</Text>
                <Text style={styles.stepText}>
                  Thank those who help on the public Gratitude Wall. This builds trust and inspires others to participate.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* SECTION 3: PLEDGES & WISHES EXPLAINED */}
        <TouchableOpacity 
          style={styles.sectionHeader} 
          onPress={() => toggleSection('pledgesWishes')}
        >
          <View style={styles.sectionHeaderLeft}>
            <MaterialIcons name="card-giftcard" size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Pledges & Wishes Explained</Text>
          </View>
          <MaterialIcons 
            name={expandedSection === 'pledgesWishes' ? "expand-less" : "expand-more"} 
            size={24} 
            color={Colors.textSecondary} 
          />
        </TouchableOpacity>
        {expandedSection === 'pledgesWishes' && (
          <View style={styles.sectionContent}>
            <View style={[styles.exampleBox, { borderLeftColor: Colors.pledgeDark }]}>
              <View style={styles.exampleHeader}>
                <MaterialIcons name="card-giftcard" size={24} color={Colors.pledgeDark} />
                <Text style={[styles.exampleTitle, { color: Colors.pledgeDark }]}>
                  Pledges (What You Can Offer)
                </Text>
              </View>
              <Text style={styles.exampleItem}>• "I can teach Spanish - 1 hour per week"</Text>
              <Text style={styles.exampleItem}>• "Free haircuts at my home salon"</Text>
              <Text style={styles.exampleItem}>• "Will help with garden work"</Text>
              <Text style={styles.exampleItem}>• "Giving away children's books"</Text>
              <Text style={styles.exampleItem}>• "Can drive elderly to appointments"</Text>
              <Text style={styles.exampleItem}>• "Offering home-cooked meals"</Text>
              <Text style={styles.exampleItem}>• "Tech support for seniors"</Text>
              <Text style={styles.exampleItem}>• "Free photography for community events"</Text>
            </View>

            <View style={[styles.exampleBox, { borderLeftColor: Colors.wishDark }]}>
              <View style={styles.exampleHeader}>
                <MaterialIcons name="star" size={24} color={Colors.wishDark} />
                <Text style={[styles.exampleTitle, { color: Colors.wishDark }]}>
                  Wishes (What You Need)
                </Text>
              </View>
              <Text style={styles.exampleItem}>• "Need help moving furniture"</Text>
              <Text style={styles.exampleItem}>• "Looking for a winter coat, size M"</Text>
              <Text style={styles.exampleItem}>• "Would love guitar lessons"</Text>
              <Text style={styles.exampleItem}>• "Need a lift to hospital Tuesday"</Text>
              <Text style={styles.exampleItem}>• "Seeking someone to chat with"</Text>
              <Text style={styles.exampleItem}>• "Help needed fixing a leaky tap"</Text>
              <Text style={styles.exampleItem}>• "Looking for a bicycle for my son"</Text>
              <Text style={styles.exampleItem}>• "Need help understanding tax forms"</Text>
            </View>

            <View style={styles.noticeBox}>
              <MaterialIcons name="info" size={24} color={Colors.primary} />
              <Text style={styles.noticeText}>
                Remember: No money changes hands. Everything is given freely from the heart. A pledge doesn't require a wish in return, and a wish doesn't require giving something back.
              </Text>
            </View>
          </View>
        )}

        {/* SECTION 4: THE HIVE NETWORK */}
        <TouchableOpacity 
          style={styles.sectionHeader} 
          onPress={() => toggleSection('hives')}
        >
          <View style={styles.sectionHeaderLeft}>
            <MaterialIcons name="hexagon" size={24} color={Colors.accent} />
            <Text style={styles.sectionTitle}>The Hive Network</Text>
          </View>
          <MaterialIcons 
            name={expandedSection === 'hives' ? "expand-less" : "expand-more"} 
            size={24} 
            color={Colors.textSecondary} 
          />
        </TouchableOpacity>
        {expandedSection === 'hives' && (
          <View style={styles.sectionContent}>
            <Text style={styles.text}>
              WayPledge is organized like a honeycomb - many connected communities (Hives) working together in harmony.
            </Text>

            <View style={styles.hiveStructure}>
              <View style={styles.hiveLevel}>
                <View style={[styles.hiveLevelIcon, { backgroundColor: Colors.primary + '20' }]}>
                  <MaterialIcons name="public" size={28} color={Colors.primary} />
                </View>
                <View style={styles.hiveLevelText}>
                  <Text style={styles.hiveLevelTitle}>Country Hives</Text>
                  <Text style={styles.hiveLevelDesc}>
                    National communities like "WayPledge Spain", "WayPledge UK"
                  </Text>
                </View>
              </View>

              <View style={styles.hiveArrow}>
                <MaterialIcons name="arrow-downward" size={24} color={Colors.textSecondary} />
                <Text style={styles.hiveArrowText}>contains</Text>
              </View>

              <View style={styles.hiveLevel}>
                <View style={[styles.hiveLevelIcon, { backgroundColor: Colors.accent + '20' }]}>
                  <MaterialIcons name="location-city" size={28} color={Colors.accent} />
                </View>
                <View style={styles.hiveLevelText}>
                  <Text style={styles.hiveLevelTitle}>Local Hives</Text>
                  <Text style={styles.hiveLevelDesc}>
                    Your neighborhood: "Altaona", "Brighton", "Murcia Centro"
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.hiveFeatures}>
              <View style={styles.hiveFeature}>
                <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                <Text style={styles.hiveFeatureText}>
                  Join your local Hive to connect with people nearby
                </Text>
              </View>
              <View style={styles.hiveFeature}>
                <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                <Text style={styles.hiveFeatureText}>
                  Tag pledges and wishes to your Hive for local discovery
                </Text>
              </View>
              <View style={styles.hiveFeature}>
                <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                <Text style={styles.hiveFeatureText}>
                  Create a new Hive if your community doesn't exist yet
                </Text>
              </View>
            </View>

            <View style={styles.noticeBox}>
              <MaterialIcons name="hub" size={24} color={Colors.accent} />
              <Text style={styles.noticeText}>
                Hives can also federate with other gift economy platforms, creating a global network of mutual support communities.
              </Text>
            </View>
          </View>
        )}

        {/* SECTION 5: DO NO HARM PLEDGE */}
        <TouchableOpacity 
          style={[styles.sectionHeader, styles.doNoHarmHeader]} 
          onPress={() => toggleSection('doNoHarm')}
        >
          <View style={styles.sectionHeaderLeft}>
            <MaterialIcons name="shield" size={24} color={Colors.error} />
            <Text style={[styles.sectionTitle, { color: Colors.error }]}>Do No Harm Pledge</Text>
          </View>
          <MaterialIcons 
            name={expandedSection === 'doNoHarm' ? "expand-less" : "expand-more"} 
            size={24} 
            color={Colors.textSecondary} 
          />
        </TouchableOpacity>
        {expandedSection === 'doNoHarm' && (
          <View style={[styles.sectionContent, styles.doNoHarmContent]}>
            <Text style={styles.doNoHarmIntro}>
              Every member of WayPledge commits to these sacred principles:
            </Text>

            <View style={styles.pledgeItem}>
              <MaterialIcons name="check-circle" size={24} color={Colors.success} />
              <View style={styles.pledgeTextContainer}>
                <Text style={styles.pledgeBold}>Act with Integrity</Text>
                <Text style={styles.pledgeDesc}>Be honest and transparent in all interactions. Say what you mean and do what you say.</Text>
              </View>
            </View>

            <View style={styles.pledgeItem}>
              <MaterialIcons name="check-circle" size={24} color={Colors.success} />
              <View style={styles.pledgeTextContainer}>
                <Text style={styles.pledgeBold}>Respect Boundaries</Text>
                <Text style={styles.pledgeDesc}>Honor others' time, space, and personal limits. Accept "no" gracefully.</Text>
              </View>
            </View>

            <View style={styles.pledgeItem}>
              <MaterialIcons name="check-circle" size={24} color={Colors.success} />
              <View style={styles.pledgeTextContainer}>
                <Text style={styles.pledgeBold}>Give Freely</Text>
                <Text style={styles.pledgeDesc}>No hidden expectations or strings attached. A gift is a gift, with no obligation returned.</Text>
              </View>
            </View>

            <View style={styles.pledgeItem}>
              <MaterialIcons name="check-circle" size={24} color={Colors.success} />
              <View style={styles.pledgeTextContainer}>
                <Text style={styles.pledgeBold}>Protect Vulnerability</Text>
                <Text style={styles.pledgeDesc}>Never exploit someone's need. Those who ask for help are trusting the community.</Text>
              </View>
            </View>

            <View style={styles.pledgeItem}>
              <MaterialIcons name="check-circle" size={24} color={Colors.success} />
              <View style={styles.pledgeTextContainer}>
                <Text style={styles.pledgeBold}>Build Trust</Text>
                <Text style={styles.pledgeDesc}>Follow through on commitments. Communicate if circumstances change.</Text>
              </View>
            </View>

            <View style={styles.pledgeItem}>
              <MaterialIcons name="check-circle" size={24} color={Colors.success} />
              <View style={styles.pledgeTextContainer}>
                <Text style={styles.pledgeBold}>Seek Resolution</Text>
                <Text style={styles.pledgeDesc}>Address concerns through our Mediation Centre. Conflict is resolved with compassion.</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.fullPledgeButton}
              onPress={() => router.push('/terms')}
            >
              <Text style={styles.fullPledgeText}>Read Full Pledge</Text>
              <MaterialIcons name="arrow-forward" size={20} color={Colors.primary} />
            </TouchableOpacity>

            <Text style={styles.doNoHarmFooter}>
              By using WayPledge, you agree to uphold these values and help create a safe, trusting community for all.
            </Text>
          </View>
        )}

        {/* TAGLINE */}
        <View style={styles.taglineContainer}>
          <MaterialIcons name="favorite" size={36} color={Colors.accent} />
          <Text style={styles.tagline}>Every Pledge Lights the Way</Text>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionContent: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    marginTop: -4,
  },
  doNoHarmHeader: {
    borderWidth: 2,
    borderColor: Colors.error + '30',
  },
  doNoHarmContent: {
    backgroundColor: Colors.error + '05',
    borderWidth: 1,
    borderColor: Colors.error + '20',
  },
  introText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 23,
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  text: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 23,
    marginBottom: 16,
  },
  principleBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  principleText: {
    flex: 1,
  },
  principleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  principleDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  heroQuoteBox: {
    backgroundColor: Colors.primary,
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  heroQuote: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.surface,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  heroQuoteSub: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.surface,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  stepIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  stepContent: {
    flex: 1,
    paddingTop: 2,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  stepText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
  exampleBox: {
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 5,
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  exampleItem: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 26,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.primary + '10',
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary,
    lineHeight: 21,
    fontWeight: '500',
  },
  hiveStructure: {
    marginVertical: 16,
  },
  hiveLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.background,
    padding: 14,
    borderRadius: 12,
  },
  hiveLevelIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiveLevelText: {
    flex: 1,
  },
  hiveLevelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  hiveLevelDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 19,
  },
  hiveArrow: {
    alignItems: 'center',
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  hiveArrowText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  hiveFeatures: {
    marginTop: 8,
    marginBottom: 16,
  },
  hiveFeature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  hiveFeatureText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
  },
  doNoHarmIntro: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  pledgeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 18,
  },
  pledgeTextContainer: {
    flex: 1,
  },
  pledgeBold: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  pledgeDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  fullPledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  fullPledgeText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
  },
  doNoHarmFooter: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 19,
  },
  taglineContainer: {
    alignItems: 'center',
    backgroundColor: Colors.accent + '15',
    padding: 24,
    borderRadius: 16,
    marginTop: 8,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.accent,
    marginTop: 12,
    textAlign: 'center',
  },
});
