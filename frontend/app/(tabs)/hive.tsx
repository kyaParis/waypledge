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
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { router } from 'expo-router';
import api from '../../utils/api';

// Community types from spec
const COMMUNITY_TYPES = ['Street', 'Resort', 'Neighbourhood', 'Suburb', 'Town', 'City', 'Country', 'Club', 'Other'];

interface Community {
  id: string;
  name: string;
  description: string;
  community_type: string;
  location: string;
  member_count: number;
  parent_hive_id: string | null;
  parent_hive_name: string | null;
  ancestry_path: Array<{ id: string; name: string; type: string }>;
  founder_name: string;
  is_verified: boolean;
}

export default function HiveScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'discover' | 'my'>('discover');
  
  // Modal state: 'closed' | 'search' | 'create'
  const [modalState, setModalState] = useState<'closed' | 'search' | 'create'>('closed');
  
  // Search/Join flow
  const [searchResults, setSearchResults] = useState<Community[]>([]);
  const [searching, setSearching] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  
  // Create form
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('Neighbourhood');
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [newParentName, setNewParentName] = useState<string>('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showParentPicker, setShowParentPicker] = useState(false);
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [parentSearchResults, setParentSearchResults] = useState<Community[]>([]);
  const [searchingParents, setSearchingParents] = useState(false);
  
  // Computed ancestry path for preview
  const [ancestryPreview, setAncestryPreview] = useState<Array<{ name: string; type: string }>>([]);

  const loadCommunities = useCallback(async () => {
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      const response = await api.get('/hives', { params });
      setCommunities(response.data);
    } catch (error) {
      console.error('Error loading communities:', error);
    }
  }, [searchQuery]);

  const loadMyCommunities = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/hives/my-hives');
      setMyCommunities(response.data);
    } catch (error) {
      console.error('Error loading my communities:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadCommunities(), loadMyCommunities()]);
      setLoading(false);
    };
    init();
  }, [loadCommunities, loadMyCommunities]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadCommunities(), loadMyCommunities()]);
    setRefreshing(false);
  };

  // Search communities in modal
  const searchCommunities = async (query: string) => {
    setModalSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      const response = await api.get(`/hives?search=${encodeURIComponent(query)}&limit=10`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  // Search for parent communities
  const searchParentCommunities = async (query: string) => {
    setParentSearchQuery(query);
    if (query.length < 2) {
      setParentSearchResults([]);
      return;
    }
    try {
      setSearchingParents(true);
      const response = await api.get(`/hives?search=${encodeURIComponent(query)}&limit=10`);
      setParentSearchResults(response.data);
    } catch (error) {
      console.error('Parent search error:', error);
    } finally {
      setSearchingParents(false);
    }
  };

  // Select a parent community
  const selectParent = (community: Community) => {
    setNewParentId(community.id);
    setNewParentName(community.name);
    // Build ancestry preview
    const path = community.ancestry_path || [];
    const fullPath = [...path, { name: community.name, type: community.community_type }];
    setAncestryPreview(fullPath);
    setShowParentPicker(false);
    setParentSearchQuery('');
    setParentSearchResults([]);
  };

  // Join a community
  const handleJoin = async (communityId: string, communityName: string) => {
    try {
      await api.post(`/hives/${communityId}/join`);
      alert(`Joined ${communityName}!`);
      setModalState('closed');
      await Promise.all([loadCommunities(), loadMyCommunities()]);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to join');
    }
  };

  // Create a new community
  const handleCreate = async () => {
    if (!newName.trim()) {
      alert('Please enter a name');
      return;
    }
    if (newType !== 'Country' && !newParentId) {
      alert('Please select which community this sits inside');
      return;
    }
    
    try {
      setCreating(true);
      await api.post('/hives', {
        name: newName.trim(),
        community_type: newType,
        parent_id: newParentId,
        description: newDescription.trim(),
      });
      
      alert('Community created! You are now the founder.');
      resetCreateForm();
      setModalState('closed');
      await Promise.all([loadCommunities(), loadMyCommunities()]);
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      if (detail?.existing_id) {
        // Duplicate found - offer to join
        const msg = Platform.OS === 'web' 
          ? `This community already exists: ${detail.existing_path}. Would you like to join it instead?`
          : `This community already exists:\n${detail.existing_path}\n\nWould you like to join it instead?`;
        
        if (Platform.OS === 'web') {
          if (window.confirm(msg)) {
            await handleJoin(detail.existing_id, detail.existing_name);
          }
        } else {
          // For native, just show alert
          alert(msg);
        }
      } else {
        alert(detail?.message || detail || 'Failed to create community');
      }
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setNewName('');
    setNewType('Neighbourhood');
    setNewParentId(null);
    setNewParentName('');
    setNewDescription('');
    setAncestryPreview([]);
  };

  // Build path display string
  const buildPathString = (community: Community) => {
    const parts = [];
    if (community.ancestry_path && community.ancestry_path.length > 0) {
      parts.push(...community.ancestry_path.map(p => p.name));
    }
    return parts.length > 0 ? parts.join(' → ') : community.location || '';
  };

  // Render community card
  const renderCommunityCard = (community: Community, showJoinButton = false) => (
    <TouchableOpacity
      key={community.id}
      style={styles.card}
      onPress={() => router.push(`/hive/${community.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{community.name}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{community.community_type || 'Community'}</Text>
        </View>
      </View>
      
      <Text style={styles.cardPath} numberOfLines={1}>
        {buildPathString(community) || community.location}
      </Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.cardStat}>
          <MaterialIcons name="people" size={14} color={Colors.textSecondary} />
          <Text style={styles.cardStatText}>{community.member_count} members</Text>
        </View>
        {community.is_verified && (
          <MaterialIcons name="verified" size={16} color={Colors.primary} />
        )}
      </View>
      
      {showJoinButton && (
        <TouchableOpacity
          style={styles.joinButton}
          onPress={(e) => {
            e.stopPropagation();
            handleJoin(community.id, community.name);
          }}
        >
          <Text style={styles.joinButtonText}>Join</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const displayedCommunities = activeTab === 'discover' ? communities : myCommunities;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Communities</Text>
        {isAuthenticated && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setModalState('search');
              setModalSearchQuery('');
              setSearchResults([]);
            }}
          >
            <MaterialIcons name="add" size={24} color={Colors.surface} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.tabActive]}
          onPress={() => setActiveTab('discover')}
        >
          <Text style={[styles.tabText, activeTab === 'discover' && styles.tabTextActive]}>
            Discover
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.tabActive]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
            My Communities ({myCommunities.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search communities..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
          }}
          onSubmitEditing={loadCommunities}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); loadCommunities(); }}>
            <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Community List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {displayedCommunities.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="groups" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>
                {activeTab === 'discover' 
                  ? 'No communities found' 
                  : "You haven't joined any communities yet"}
              </Text>
              {activeTab === 'my' && isAuthenticated && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setModalState('search')}
                >
                  <Text style={styles.emptyButtonText}>Find or Create</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            displayedCommunities.map((c) => renderCommunityCard(c))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* MODAL: Search First, Then Create */}
      <Modal
        visible={modalState !== 'closed'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setModalState('closed');
          resetCreateForm();
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                if (modalState === 'create') {
                  setModalState('search');
                  resetCreateForm();
                } else {
                  setModalState('closed');
                }
              }}
            >
              <MaterialIcons 
                name={modalState === 'create' ? 'arrow-back' : 'close'} 
                size={24} 
                color={Colors.text} 
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {modalState === 'search' ? 'Find Your Community' : 'Create New Community'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* SEARCH STATE */}
            {modalState === 'search' && (
              <>
                <Text style={styles.modalSubtitle}>
                  Search for your community first. If it doesn't exist, you can create it.
                </Text>

                {/* Search Input */}
                <View style={styles.modalSearchBox}>
                  <MaterialIcons name="search" size={20} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.modalSearchInput}
                    placeholder="Search by name or location..."
                    placeholderTextColor={Colors.textSecondary}
                    value={modalSearchQuery}
                    onChangeText={searchCommunities}
                    autoFocus
                  />
                  {searching && <ActivityIndicator size="small" color={Colors.primary} />}
                </View>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <View style={styles.resultsContainer}>
                    {searchResults.map((community) => (
                      <TouchableOpacity
                        key={community.id}
                        style={styles.resultCard}
                        onPress={() => handleJoin(community.id, community.name)}
                      >
                        <View style={styles.resultInfo}>
                          <Text style={styles.resultName}>{community.name}</Text>
                          <Text style={styles.resultMeta}>
                            {community.community_type} · {buildPathString(community)}
                          </Text>
                        </View>
                        <View style={styles.resultJoinBtn}>
                          <Text style={styles.resultJoinText}>Join</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* No Results / Create Button */}
                {modalSearchQuery.length >= 2 && !searching && (
                  <TouchableOpacity
                    style={styles.createNewButton}
                    onPress={() => {
                      setNewName(modalSearchQuery);
                      setModalState('create');
                    }}
                  >
                    <MaterialIcons name="add-circle-outline" size={20} color={Colors.primary} />
                    <Text style={styles.createNewText}>
                      {searchResults.length === 0 
                        ? `Create "${modalSearchQuery}"` 
                        : "Not here — create new community"}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* CREATE STATE */}
            {modalState === 'create' && (
              <>
                <Text style={styles.modalSubtitle}>
                  Create a new community. Choose what type and where it sits.
                </Text>

                {/* Name Field */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>NAME *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Street 245/247, Altaona Golf"
                    placeholderTextColor={Colors.textSecondary}
                    value={newName}
                    onChangeText={setNewName}
                  />
                </View>

                {/* Type Selector */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>TYPE *</Text>
                  <TouchableOpacity
                    style={styles.selector}
                    onPress={() => setShowTypePicker(!showTypePicker)}
                  >
                    <Text style={styles.selectorText}>{newType}</Text>
                    <MaterialIcons name="arrow-drop-down" size={24} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  
                  {showTypePicker && (
                    <View style={styles.pickerDropdown}>
                      {COMMUNITY_TYPES.map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[styles.pickerOption, newType === type && styles.pickerOptionSelected]}
                          onPress={() => {
                            setNewType(type);
                            setShowTypePicker(false);
                            // Clear parent if Country selected
                            if (type === 'Country') {
                              setNewParentId(null);
                              setNewParentName('');
                              setAncestryPreview([]);
                            }
                          }}
                        >
                          <Text style={[
                            styles.pickerOptionText,
                            newType === type && styles.pickerOptionTextSelected
                          ]}>
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Parent Selector (not for Country) */}
                {newType !== 'Country' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>SITS INSIDE *</Text>
                    <TouchableOpacity
                      style={styles.selector}
                      onPress={() => setShowParentPicker(!showParentPicker)}
                    >
                      <Text style={[
                        styles.selectorText,
                        !newParentName && styles.selectorPlaceholder
                      ]}>
                        {newParentName || 'Select parent community...'}
                      </Text>
                      <MaterialIcons name="arrow-drop-down" size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>

                    {showParentPicker && (
                      <View style={styles.parentPickerContainer}>
                        <View style={styles.parentSearchBox}>
                          <MaterialIcons name="search" size={18} color={Colors.textSecondary} />
                          <TextInput
                            style={styles.parentSearchInput}
                            placeholder="Search for parent..."
                            placeholderTextColor={Colors.textSecondary}
                            value={parentSearchQuery}
                            onChangeText={searchParentCommunities}
                            autoFocus
                          />
                          {searchingParents && <ActivityIndicator size="small" color={Colors.primary} />}
                        </View>
                        
                        {parentSearchResults.map((community) => (
                          <TouchableOpacity
                            key={community.id}
                            style={styles.parentOption}
                            onPress={() => selectParent(community)}
                          >
                            <Text style={styles.parentOptionName}>{community.name}</Text>
                            <Text style={styles.parentOptionType}>{community.community_type}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {/* Ancestry Path Preview */}
                {(ancestryPreview.length > 0 || newType === 'Country') && (
                  <View style={styles.pathPreview}>
                    <Text style={styles.pathPreviewLabel}>FULL PATH</Text>
                    <Text style={styles.pathPreviewText}>
                      {newType === 'Country' 
                        ? newName || 'Your Country'
                        : [...ancestryPreview.map(p => p.name), newName || 'Your Community'].join(' → ')}
                    </Text>
                  </View>
                )}

                {/* Description (optional) */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>DESCRIPTION (optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="What brings this community together?"
                    placeholderTextColor={Colors.textSecondary}
                    value={newDescription}
                    onChangeText={setNewDescription}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Create Button */}
                <TouchableOpacity
                  style={[styles.createButton, creating && styles.createButtonDisabled]}
                  onPress={handleCreate}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator color={Colors.surface} />
                  ) : (
                    <>
                      <MaterialIcons name="add" size={20} color={Colors.surface} />
                      <Text style={styles.createButtonText}>Create & Join</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.surface,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.surface,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyButtonText: {
    color: Colors.surface,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  typeBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  cardPath: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardStatText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  joinButtonText: {
    color: Colors.surface,
    fontWeight: '600',
    fontSize: 14,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
    marginBottom: 16,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  resultsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  resultMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  resultJoinBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  resultJoinText: {
    color: Colors.surface,
    fontWeight: '600',
    fontSize: 13,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    borderStyle: 'dashed',
  },
  createNewText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectorText: {
    fontSize: 15,
    color: Colors.text,
  },
  selectorPlaceholder: {
    color: Colors.textSecondary,
  },
  pickerDropdown: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerOptionSelected: {
    backgroundColor: Colors.primary + '15',
  },
  pickerOptionText: {
    fontSize: 15,
    color: Colors.text,
  },
  pickerOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  parentPickerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  parentSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    gap: 6,
    marginBottom: 8,
  },
  parentSearchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  parentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  parentOptionName: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  parentOptionType: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  pathPreview: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  pathPreviewLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  pathPreviewText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});
