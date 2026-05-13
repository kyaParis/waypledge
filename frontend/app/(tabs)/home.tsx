import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Image,
  AppState,
  Linking,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import api, { Pledge, Wish } from '../../utils/api';
import WelcomeModal from '../../components/WelcomeModal';

const OPEN_COLLECTIVE_URL = 'https://opencollective.com/waypledge';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [recentPledges, setRecentPledges] = useState<Pledge[]>([]);
  const [recentWishes, setRecentWishes] = useState<Wish[]>([]);
  const [myCommunities, setMyCommunities] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showWhatIs, setShowWhatIs] = useState(false);
  
  // Auto-refresh state
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFocusedRef = useRef(true);

  const loadData = useCallback(async () => {
    try {
      const [pledgesRes, wishesRes, communitiesRes] = await Promise.all([
        api.get('/pledges/mine'),
        api.get('/wishes/mine'),
        api.get('/hives/my/memberships'),
      ]);
      setRecentPledges(pledgesRes.data.slice(0, 3));
      setRecentWishes(wishesRes.data.slice(0, 3));
      setMyCommunities(communitiesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  // Auto-refresh every 30 seconds when screen is focused
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      loadData();
      
      // Set up auto-refresh interval
      refreshIntervalRef.current = setInterval(() => {
        if (isFocusedRef.current) {
          loadData();
        }
      }, 30000); // 30 seconds
      
      return () => {
        isFocusedRef.current = false;
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }, [loadData])
  );

  // Also refresh when app comes back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && isFocusedRef.current) {
        loadData();
      }
    });
    return () => subscription.remove();
  }, [loadData]);

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    try {
      const hasSeenWelcome = await AsyncStorage.getItem('hasSeenWelcome');
      if (!hasSeenWelcome) {
        setShowWelcome(true);
      }
    } catch (error) {
      console.error('Error checking first time:', error);
    }
  };

  const handleCloseWelcome = async () => {
    try {
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
      setShowWelcome(false);
    } catch (error) {
      console.error('Error saving welcome state:', error);
    }
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: `Join me on WayPledge - a community where we help each other freely, without money. Give what you can, receive what you need. 🐝\n\nDownload: https://waypledge.me`,
        title: 'Share WayPledge',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <WelcomeModal visible={showWelcome} onClose={handleCloseWelcome} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Image
            source={require('../../assets/waypledge-logo.png')}
            style={styles.heroLogo}
            resizeMode="contain"
          />
          <Text style={styles.heroTitle}>WayPledge</Text>
          <Text style={styles.heroSubtitle}>A Gift Economy Community</Text>
        </View>

        <View style={styles.heroQuoteBox}>
          <Text style={styles.heroQuote}>Give Freely. Receive Gratefully.</Text>
          <Text style={styles.heroQuoteSub}>Trust Flows in Circles.</Text>
        </View>

        {/* Share WayPledge - Prominent */}
        <TouchableOpacity style={styles.shareCard} onPress={handleShareApp}>
          <View style={styles.shareCardContent}>
            <MaterialIcons name="favorite" size={24} color={Colors.accent} />
            <View style={styles.shareCardText}>
              <Text style={styles.shareCardTitle}>Love WayPledge?</Text>
              <Text style={styles.shareCardSubtitle}>Share it with friends & family</Text>
            </View>
          </View>
          <View style={styles.shareCardButton}>
            <MaterialIcons name="share" size={20} color={Colors.surface} />
            <Text style={styles.shareCardButtonText}>Share</Text>
          </View>
        </TouchableOpacity>

        {/* What is WayPledge - Expandable */}
        <TouchableOpacity 
          style={styles.whatIsHeader}
          onPress={() => setShowWhatIs(!showWhatIs)}
        >
          <Text style={styles.whatIsTitle}>What is WayPledge?</Text>
          <MaterialIcons 
            name={showWhatIs ? "expand-less" : "expand-more"} 
            size={24} 
            color={Colors.primary} 
          />
        </TouchableOpacity>

        {showWhatIs && (
          <View style={styles.whatIsContent}>
            <Text style={styles.whatIsText}>
              WayPledge is a living system for exchange that holds the frequency of restoration in practical form. It begins from a simple recognition: that people are already whole, already generous, already oriented toward connection when they feel safe to be.
            </Text>
            
            <Text style={styles.whatIsText}>
              Instead of managing scarcity, it creates space for abundance to reveal itself. Instead of protecting against what might go wrong, it invites what wants to emerge.
            </Text>

            <Text style={styles.whatIsText}>
              The structure is elegant because it's true. People make pledges — offerings of what they can give. People make wishes — requests for what they need. The system holds space for these to meet naturally, without force or extraction.
            </Text>

            <Text style={styles.whatIsText}>
              There's a Do No Harm pledge that acts as a resonance marker. Not a rule to follow but a frequency to match. It says — I'm already oriented this way. You can trust me here.
            </Text>

            <Text style={styles.whatIsText}>
              The language itself carries medicine. Pledges. Wishes. Hives. Honeycombs. Words that remember what exchange feels like when it's alive, when it's based on recognition rather than transaction.
            </Text>

            <Text style={styles.whatIsHighlight}>
              That trust is the frequency. The same one that runs beneath restoration. The knowing that life already moves toward coherence when you stop forcing it into systems built on separation.
            </Text>

            <Text style={styles.whatIsFinal}>
              It's restoration walking into the world. Made practical. Made liveable. Made shareable.
            </Text>
          </View>
        )}

        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Friend'}! 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => setShowWelcome(true)}
          >
            <MaterialIcons name="help-outline" size={28} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.howItWorksButton}
            onPress={() => setShowWelcome(true)}
          >
            <MaterialIcons name="info" size={18} color={Colors.primary} />
            <Text style={styles.howItWorksText}>How It Works</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: Colors.pledgeLight }]}>
            <MaterialIcons name="card-giftcard" size={32} color={Colors.pledgeDark} />
            <Text style={styles.statNumber}>{recentPledges.length}</Text>
            <Text style={styles.statLabel}>Recent Pledges</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.wishLight }]}>
            <MaterialIcons name="star" size={32} color={Colors.wishDark} />
            <Text style={styles.statNumber}>{recentWishes.length}</Text>
            <Text style={styles.statLabel}>Recent Wishes</Text>
          </View>
        </View>

        {/* Community Discovery Card */}
        <TouchableOpacity 
          style={styles.communityCard}
          onPress={() => router.push('/(tabs)/hive')}
        >
          <View style={styles.communityCardLeft}>
            <View style={styles.communityIconBox}>
              <MaterialIcons name="hexagon" size={28} color={Colors.accent} />
            </View>
            <View style={styles.communityCardText}>
              {myCommunities.length === 0 ? (
                <>
                  <Text style={styles.communityCardTitle}>Find Your Community</Text>
                  <Text style={styles.communityCardSubtitle}>Join local groups to connect with people nearby</Text>
                </>
              ) : (
                <>
                  <Text style={styles.communityCardTitle}>My Communities ({myCommunities.length})</Text>
                  <Text style={styles.communityCardSubtitle}>
                    {myCommunities.slice(0, 2).map(c => c.name).join(', ')}
                    {myCommunities.length > 2 ? ` +${myCommunities.length - 2} more` : ''}
                  </Text>
                </>
              )}
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Pledges</Text>
            <MaterialIcons name="card-giftcard" size={24} color={Colors.pledgeDark} />
          </View>
          {recentPledges.length > 0 ? (
            recentPledges.map((pledge) => (
              <View key={pledge.id} style={[styles.itemCard, { borderLeftColor: Colors.pledgeDark }]}>
                <Text style={styles.itemTitle}>{pledge.title}</Text>
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {pledge.description}
                </Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemAuthor}>by {pledge.user_name}</Text>
                  <View style={[styles.categoryBadge, { backgroundColor: Colors.pledgeLight }]}>
                    <Text style={[styles.categoryText, { color: Colors.pledgeDark }]}>
                      {pledge.category}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No recent pledges yet</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Wishes</Text>
            <MaterialIcons name="star" size={24} color={Colors.wishDark} />
          </View>
          {recentWishes.length > 0 ? (
            recentWishes.map((wish) => (
              <View key={wish.id} style={[styles.itemCard, { borderLeftColor: Colors.wishDark }]}>
                <Text style={styles.itemTitle}>{wish.title}</Text>
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {wish.description}
                </Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemAuthor}>by {wish.user_name}</Text>
                  <View style={[styles.categoryBadge, { backgroundColor: Colors.wishLight }]}>
                    <Text style={[styles.categoryText, { color: Colors.wishDark }]}>
                      {wish.category}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No recent wishes yet</Text>
          )}
        </View>

        {/* Gratitude Section - Thank people & Support WayPledge */}
        {/* Gratitude Section */}
        <View style={styles.gratitudeSection}>
          <View style={styles.gratitudeSectionHeader}>
            <MaterialIcons name="favorite" size={24} color={Colors.accent} />
            <Text style={styles.gratitudeSectionTitle}>Gratitude</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.gratitudeButton}
            onPress={() => router.push('/gratitude')}
          >
            <MaterialIcons name="volunteer-activism" size={22} color={Colors.accent} />
            <View style={styles.gratitudeButtonText}>
              <Text style={styles.gratitudeButtonTitle}>Say Thank You</Text>
              <Text style={styles.gratitudeButtonSubtitle}>Thank someone in the community</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.gratitudeButton}
            onPress={() => Linking.openURL(OPEN_COLLECTIVE_URL)}
          >
            <MaterialIcons name="favorite-border" size={22} color={Colors.accent} />
            <View style={styles.gratitudeButtonText}>
              <Text style={styles.gratitudeButtonTitle}>Support WayPledge</Text>
              <Text style={styles.gratitudeButtonSubtitle}>Help keep the community running</Text>
            </View>
            <MaterialIcons name="open-in-new" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.wallLinkSmall}
            onPress={() => router.push('/wall')}
          >
            <Text style={styles.wallLinkSmallText}>View Gratitude Wall & Stories</Text>
            <MaterialIcons name="chevron-right" size={18} color={Colors.primary} />
          </TouchableOpacity>
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
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  helpButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  welcomeCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeLogo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  heroLogo: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  heroQuoteBox: {
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  heroQuote: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.surface,
    textAlign: 'center',
  },
  heroQuoteSub: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface,
    textAlign: 'center',
    marginTop: 6,
    opacity: 0.9,
  },
  shareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.accent + '15',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  shareCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shareCardText: {
    marginLeft: 12,
    flex: 1,
  },
  shareCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  shareCardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  shareCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  shareCardButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  whatIsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  whatIsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  whatIsContent: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  whatIsText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  whatIsHighlight: {
    fontSize: 14,
    color: Colors.primary,
    lineHeight: 22,
    marginBottom: 12,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  whatIsFinal: {
    fontSize: 15,
    color: Colors.accent,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  communityCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  communityIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  communityCardText: {
    flex: 1,
  },
  communityCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  communityCardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  quickActions: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 15,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  welcomeTagline: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  howItWorksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary + '15',
    borderRadius: 20,
    marginTop: 8,
  },
  howItWorksText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  itemCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  itemDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemAuthor: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  gratitudeCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  gratitudeMessage: {
    fontSize: 14,
    color: Colors.text,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  gratitudeAuthor: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  gratitudeSection: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  gratitudeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  gratitudeSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  gratitudeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  gratitudeButtonText: {
    flex: 1,
    marginLeft: 12,
  },
  gratitudeButtonTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  gratitudeButtonSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  wallLinkSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    gap: 4,
  },
  wallLinkSmallText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
});
