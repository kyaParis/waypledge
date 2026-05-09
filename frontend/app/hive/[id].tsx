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
  Modal,
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
  
  // Link With state
  const [linkedCommunities, setLinkedCommunities] = useState<any[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<any[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<any[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [linkSearchResults, setLinkSearchResults] = useState<Hive[]>([]);
  const [linkMessage, setLinkMessage] = useState('');
  const [selectedLinkTarget, setSelectedLinkTarget] = useState<Hive | null>(null);

  // Filter child hives by search
  const filteredChildHives = childHives.filter(child => 
    child.name.toLowerCase().includes(childSearch.toLowerCase()) ||
    child.location.toLowerCase().includes(childSearch.toLowerCase())
  );

  const loadLinks = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get(`/hives/${id}/links`);
      setLinkedCommunities(res.data.linked || []);
      setPendingIncoming(res.data.pending_incoming || []);
      setPendingOutgoing(res.data.pending_outgoing || []);
    } catch (error) {
      console.error('Error loading links:', error);
    }
  }, [id, isAuthenticated]);

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
    loadLinks();
  }, [loadData, loadLinks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleJoin = async () => {
    if (!isAuthenticated) {
      alert('Please log in to join this community');
      return;
    }
    try {
      await api.post(`/hives/${id}/join`);
      // Immediately update local state
      setIsMember(true);
      setMyRole('member');
      alert('Welcome to the community!');
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
      alert('You have left the community');
      await loadData(); // Also refresh from server
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to leave');
    }
  };

  // Link With functions
  const isAdmin = myRole === 'founder' || myRole === 'guardian';

  const searchCommunitiesToLink = async (query: string) => {
    if (query.length < 2) {
      setLinkSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/hives?search=${encodeURIComponent(query)}&limit=10`);
      // Filter out current hive and already linked communities
      const linkedIds = linkedCommunities.map(l => l.hive_id);
      const filtered = res.data.filter((h: Hive) => 
        h.id !== id && !linkedIds.includes(h.id)
      );
      setLinkSearchResults(filtered);
    } catch (error) {
      console.error('Error searching communities:', error);
    }
  };

  const handleRequestLink = async () => {
    if (!selectedLinkTarget) return;
    try {
      await api.post(`/hives/${id}/link-request`, {
        target_hive_id: selectedLinkTarget.id,
        message: linkMessage
      });
      alert(`Link request sent to ${selectedLinkTarget.name}!`);
      setShowLinkModal(false);
      setSelectedLinkTarget(null);
      setLinkMessage('');
      setLinkSearchQuery('');
      setLinkSearchResults([]);
      await loadLinks();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to send link request');
    }
  };

  const handleRespondToLink = async (linkId: string, accept: boolean, requesterName: string) => {
    try {
      await api.post(`/hives/${id}/links/${linkId}/respond?accept=${accept}`);
      alert(accept ? `Now linked with ${requesterName}!` : 'Link request declined');
      await loadLinks();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to respond');
    }
  };

  const handleUnlink = async (linkId: string, communityName: string) => {
    try {
      await api.delete(`/hives/${id}/links/${linkId}`);
      alert(`Unlinked from ${communityName}`);
      await loadLinks();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to unlink');
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
          <Text style={styles.errorText}>Community not found</Text>
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
                  <Text style={styles.joinButtonText}>Join This Community</Text>
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
              <Text style={styles.sectionTitle}>About This Community</Text>
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

              {/* Linked Communities Section */}
              {isAuthenticated && (
                <View style={styles.linksSection}>
                  <View style={styles.linksSectionHeader}>
                    <View style={styles.linksTitleRow}>
                      <MaterialIcons name="link" size={20} color={Colors.primary} />
                      <Text style={styles.linksSectionTitle}>Linked Communities</Text>
                    </View>
                    {isAdmin && (
                      <TouchableOpacity 
                        style={styles.linkWithButton}
                        onPress={() => setShowLinkModal(true)}
                      >
                        <MaterialIcons name="add-link" size={18} color={Colors.surface} />
                        <Text style={styles.linkWithButtonText}>Link With</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Pending Incoming Requests (only for admins) */}
                  {isAdmin && pendingIncoming.length > 0 && (
                    <View style={styles.pendingSection}>
                      <Text style={styles.pendingLabel}>Pending Link Requests</Text>
                      {pendingIncoming.map((req) => (
                        <View key={req.link_id} style={styles.pendingCard}>
                          <View style={styles.pendingInfo}>
                            <Text style={styles.pendingName}>{req.requester_hive_name}</Text>
                            <Text style={styles.pendingBy}>Requested by {req.requested_by}</Text>
                            {req.message && <Text style={styles.pendingMessage}>"{req.message}"</Text>}
                          </View>
                          <View style={styles.pendingActions}>
                            <TouchableOpacity 
                              style={styles.acceptButton}
                              onPress={() => handleRespondToLink(req.link_id, true, req.requester_hive_name)}
                            >
                              <MaterialIcons name="check" size={20} color={Colors.surface} />
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.declineButton}
                              onPress={() => handleRespondToLink(req.link_id, false, req.requester_hive_name)}
                            >
                              <MaterialIcons name="close" size={20} color={Colors.surface} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Linked Communities List */}
                  {linkedCommunities.length > 0 ? (
                    <View style={styles.linkedList}>
                      {linkedCommunities.map((link) => (
                        <View key={link.link_id} style={styles.linkedCard}>
                          <TouchableOpacity 
                            style={styles.linkedInfo}
                            onPress={() => router.push(`/hive/${link.hive_id}`)}
                          >
                            <MaterialIcons name="groups" size={20} color={Colors.primary} />
                            <Text style={styles.linkedName}>{link.hive_name}</Text>
                            <MaterialIcons name="chevron-right" size={18} color={Colors.textSecondary} />
                          </TouchableOpacity>
                          {isAdmin && (
                            <TouchableOpacity 
                              style={styles.unlinkButton}
                              onPress={() => handleUnlink(link.link_id, link.hive_name)}
                            >
                              <MaterialIcons name="link-off" size={16} color={Colors.error} />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noLinksText}>
                      No linked communities yet. {isAdmin ? 'Use "Link With" to connect with neighboring communities.' : ''}
                    </Text>
                  )}

                  {/* Pending Outgoing */}
                  {pendingOutgoing.length > 0 && (
                    <View style={styles.outgoingSection}>
                      <Text style={styles.outgoingLabel}>Awaiting Response</Text>
                      {pendingOutgoing.map((req) => (
                        <View key={req.link_id} style={styles.outgoingCard}>
                          <MaterialIcons name="schedule" size={16} color={Colors.textSecondary} />
                          <Text style={styles.outgoingName}>{req.target_hive_name}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
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
              <Text style={styles.sectionTitle}>Pledges in This Community</Text>
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
                <Text style={styles.emptyText}>No pledges in this community yet. Be the first to contribute!</Text>
              )}
            </View>
          )}

          {activeTab === 'wishes' && (
            <View>
              <Text style={styles.sectionTitle}>Wishes in This Community</Text>
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
                <Text style={styles.emptyText}>No wishes in this community yet.</Text>
              )}
            </View>
          )}

          {activeTab === 'members' && (
            <View>
              <Text style={styles.sectionTitle}>Community Members ({members.length})</Text>
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

      {/* Link With Modal */}
      <Modal
        visible={showLinkModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLinkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Link With Community</Text>
              <TouchableOpacity onPress={() => {
                setShowLinkModal(false);
                setSelectedLinkTarget(null);
                setLinkSearchQuery('');
                setLinkSearchResults([]);
                setLinkMessage('');
              }}>
                <MaterialIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Connect with a neighboring community to share pledges and wishes
            </Text>

            {!selectedLinkTarget ? (
              <>
                <View style={styles.searchContainer}>
                  <MaterialIcons name="search" size={20} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search communities by name..."
                    placeholderTextColor={Colors.textSecondary}
                    value={linkSearchQuery}
                    onChangeText={(text) => {
                      setLinkSearchQuery(text);
                      searchCommunitiesToLink(text);
                    }}
                  />
                </View>

                <ScrollView style={styles.searchResults}>
                  {linkSearchResults.map((community) => (
                    <TouchableOpacity
                      key={community.id}
                      style={styles.searchResultItem}
                      onPress={() => setSelectedLinkTarget(community)}
                    >
                      <View style={styles.searchResultInfo}>
                        <Text style={styles.searchResultName}>{community.name}</Text>
                        <Text style={styles.searchResultLocation}>{community.location}</Text>
                      </View>
                      <MaterialIcons name="chevron-right" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  ))}
                  {linkSearchQuery.length >= 2 && linkSearchResults.length === 0 && (
                    <Text style={styles.noResultsText}>No communities found</Text>
                  )}
                </ScrollView>
              </>
            ) : (
              <View style={styles.selectedTarget}>
                <View style={styles.selectedHeader}>
                  <Text style={styles.selectedLabel}>Send link request to:</Text>
                  <TouchableOpacity onPress={() => setSelectedLinkTarget(null)}>
                    <Text style={styles.changeLink}>Change</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.selectedCard}>
                  <MaterialIcons name="groups" size={24} color={Colors.primary} />
                  <View style={styles.selectedInfo}>
                    <Text style={styles.selectedName}>{selectedLinkTarget.name}</Text>
                    <Text style={styles.selectedLocation}>{selectedLinkTarget.location}</Text>
                  </View>
                </View>

                <Text style={styles.messageLabel}>Message (optional)</Text>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Why do you want to link? e.g., We're neighbors!"
                  placeholderTextColor={Colors.textSecondary}
                  value={linkMessage}
                  onChangeText={setLinkMessage}
                  multiline
                  numberOfLines={2}
                />

                <TouchableOpacity 
                  style={styles.sendRequestButton}
                  onPress={handleRequestLink}
                >
                  <MaterialIcons name="send" size={20} color={Colors.surface} />
                  <Text style={styles.sendRequestText}>Send Link Request</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  // Link With styles
  linksSection: {
    marginTop: 20,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  linksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  linksTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linksSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  linkWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  linkWithButtonText: {
    fontSize: 13,
    color: Colors.surface,
    fontWeight: '600',
  },
  pendingSection: {
    marginBottom: 16,
  },
  pendingLabel: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '600',
    marginBottom: 8,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent + '15',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  pendingInfo: {
    flex: 1,
  },
  pendingName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  pendingBy: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pendingMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkedList: {
    gap: 8,
  },
  linkedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
  },
  linkedInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  linkedName: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  unlinkButton: {
    padding: 8,
  },
  noLinksText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 12,
  },
  outgoingSection: {
    marginTop: 12,
  },
  outgoingLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  outgoingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  outgoingName: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  searchResults: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  searchResultLocation: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  noResultsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  selectedTarget: {
    marginTop: 8,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  changeLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    marginBottom: 16,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  selectedLocation: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  messageLabel: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: Colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  sendRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  sendRequestText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.surface,
  },
});
