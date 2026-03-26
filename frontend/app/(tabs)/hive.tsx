import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { router } from 'expo-router';
import api from '../../utils/api';

interface Hive {
  id: string;
  name: string;
  description: string;
  location: string;
  vision: string;
  image: string | null;
  hive_type: string;
  founder_id: string;
  founder_name: string;
  member_count: number;
  pledge_count: number;
  wish_count: number;
  is_verified: boolean;
  created_at: string;
}

export default function HiveScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const [hives, setHives] = useState<Hive[]>([]);
  const [myHives, setMyHives] = useState<Hive[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'my-hives'>('discover');
  
  // Create hive form
  const [newHiveName, setNewHiveName] = useState('');
  const [newHiveDescription, setNewHiveDescription] = useState('');
  const [newHiveLocation, setNewHiveLocation] = useState('');
  const [newHiveVision, setNewHiveVision] = useState('');
  const [creating, setCreating] = useState(false);

  const loadHives = useCallback(async () => {
    try {
      const params = searchQuery ? { search: searchQuery } : {};
      const response = await api.get('/hives', { params });
      setHives(response.data);
    } catch (error) {
      console.error('Error loading hives:', error);
    }
  }, [searchQuery]);

  const loadMyHives = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/hives/my/memberships');
      setMyHives(response.data);
    } catch (error) {
      console.error('Error loading my hives:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadHives(), loadMyHives()]);
      setLoading(false);
    };
    loadData();
  }, [loadHives, loadMyHives]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadHives(), loadMyHives()]);
    setRefreshing(false);
  };

  const handleJoinHive = async (hiveId: string) => {
    if (!isAuthenticated) {
      alert('Please log in to join a hive');
      return;
    }
    try {
      await api.post(`/hives/${hiveId}/join`);
      alert('Welcome to the hive!');
      await loadMyHives();
      await loadHives();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to join hive');
    }
  };

  const handleLeaveHive = async (hiveId: string) => {
    try {
      await api.post(`/hives/${hiveId}/leave`);
      alert('You have left the hive');
      await loadMyHives();
      await loadHives();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to leave hive');
    }
  };

  const handleCreateHive = async () => {
    if (!newHiveName.trim() || !newHiveDescription.trim() || !newHiveLocation.trim()) {
      alert('Please fill in name, description, and location');
      return;
    }

    try {
      setCreating(true);
      await api.post('/hives', {
        name: newHiveName.trim(),
        description: newHiveDescription.trim(),
        location: newHiveLocation.trim(),
        vision: newHiveVision.trim(),
      });
      
      // Reset form
      setNewHiveName('');
      setNewHiveDescription('');
      setNewHiveLocation('');
      setNewHiveVision('');
      setShowCreateModal(false);
      
      alert('Hive created! You are the founder.');
      await Promise.all([loadHives(), loadMyHives()]);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create hive');
    } finally {
      setCreating(false);
    }
  };

  const isMember = (hiveId: string) => {
    return myHives.some(h => h.id === hiveId);
  };

  const renderHiveCard = (hive: Hive, showJoinLeave: boolean = true) => {
    const amMember = isMember(hive.id);
    const amFounder = hive.founder_id === user?.id;

    return (
      <TouchableOpacity 
        key={hive.id} 
        style={styles.hiveCard}
        onPress={() => router.push(`/hive/${hive.id}`)}
      >
        <View style={styles.hiveHeader}>
          <View style={styles.hiveIconContainer}>
            <MaterialIcons name="hexagon" size={32} color={Colors.accent} />
          </View>
          <View style={styles.hiveInfo}>
            <View style={styles.hiveTitleRow}>
              <Text style={styles.hiveName}>{hive.name}</Text>
              {hive.is_verified && (
                <MaterialIcons name="verified" size={16} color={Colors.primary} />
              )}
            </View>
            <View style={styles.hiveLocationRow}>
              <MaterialIcons name="place" size={14} color={Colors.textSecondary} />
              <Text style={styles.hiveLocation}>{hive.location}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.hiveDescription} numberOfLines={2}>
          {hive.description}
        </Text>

        {hive.vision ? (
          <Text style={styles.hiveVision} numberOfLines={1}>
            "{hive.vision}"
          </Text>
        ) : null}

        <View style={styles.hiveStats}>
          <View style={styles.statItem}>
            <MaterialIcons name="people" size={16} color={Colors.primary} />
            <Text style={styles.statText}>{hive.member_count}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="card-giftcard" size={16} color={Colors.pledgeDark} />
            <Text style={styles.statText}>{hive.pledge_count}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialIcons name="star" size={16} color={Colors.wishDark} />
            <Text style={styles.statText}>{hive.wish_count}</Text>
          </View>
          <Text style={styles.founderText}>by {hive.founder_name}</Text>
        </View>

        {showJoinLeave && isAuthenticated && (
          <View style={styles.hiveActions}>
            {amMember ? (
              <View style={styles.memberBadge}>
                <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                <Text style={styles.memberText}>
                  {amFounder ? 'Founder' : 'Member'}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleJoinHive(hive.id);
                }}
              >
                <MaterialIcons name="add" size={18} color={Colors.surface} />
                <Text style={styles.joinButtonText}>Join Hive</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading the Honeycomb...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>The Hive</Text>
        <Text style={styles.subtitle}>Connected Communities</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.activeTab]}
          onPress={() => setActiveTab('discover')}
        >
          <MaterialIcons 
            name="explore" 
            size={20} 
            color={activeTab === 'discover' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'discover' && styles.activeTabText]}>
            Discover
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-hives' && styles.activeTab]}
          onPress={() => setActiveTab('my-hives')}
        >
          <MaterialIcons 
            name="home" 
            size={20} 
            color={activeTab === 'my-hives' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'my-hives' && styles.activeTabText]}>
            My Hives ({myHives.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'discover' && (
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hives by name or location..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={loadHives}
          />
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'discover' ? (
          <>
            {hives.length > 0 ? (
              hives.map(hive => renderHiveCard(hive))
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="hexagon" size={64} color={Colors.border} />
                <Text style={styles.emptyTitle}>No Hives Yet</Text>
                <Text style={styles.emptyText}>
                  Be the first to create a local hive and start building your community!
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            {myHives.length > 0 ? (
              myHives.map(hive => renderHiveCard(hive, false))
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="group-add" size={64} color={Colors.border} />
                <Text style={styles.emptyTitle}>No Hives Joined</Text>
                <Text style={styles.emptyText}>
                  Discover and join hives to connect with like-minded communities!
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {isAuthenticated && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <MaterialIcons name="add" size={28} color={Colors.surface} />
        </TouchableOpacity>
      )}

      {/* Create Hive Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create a New Hive</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <MaterialIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalSubtitle}>
                Start a local chapter and grow the honeycomb network
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Hive Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., WayPledge Murcia"
                  placeholderTextColor={Colors.textSecondary}
                  value={newHiveName}
                  onChangeText={setNewHiveName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="What is this hive about?"
                  placeholderTextColor={Colors.textSecondary}
                  value={newHiveDescription}
                  onChangeText={setNewHiveDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Location *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Murcia, Spain"
                  placeholderTextColor={Colors.textSecondary}
                  value={newHiveLocation}
                  onChangeText={setNewHiveLocation}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Vision (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="What does this hive stand for?"
                  placeholderTextColor={Colors.textSecondary}
                  value={newHiveVision}
                  onChangeText={setNewHiveVision}
                />
              </View>

              <View style={styles.pledgeReminder}>
                <MaterialIcons name="shield" size={20} color={Colors.primary} />
                <Text style={styles.pledgeText}>
                  By creating a hive, you commit to upholding the Do No Harm Pledge
                </Text>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateHive}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color={Colors.surface} />
                ) : (
                  <>
                    <MaterialIcons name="hexagon" size={20} color={Colors.surface} />
                    <Text style={styles.submitButtonText}>Create Hive</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    gap: 6,
  },
  activeTab: {
    backgroundColor: Colors.primary + '15',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  hiveCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  hiveHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  hiveIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hiveInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  hiveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hiveName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  hiveLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  hiveLocation: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  hiveDescription: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  hiveVision: {
    fontSize: 13,
    color: Colors.primary,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  hiveStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  founderText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 'auto',
  },
  hiveActions: {
    marginTop: 12,
  },
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberText: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: '600',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  joinButtonText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  createButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  modalScroll: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pledgeReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  pledgeText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 40,
  },
  submitButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});
