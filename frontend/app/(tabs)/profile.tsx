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
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import api, { Pledge, Wish, Gratitude, deleteAccount, getBlockedUsers, unblockUser, BlockedUser, getPendingUsers, approveUser, rejectUser, PendingUser } from '../../utils/api';
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
  
  // Delete Account Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Blocked Users Modal state
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  
  // Admin: Pending Users state
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  
  // Check if current user is admin
  const isAdmin = user?.email && (
    user.email === 'kathy@waldrom.com' || 
    user.email === 'admin@waypledge.me' ||
    user.email === 'kathryn@waypledge.me'
  );

  const handleLanguageChange = async (langCode: string) => {
    await setLanguage(langCode);
    setCurrentLang(langCode);
    setShowLanguageModal(false);
  };

  const getCurrentLanguageDisplay = () => {
    const lang = languages.find(l => l.code === currentLang);
    return lang ? `${lang.flag} ${lang.name}` : '🇬🇧 English';
  };

  const loadBlockedUsers = async () => {
    setLoadingBlocked(true);
    try {
      const users = await getBlockedUsers();
      setBlockedUsers(users);
    } catch (error) {
      console.error('Error loading blocked users:', error);
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleUnblockUser = async (userId: string, userName: string) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              await unblockUser(userId);
              setBlockedUsers(blockedUsers.filter(u => u.user_id !== userId));
              Alert.alert('Success', `${userName} has been unblocked.`);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to unblock user');
            }
          },
        },
      ]
    );
  };

  const loadPendingUsers = async () => {
    setLoadingPending(true);
    try {
      const users = await getPendingUsers();
      setPendingUsers(users);
    } catch (error) {
      console.error('Error loading pending users:', error);
    } finally {
      setLoadingPending(false);
    }
  };

  const handleApproveUser = async (userId: string, userName: string) => {
    try {
      await approveUser(userId);
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
      Alert.alert('Approved!', `${userName} can now use WayPledge.`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to approve user');
    }
  };

  const handleRejectUser = async (userId: string, userName: string) => {
    Alert.alert(
      'Reject User',
      `Are you sure you want to reject ${userName}? Their account will be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectUser(userId);
              setPendingUsers(pendingUsers.filter(u => u.id !== userId));
              Alert.alert('Rejected', `${userName} has been removed.`);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to reject user');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert('Error', 'Please enter your password to confirm deletion');
      return;
    }

    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your pledges, wishes, messages, and account data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteAccount(deletePassword, deleteReason);
              Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
              await logout();
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              } else {
                router.replace('/(auth)/welcome');
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete account');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
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
      router.replace('/(auth)/welcome');
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
          {/* Location hidden for privacy */}
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
                <Text style={styles.gratitudeMessage}>&quot;{gratitude.message}&quot;</Text>
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

        {/* Admin Panel Section - Only visible to admins */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.adminSectionTitle}>Admin Panel</Text>
            <TouchableOpacity 
              style={styles.adminButton}
              onPress={() => {
                loadPendingUsers();
                setShowPendingModal(true);
              }}
            >
              <MaterialIcons name="person-add" size={20} color={Colors.surface} />
              <Text style={styles.adminButtonText}>Pending Users</Text>
              {pendingUsers.length > 0 && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{pendingUsers.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Pending Users Modal */}
        <Modal
          visible={showPendingModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPendingModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Pending Users</Text>
                <TouchableOpacity onPress={() => setShowPendingModal(false)}>
                  <MaterialIcons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>
              {loadingPending ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ padding: 20 }} />
              ) : pendingUsers.length === 0 ? (
                <Text style={styles.emptyBlockedText}>No pending users</Text>
              ) : (
                pendingUsers.map((pendingUser) => (
                  <View key={pendingUser.id} style={styles.pendingUserItem}>
                    <View style={styles.pendingUserInfo}>
                      <Text style={styles.pendingUserName}>{pendingUser.name}</Text>
                      <Text style={styles.pendingUserEmail}>{pendingUser.email}</Text>
                    </View>
                    <View style={styles.pendingActions}>
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => handleApproveUser(pendingUser.id, pendingUser.name)}
                      >
                        <MaterialIcons name="check" size={24} color={Colors.surface} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleRejectUser(pendingUser.id, pendingUser.name)}
                      >
                        <MaterialIcons name="close" size={24} color={Colors.surface} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </Modal>

        {/* Blocked Users Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => {
              loadBlockedUsers();
              setShowBlockedModal(true);
            }}
          >
            <MaterialIcons name="block" size={20} color={Colors.textSecondary} />
            <Text style={styles.settingsButtonText}>Blocked Users</Text>
            <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Blocked Users Modal */}
        <Modal
          visible={showBlockedModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowBlockedModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Blocked Users</Text>
                <TouchableOpacity onPress={() => setShowBlockedModal(false)}>
                  <MaterialIcons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>
              {loadingBlocked ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ padding: 20 }} />
              ) : blockedUsers.length === 0 ? (
                <Text style={styles.emptyBlockedText}>No blocked users</Text>
              ) : (
                blockedUsers.map((blockedUser) => (
                  <View key={blockedUser.id} style={styles.blockedUserItem}>
                    <View style={styles.blockedUserInfo}>
                      <MaterialIcons name="person" size={24} color={Colors.textSecondary} />
                      <Text style={styles.blockedUserName}>{blockedUser.user_name}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.unblockButton}
                      onPress={() => handleUnblockUser(blockedUser.user_id, blockedUser.user_name)}
                    >
                      <Text style={styles.unblockButtonText}>Unblock</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        </Modal>

        {/* Quick Links Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          
          <TouchableOpacity 
            style={styles.quickLinkButton}
            onPress={() => router.push('/(tabs)/hive')}
          >
            <MaterialIcons name="hexagon" size={22} color={Colors.primary} />
            <Text style={styles.quickLinkText}>My Hive</Text>
            <MaterialIcons name="chevron-right" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickLinkButton}
            onPress={() => router.push('/(tabs)/about')}
          >
            <MaterialIcons name="info" size={22} color={Colors.primary} />
            <Text style={styles.quickLinkText}>About WayPledge</Text>
            <MaterialIcons name="chevron-right" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          {isAdmin && (
            <TouchableOpacity 
              style={styles.quickLinkButton}
              onPress={() => router.push('/(tabs)/admin')}
            >
              <MaterialIcons name="admin-panel-settings" size={22} color={Colors.primary} />
              <Text style={styles.quickLinkText}>Admin Dashboard</Text>
              <MaterialIcons name="chevron-right" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color={Colors.error} />
            <Text style={styles.logoutButtonText}>{t('auth.logout')}</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Account Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.deleteAccountButton}
            onPress={() => setShowDeleteModal(true)}
          >
            <MaterialIcons name="delete-forever" size={20} color={Colors.error} />
            <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Account Modal */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.deleteModalContent}>
              <View style={styles.modalHeader}>
                <MaterialIcons name="warning" size={32} color={Colors.error} />
                <Text style={styles.deleteModalTitle}>Delete Account</Text>
                <TouchableOpacity onPress={() => setShowDeleteModal(false)}>
                  <MaterialIcons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.deleteWarning}>
                This action is permanent and cannot be undone. The following will be deleted:
              </Text>
              
              <View style={styles.deleteList}>
                <Text style={styles.deleteListItem}>• Your profile and account</Text>
                <Text style={styles.deleteListItem}>• All your pledges</Text>
                <Text style={styles.deleteListItem}>• All your wishes</Text>
                <Text style={styles.deleteListItem}>• All your messages</Text>
                <Text style={styles.deleteListItem}>• All your connections</Text>
                <Text style={styles.deleteListItem}>• All gratitude posts</Text>
              </View>
              
              <Text style={styles.deleteLabel}>Enter your password to confirm:</Text>
              <TextInput
                style={styles.deleteInput}
                placeholder="Password"
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry
                placeholderTextColor={Colors.textSecondary}
              />
              
              <Text style={styles.deleteLabel}>Reason for leaving (optional):</Text>
              <TextInput
                style={[styles.deleteInput, styles.deleteReasonInput]}
                placeholder="Help us improve..."
                value={deleteReason}
                onChangeText={setDeleteReason}
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.textSecondary}
              />
              
              <TouchableOpacity
                style={[styles.deleteConfirmButton, isDeleting && styles.deleteButtonDisabled]}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color={Colors.surface} />
                ) : (
                  <>
                    <MaterialIcons name="delete-forever" size={20} color={Colors.surface} />
                    <Text style={styles.deleteConfirmText}>Delete My Account</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
  // Blocked Users styles
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  settingsButtonText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  emptyBlockedText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 30,
  },
  blockedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  blockedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  blockedUserName: {
    fontSize: 16,
    color: Colors.text,
  },
  unblockButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unblockButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  // Delete Account styles
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.error,
    borderStyle: 'dashed',
  },
  deleteAccountButtonText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500',
  },
  deleteModalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.error,
    flex: 1,
    marginLeft: 8,
  },
  deleteWarning: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteList: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  deleteListItem: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  deleteLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 8,
  },
  deleteInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deleteReasonInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  deleteConfirmButton: {
    backgroundColor: Colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteConfirmText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  // Admin Panel styles
  adminSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  adminButtonText: {
    flex: 1,
    fontSize: 16,
    color: Colors.surface,
    fontWeight: '600',
  },
  badgeContainer: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  pendingUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  pendingUserInfo: {
    flex: 1,
  },
  pendingUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  pendingUserEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    backgroundColor: Colors.success,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: Colors.error,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  quickLinkText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
});
