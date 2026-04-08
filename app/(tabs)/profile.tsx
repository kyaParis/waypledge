import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import api, { Pledge, Wish, Gratitude } from '../../utils/api';
import { useTranslation } from 'react-i18next';
import { languages, setLanguage, getCurrentLanguage } from '../../i18n';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { t, i18n } = useTranslation();
  const [myPledges, setMyPledges] = useState<Pledge[]>([]);
  const [myWishes, setMyWishes] = useState<Wish[]>([]);
  const [myGratitude, setMyGratitude] = useState<Gratitude[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

  const handleLanguageChange = async (langCode: string) => {
    await setLanguage(langCode);
    setCurrentLang(langCode);
    setShowLanguageModal(false);
  };

  const getCurrentLanguageDisplay = () => {
    const lang = languages.find(l => l.code === currentLang);
    return lang ? `${lang.flag} ${lang.name}` : '🇬🇧 English';
  };

  const loadData = useCallback(async () => {
    try {
      const [pledgesRes, wishesRes, gratitudeRes] = await Promise.all([
        api.get('/pledges/mine'),
        api.get('/wishes/mine'),
        api.get('/gratitude/mine'),
      ]);
      setMyPledges(pledgesRes.data);
      setMyWishes(wishesRes.data);
      setMyGratitude(gratitudeRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  // Refetch data when screen comes into focus (e.g., after deleting a pledge)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      await logout();
      console.log('Logout successful, navigating to welcome...');
      // Use window.location for web compatibility
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      } else {
        router.replace('/(auth)/welcome');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <MaterialIcons name="account-circle" size={80} color={Colors.primary} />
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {user?.location && (
            <View style={styles.locationContainer}>
              <MaterialIcons name="location-on" size={16} color={Colors.textSecondary} />
              <Text style={styles.userLocation}>{user.location}</Text>
            </View>
          )}
          {user?.bio && <Text style={styles.userBio}>{user.bio}</Text>}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{myPledges.length}</Text>
            <Text style={styles.statLabel}>Pledges</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{myWishes.length}</Text>
            <Text style={styles.statLabel}>Wishes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{myGratitude.length}</Text>
            <Text style={styles.statLabel}>Gratitude</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Pledges</Text>
            <MaterialIcons name="card-giftcard" size={24} color={Colors.pledgeDark} />
          </View>
          {myPledges.length > 0 ? (
            myPledges.slice(0, 3).map((pledge) => (
              <TouchableOpacity 
                key={pledge.id} 
                style={[styles.itemCard, { borderLeftColor: Colors.pledgeDark }]}
                onPress={() => router.push(`/edit?id=${pledge.id}&type=pledge`)}
              >
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{pledge.title}</Text>
                  <MaterialIcons name="edit" size={18} color={Colors.textSecondary} />
                </View>
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {pledge.description}
                </Text>
                {pledge.location ? (
                  <View style={styles.locationRow}>
                    <MaterialIcons name="place" size={14} color={Colors.textSecondary} />
                    <Text style={styles.locationText}>{pledge.location}</Text>
                  </View>
                ) : null}
                <View style={styles.itemFooter}>
                  <View style={[styles.statusBadge, { backgroundColor: Colors.pledgeLight }]}>
                    <Text style={[styles.statusText, { color: Colors.pledgeDark }]}>
                      {pledge.status}
                    </Text>
                  </View>
                  <Text style={styles.tapToEdit}>Tap to edit</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No pledges yet</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Wishes</Text>
            <MaterialIcons name="star" size={24} color={Colors.wishDark} />
          </View>
          {myWishes.length > 0 ? (
            myWishes.slice(0, 3).map((wish) => (
              <TouchableOpacity 
                key={wish.id} 
                style={[styles.itemCard, { borderLeftColor: Colors.wishDark }]}
                onPress={() => router.push(`/edit?id=${wish.id}&type=wish`)}
              >
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{wish.title}</Text>
                  <MaterialIcons name="edit" size={18} color={Colors.textSecondary} />
                </View>
                <Text style={styles.itemDescription} numberOfLines={2}>
                  {wish.description}
                </Text>
                {wish.location ? (
                  <View style={styles.locationRow}>
                    <MaterialIcons name="place" size={14} color={Colors.textSecondary} />
                    <Text style={styles.locationText}>{wish.location}</Text>
                  </View>
                ) : null}
                <View style={styles.itemFooter}>
                  <View style={[styles.statusBadge, { backgroundColor: Colors.wishLight }]}>
                    <Text style={[styles.statusText, { color: Colors.wishDark }]}>
                      {wish.status}
                    </Text>
                  </View>
                  <Text style={styles.tapToEdit}>Tap to edit</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No wishes yet</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gratitude Received</Text>
            <MaterialIcons name="favorite" size={24} color={Colors.accent} />
          </View>
          {myGratitude.length > 0 ? (
            myGratitude.map((gratitude) => (
              <View key={gratitude.id} style={styles.gratitudeCard}>
                <Text style={styles.gratitudeMessage}>"{gratitude.message}"</Text>
                <Text style={styles.gratitudeAuthor}>from {gratitude.from_user_name}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No gratitude received yet</Text>
          )}
        </View>

        {/* Language Selector */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
            <MaterialIcons name="language" size={24} color={Colors.primary} />
          </View>
          <TouchableOpacity 
            style={styles.languageButton}
            onPress={() => setShowLanguageModal(true)}
          >
            <Text style={styles.languageButtonText}>{getCurrentLanguageDisplay()}</Text>
            <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Language Modal */}
        <Modal
          visible={showLanguageModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowLanguageModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('profile.language')}</Text>
                <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                  <MaterialIcons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    currentLang === lang.code && styles.languageOptionActive
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={[
                    styles.languageName,
                    currentLang === lang.code && styles.languageNameActive
                  ]}>
                    {lang.name}
                  </Text>
                  {currentLang === lang.code && (
                    <MaterialIcons name="check" size={24} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color={Colors.error} />
            <Text style={styles.logoutButtonText}>{t('auth.logout')}</Text>
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
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  userLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  userBio: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
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
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  itemDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tapToEdit: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  logoutButtonText: {
    fontSize: 16,
    color: Colors.error,
    fontWeight: '600',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  languageButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Colors.surface,
  },
  languageOptionActive: {
    backgroundColor: Colors.primaryLight + '30',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  languageNameActive: {
    fontWeight: '600',
    color: Colors.primary,
  },
});
