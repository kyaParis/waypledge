import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

interface Hive {
  id: string;
  name: string;
  description: string;
  location: string;
  vision: string;
  founder_id: string;
  founder_name: string;
  member_count: number;
  pledge_count: number;
  wish_count: number;
  is_verified: boolean;
  parent_hive_id?: string;
  parent_hive_name?: string;
  child_hive_count: number;
}

interface Member {
  id: string;
  user_id: string;
  user_name: string;
  role: string;
  joined_at: string;
}

interface Pledge {
  id: string;
  title: string;
  description: string;
  user_name: string;
  category: string;
  location: string;
}

interface Wish {
  id: string;
  title: string;
  description: string;
  user_name: string;
  category: string;
  location: string;
}

export default function HiveDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const [hive, setHive] = useState<Hive | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [childHives, setChildHives] = useState<Hive[]>([]);
  const [childSearch, setChildSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'communities' | 'pledges' | 'wishes' | 'members'>('about');
  const [isMember, setIsMember] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);

  // Filter child hives by search
  const filteredChildHives = childHives.filter(child => 
    child.name.toLowerCase().includes(childSearch.toLowerCase()) ||
    child.location.toLowerCase().includes(childSearch.toLowerCase())
  );

  const loadData = useCallback(async () => {
    try {
      const [hiveRes, membersRes, pledgesRes, wishesRes, childrenRes] = await Promise.all([
        api.get(`/hives/${id}`),
        api.get(`/hives/${id}/members`),
        api.get(`/pledges?hive_id=${id}`),
        api.get(`/wishes?hive_id=${id}`),
        api.get(`/hives/${id}/children`),
      ]);
      
      setHive(hiveRes.data);
      setMembers(membersRes.data);
      setPledges(pledgesRes.data);
      setWishes(wishesRes.data);
      setChildHives(childrenRes.data);

      // Check if current user is a member
      if (user) {
        const membership = membersRes.data.find((m: Member) => m.user_id === user.id);
        setIsMember(!!membership);
        setMyRole(membership?.role || null);
      }
    } catch (error) {
      console.error('Error loading hive:', error);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleJoin = async () => {
    if (!isAuthenticated) {
      alert('Please log in to join this hive');
      return;
    }
    try {
      await api.post(`/hives/${id}/join`);
      // Immediately update local state
      setIsMember(true);
      setMyRole('member');
      alert('Welcome to the hive!');
      await loadData(); // Also refresh from server
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to join');
    }
  };

  const handleLeave = async () => {
    try {
      await api.post(`/hives/${id}/leave`);
      // Immediately update local state
      setIsMember(false);
      setMyRole(null);
      alert('You have left the hive');
      await loadData(); // Also refresh from server
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to leave');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!hive) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Hive not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/hive');
            }
          }} 
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{hive.name}</Text>
          {hive.is_verified && (
            <MaterialIcons name="verified" size={18} color={Colors.primary} />
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.hiveIcon}>
            <MaterialIcons name="hexagon" size={48} color={Colors.accent} />
          </View>
          <Text style={styles.hiveName}>{hive.name}</Text>
          <View style={styles.locationRow}>
            <MaterialIcons name="place" size={16} color={Colors.textSecondary} />
            <Text style={styles.hiveLocation}>{hive.location}</Text>
          </View>
          {hive.vision ? (
            <Text style={styles.hiveVision}>"{hive.vision}"</Text>
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{hive.member_count}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{pledges.length}</Text>
              <Text style={styles.statLabel}>Pledges</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{wishes.length}</Text>
              <Text style={styles.statLabel}>Wishes</Text>
            </View>
          </View>

          {isAuthenticated && (
            <View style={styles.actionRow}>
              {isMember ? (
                <View style={styles.memberStatus}>
                  <MaterialIcons name="check-circle" size={20} color={Colors.success} />
                  <Text style={styles.memberStatusText}>
                    {myRole === 'founder' ? 'You are the Founder' : 'You are a Member'}
                  </Text>
                  {myRole !== 'founder' && (
                    <TouchableOpacity onPress={handleLeave} style={styles.leaveButton}>
                      <Text style={styles.leaveButtonText}>Leave</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity style={styles.joinButton} onPress={handleJoin}>
                  <MaterialIcons name="add" size={20} color={Colors.surface} />
                  <Text style={styles.joinButtonText}>Join This Hive</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {(['about', 'communities', 'pledges', 'wishes', 'members'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'communities' ? `Local (${childHives.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'about' && (
            <View>
              <Text style={styles.sectionTitle}>About This Hive</Text>
              <Text style={styles.description}>{hive.description}</Text>
              
              {hive.parent_hive_name && (
                <TouchableOpacity 
                  style={styles.parentHiveCard}
                  onPress={() => router.push(`/hive/${hive.parent_hive_id}`)}
                >
                  <MaterialIcons name="arrow-upward" size={20} color={Colors.primary} />
                  <Text style={styles.parentHiveText}>Part of {hive.parent_hive_name}</Text>
                  <MaterialIcons name="chevron-right" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              )}
              
              <View style={styles.founderCard}>
                <MaterialIcons name="person" size={24} color={Colors.accent} />
                <View style={styles.founderInfo}>
                  <Text style={styles.founderLabel}>Founded by</Text>
                  <Text style={styles.founderName}>{hive.founder_name}</Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'communities' && (
            <View>
              <View style={styles.communitiesHeader}>
                <Text style={styles.sectionTitle}>Local Communities ({childHives.length})</Text>
              </View>
              <Text style={styles.subText}>Areas and communities within {hive.name}</Text>
              
              {/* Search bar for communities - shows when there are 3+ */}
              {childHives.length >= 3 && (
                <View style={styles.childSearchContainer}>
                  <MaterialIcons name="search" size={20} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.childSearchInput}
                    placeholder="Search communities..."
                    placeholderTextColor={Colors.textSecondary}
                    value={childSearch}
                    onChangeText={setChildSearch}
                  />
                  {childSearch ? (
                    <TouchableOpacity onPress={() => setChildSearch('')}>
                      <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
              
              {filteredChildHives.length > 0 ? (
                filteredChildHives.map((child) => (
                  <TouchableOpacity 
                    key={child.id} 
                    style={styles.childHiveCard}
                    onPress={() => router.push(`/hive/${child.id}`)}
                  >
                    <View style={styles.childHiveIcon}>
                      <MaterialIcons name="hexagon" size={24} color={Colors.accent} />
                    </View>
                    <View style={styles.childHiveInfo}>
                      <View style={styles.childHiveTitleRow}>
                        <Text style={styles.childHiveName}>{child.name}</Text>
                        {child.is_verified && (
                          <MaterialIcons name="verified" size={14} color={Colors.primary} />
                        )}
                      </View>
                      <Text style={styles.childHiveLocation}>{child.location}</Text>
                      <View style={styles.childHiveStats}>
                        <Text style={styles.childHiveStat}>{child.member_count} members</Text>
                        <Text style={styles.childHiveStat}>{child.pledge_count} pledges</Text>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={Colors.textSecondary} />
                  </TouchableOpacity>
                ))
              ) : childSearch ? (
                <View style={styles.emptyCommunitiesBox}>
                  <MaterialIcons name="search-off" size={48} color={Colors.border} />
                  <Text style={styles.emptyCommunitiesTitle}>No matches found</Text>
                  <Text style={styles.emptyCommunitiesText}>
                    Try a different search term
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyCommunitiesBox}>
                  <MaterialIcons name="add-circle-outline" size={48} color={Colors.border} />
                  <Text style={styles.emptyCommunitiesTitle}>No local communities yet</Text>
                  <Text style={styles.emptyCommunitiesText}>
                    Be the first to create a local community within {hive.name}!
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'pledges' && (
            <View>
              <Text style={styles.sectionTitle}>Pledges in This Hive</Text>
              {pledges.length > 0 ? (
                pledges.map((pledge) => (
                  <View key={pledge.id} style={[styles.itemCard, { borderLeftColor: Colors.pledgeDark }]}>
                    <Text style={styles.itemTitle}>{pledge.title}</Text>
                    <Text style={styles.itemDescription} numberOfLines={2}>{pledge.description}</Text>
                    <View style={styles.itemFooter}>
                      <Text style={styles.itemAuthor}>by {pledge.user_name}</Text>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{pledge.category}</Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No pledges in this hive yet. Be the first to contribute!</Text>
              )}
            </View>
          )}

          {activeTab === 'wishes' && (
            <View>
              <Text style={styles.sectionTitle}>Wishes in This Hive</Text>
              {wishes.length > 0 ? (
                wishes.map((wish) => (
                  <View key={wish.id} style={[styles.itemCard, { borderLeftColor: Colors.wishDark }]}>
                    <Text style={styles.itemTitle}>{wish.title}</Text>
                    <Text style={styles.itemDescription} numberOfLines={2}>{wish.description}</Text>
                    <View style={styles.itemFooter}>
                      <Text style={styles.itemAuthor}>by {wish.user_name}</Text>
                      <View style={[styles.categoryBadge, { backgroundColor: Colors.wishLight }]}>
                        <Text style={[styles.categoryText, { color: Colors.wishDark }]}>{wish.category}</Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No wishes in this hive yet.</Text>
              )}
            </View>
          )}

          {activeTab === 'members' && (
            <View>
              <Text style={styles.sectionTitle}>Hive Members ({members.length})</Text>
              {members.map((member) => (
                <View key={member.id} style={styles.memberCard}>
                  <View style={styles.memberAvatar}>
                    <MaterialIcons name="person" size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.user_name}</Text>
                    <Text style={styles.memberRole}>
                      {member.role === 'founder' ? '👑 Founder' : member.role === 'guardian' ? '🛡️ Guardian' : 'Member'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: Colors.text,
    marginBottom: 12,
  },
  backLink: {
    fontSize: 16,
    color: Colors.primary,
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  hiveIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  hiveName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  hiveLocation: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  hiveVision: {
    fontSize: 15,
    color: Colors.primary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 32,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionRow: {
    marginTop: 20,
    width: '100%',
  },
  memberStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  memberStatusText: {
    fontSize: 15,
    color: Colors.success,
    fontWeight: '600',
  },
  leaveButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  leaveButtonText: {
    fontSize: 13,
    color: Colors.error,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  joinButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.surface,
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 20,
  },
  founderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  founderInfo: {
    flex: 1,
  },
  founderLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  founderName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  itemCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemAuthor: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  categoryBadge: {
    backgroundColor: Colors.pledgeLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.pledgeDark,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 40,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  memberRole: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  parentHiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  parentHiveText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  subText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  childHiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  childHiveIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  childHiveInfo: {
    flex: 1,
  },
  childHiveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  childHiveName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  childHiveLocation: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  childHiveStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  childHiveStat: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyCommunitiesBox: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },
  emptyCommunitiesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
  },
  emptyCommunitiesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
  communitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  childSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  childSearchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
  },
});
