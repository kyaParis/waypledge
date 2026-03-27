import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface WelcomeModalProps {
  visible: boolean;
  onClose: () => void;
}

type SectionKey = 'philosophy' | 'howItWorks' | 'pledgesWishes' | 'hives' | 'doNoHarm';

export default function WelcomeModal({ visible, onClose }: WelcomeModalProps) {
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>('philosophy');

  const toggleSection = (section: SectionKey) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleCreatePledge = () => {
    onClose();
    router.push('/(tabs)/create');
  };

  const handleBrowse = () => {
    onClose();
    router.push('/(tabs)/browse');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Close button at top */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={28} color={Colors.text} />
          </TouchableOpacity>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <MaterialIcons name="favorite" size={48} color={Colors.accent} />
              <Text style={styles.title}>Welcome to WayPledge!</Text>
              <Text style={styles.subtitle}>A Gift Economy Community</Text>
            </View>

            {/* SECTION 1: THE PHILOSOPHY */}
            <TouchableOpacity 
              style={styles.sectionHeader} 
              onPress={() => toggleSection('philosophy')}
              activeOpacity={0.7}
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

                <View style={styles.principleBox}>
                  <MaterialIcons name="money-off" size={28} color={Colors.error} />
                  <View style={styles.principleText}>
                    <Text style={styles.principleTitle}>No Money. No Fees. No Selling.</Text>
                    <Text style={styles.principleDesc}>
                      This is not a marketplace. Everything is given freely from the heart.
                    </Text>
                  </View>
                </View>

                <View style={styles.principleBox}>
                  <MaterialIcons name="favorite" size={28} color={Colors.accent} />
                  <View style={styles.principleText}>
                    <Text style={styles.principleTitle}>Pure Generosity</Text>
                    <Text style={styles.principleDesc}>
                      You give because you can. You receive because you need. No strings attached.
                    </Text>
                  </View>
                </View>

                <View style={styles.principleBox}>
                  <MaterialIcons name="all-inclusive" size={28} color={Colors.primary} />
                  <View style={styles.principleText}>
                    <Text style={styles.principleTitle}>The Circle of Trust</Text>
                    <Text style={styles.principleDesc}>
                      What goes around comes around. Communities become self-supporting through simple acts of kindness.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* SECTION 2: HOW IT WORKS */}
            <TouchableOpacity 
              style={styles.sectionHeader} 
              onPress={() => toggleSection('howItWorks')}
              activeOpacity={0.7}
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
                  <View style={[styles.stepNumber, { backgroundColor: Colors.pledgeLight }]}>
                    <Text style={[styles.stepNumberText, { color: Colors.pledgeDark }]}>1</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Offer What You Can Give</Text>
                    <Text style={styles.stepDesc}>
                      Create a "Pledge" - share your skills, time, items, or services freely with the community.
                    </Text>
                  </View>
                </View>

                <View style={styles.step}>
                  <View style={[styles.stepNumber, { backgroundColor: Colors.wishLight }]}>
                    <Text style={[styles.stepNumberText, { color: Colors.wishDark }]}>2</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Ask When You Need</Text>
                    <Text style={styles.stepDesc}>
                      Create a "Wish" - share what you need without shame. The community is here to help.
                    </Text>
                  </View>
                </View>

                <View style={styles.step}>
                  <View style={[styles.stepNumber, { backgroundColor: Colors.primary + '20' }]}>
                    <Text style={[styles.stepNumberText, { color: Colors.primary }]}>3</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Connect & Coordinate</Text>
                    <Text style={styles.stepDesc}>
                      Browse pledges and wishes. Click "Connect" to start a conversation and arrange the exchange.
                    </Text>
                  </View>
                </View>

                <View style={styles.step}>
                  <View style={[styles.stepNumber, { backgroundColor: Colors.success + '20' }]}>
                    <Text style={[styles.stepNumberText, { color: Colors.success }]}>4</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Express Gratitude</Text>
                    <Text style={styles.stepDesc}>
                      Thank those who help on the Gratitude Wall. This builds trust and inspires others.
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* SECTION 3: PLEDGES & WISHES */}
            <TouchableOpacity 
              style={styles.sectionHeader} 
              onPress={() => toggleSection('pledgesWishes')}
              activeOpacity={0.7}
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
                  <Text style={[styles.exampleTitle, { color: Colors.pledgeDark }]}>
                    Pledges (What You Can Offer)
                  </Text>
                  <Text style={styles.exampleItem}>• "I can teach Spanish - 1 hour per week"</Text>
                  <Text style={styles.exampleItem}>• "Free haircuts at my home salon"</Text>
                  <Text style={styles.exampleItem}>• "Will help with garden work"</Text>
                  <Text style={styles.exampleItem}>• "Giving away children's books"</Text>
                  <Text style={styles.exampleItem}>• "Can drive elderly to appointments"</Text>
                  <Text style={styles.exampleItem}>• "Offering home-cooked meals"</Text>
                </View>

                <View style={[styles.exampleBox, { borderLeftColor: Colors.wishDark }]}>
                  <Text style={[styles.exampleTitle, { color: Colors.wishDark }]}>
                    Wishes (What You Need)
                  </Text>
                  <Text style={styles.exampleItem}>• "Need help moving furniture"</Text>
                  <Text style={styles.exampleItem}>• "Looking for a winter coat, size M"</Text>
                  <Text style={styles.exampleItem}>• "Would love guitar lessons"</Text>
                  <Text style={styles.exampleItem}>• "Need a lift to hospital Tuesday"</Text>
                  <Text style={styles.exampleItem}>• "Seeking someone to chat with"</Text>
                  <Text style={styles.exampleItem}>• "Help needed fixing a leaky tap"</Text>
                </View>

                <View style={styles.noticeBox}>
                  <MaterialIcons name="info" size={20} color={Colors.primary} />
                  <Text style={styles.noticeText}>
                    Remember: No money changes hands. Everything is given freely from the heart.
                  </Text>
                </View>
              </View>
            )}

            {/* SECTION 4: THE HIVE NETWORK */}
            <TouchableOpacity 
              style={styles.sectionHeader} 
              onPress={() => toggleSection('hives')}
              activeOpacity={0.7}
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
                  WayPledge is organized like a honeycomb - many connected communities working together.
                </Text>

                <View style={styles.hiveLevel}>
                  <MaterialIcons name="public" size={24} color={Colors.primary} />
                  <View style={styles.hiveLevelText}>
                    <Text style={styles.hiveLevelTitle}>Country Hives</Text>
                    <Text style={styles.hiveLevelDesc}>
                      e.g., "WayPledge Spain", "WayPledge UK" - National communities
                    </Text>
                  </View>
                </View>

                <View style={styles.hiveArrow}>
                  <MaterialIcons name="arrow-downward" size={20} color={Colors.textSecondary} />
                </View>

                <View style={styles.hiveLevel}>
                  <MaterialIcons name="location-city" size={24} color={Colors.accent} />
                  <View style={styles.hiveLevelText}>
                    <Text style={styles.hiveLevelTitle}>Local Hives</Text>
                    <Text style={styles.hiveLevelDesc}>
                      e.g., "Altaona", "Brighton" - Your neighborhood community
                    </Text>
                  </View>
                </View>

                <Text style={styles.text}>
                  Join your local Hive to connect with people nearby. Pledges and wishes can be tagged to your Hive for local discovery.
                </Text>

                <View style={styles.noticeBox}>
                  <MaterialIcons name="hub" size={20} color={Colors.accent} />
                  <Text style={styles.noticeText}>
                    Can't find your community? Create a new local Hive and invite others to join!
                  </Text>
                </View>
              </View>
            )}

            {/* SECTION 5: DO NO HARM */}
            <TouchableOpacity 
              style={[styles.sectionHeader, styles.doNoHarmHeader]} 
              onPress={() => toggleSection('doNoHarm')}
              activeOpacity={0.7}
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
                  Every member commits to these principles:
                </Text>

                <View style={styles.pledgeItem}>
                  <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                  <Text style={styles.pledgeText}>
                    <Text style={styles.pledgeBold}>Act with Integrity</Text> - Be honest and transparent in all interactions
                  </Text>
                </View>

                <View style={styles.pledgeItem}>
                  <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                  <Text style={styles.pledgeText}>
                    <Text style={styles.pledgeBold}>Respect Boundaries</Text> - Honor others' time, space, and limits
                  </Text>
                </View>

                <View style={styles.pledgeItem}>
                  <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                  <Text style={styles.pledgeText}>
                    <Text style={styles.pledgeBold}>Give Freely</Text> - No hidden expectations or strings attached
                  </Text>
                </View>

                <View style={styles.pledgeItem}>
                  <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                  <Text style={styles.pledgeText}>
                    <Text style={styles.pledgeBold}>Protect Vulnerability</Text> - Never exploit someone's need
                  </Text>
                </View>

                <View style={styles.pledgeItem}>
                  <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                  <Text style={styles.pledgeText}>
                    <Text style={styles.pledgeBold}>Build Trust</Text> - Follow through on commitments
                  </Text>
                </View>

                <View style={styles.pledgeItem}>
                  <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                  <Text style={styles.pledgeText}>
                    <Text style={styles.pledgeBold}>Seek Resolution</Text> - Address concerns through our Mediation Centre
                  </Text>
                </View>

                <Text style={styles.doNoHarmFooter}>
                  By using WayPledge, you agree to uphold these values and help create a safe, trusting community.
                </Text>
              </View>
            )}

            <View style={styles.taglineBox}>
              <Text style={styles.tagline}>Every Pledge Lights the Way ✨</Text>
            </View>

            {/* Clear Action Buttons */}
            <View style={styles.actionSection}>
              <Text style={styles.actionTitle}>Ready to Begin?</Text>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: Colors.pledgeDark }]} 
                onPress={handleCreatePledge}
                activeOpacity={0.8}
              >
                <MaterialIcons name="card-giftcard" size={24} color={Colors.surface} />
                <View style={styles.actionButtonText}>
                  <Text style={styles.actionButtonTitle}>Create a Pledge</Text>
                  <Text style={styles.actionButtonDesc}>Share something you can offer</Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color={Colors.surface} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: Colors.wishDark }]} 
                onPress={handleCreatePledge}
                activeOpacity={0.8}
              >
                <MaterialIcons name="star" size={24} color={Colors.surface} />
                <View style={styles.actionButtonText}>
                  <Text style={styles.actionButtonTitle}>Make a Wish</Text>
                  <Text style={styles.actionButtonDesc}>Ask for something you need</Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color={Colors.surface} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: Colors.primary }]} 
                onPress={handleBrowse}
                activeOpacity={0.8}
              >
                <MaterialIcons name="search" size={24} color={Colors.surface} />
                <View style={styles.actionButtonText}>
                  <Text style={styles.actionButtonTitle}>Browse First</Text>
                  <Text style={styles.actionButtonDesc}>See what others are offering</Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color={Colors.surface} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.skipButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.skipButtonText}>Just exploring for now</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    width: '92%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingTop: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  heroQuoteBox: {
    backgroundColor: Colors.primary,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  heroQuote: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.surface,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  heroQuoteSub: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.surface,
    textAlign: 'center',
    marginTop: 6,
    opacity: 0.9,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionContent: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginTop: -4,
  },
  doNoHarmHeader: {
    borderWidth: 2,
    borderColor: Colors.error + '30',
  },
  doNoHarmContent: {
    backgroundColor: Colors.error + '08',
    borderWidth: 1,
    borderColor: Colors.error + '20',
  },
  text: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    marginBottom: 12,
  },
  principleBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  principleText: {
    flex: 1,
  },
  principleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  principleDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  exampleBox: {
    backgroundColor: Colors.background,
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  exampleItem: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 22,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.primary + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primary,
    lineHeight: 19,
    fontWeight: '500',
  },
  hiveLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 10,
  },
  hiveArrow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  hiveLevelText: {
    flex: 1,
  },
  hiveLevelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  hiveLevelDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  doNoHarmIntro: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  pledgeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  pledgeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  pledgeBold: {
    fontWeight: '700',
  },
  doNoHarmFooter: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  taglineBox: {
    alignItems: 'center',
    backgroundColor: Colors.accent + '15',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.accent,
  },
  actionSection: {
    marginTop: 8,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    gap: 14,
  },
  actionButtonText: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.surface,
  },
  actionButtonDesc: {
    fontSize: 13,
    color: Colors.surface,
    opacity: 0.85,
    marginTop: 2,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 8,
  },
  skipButtonText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
