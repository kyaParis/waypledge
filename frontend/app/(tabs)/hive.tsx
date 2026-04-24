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
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { router } from 'expo-router';
import api from '../../utils/api';
import * as Location from 'expo-location';

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
  const [countryHives, setCountryHives] = useState<Hive[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'my-hives'>('discover');
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  // Create hive form - simplified hierarchy
  const [newHiveName, setNewHiveName] = useState('');
  const [newHiveDescription, setNewHiveDescription] = useState('');
  const [newHiveVision, setNewHiveVision] = useState('');
  const [newHiveParentId, setNewHiveParentId] = useState<string | null>(null);
  const [showParentPicker, setShowParentPicker] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Hierarchy fields
  const [hierarchyCountry, setHierarchyCountry] = useState('');
  const [hierarchyCity, setHierarchyCity] = useState('');
  const [hierarchyTown, setHierarchyTown] = useState('');
  const [hierarchyNeighborhood, setHierarchyNeighborhood] = useState('');
  const [communityType, setCommunityType] = useState<'country' | 'city' | 'town' | 'neighborhood' | 'street'>('neighborhood');
  
  // Real-time duplicate checking
  const [existingMatches, setExistingMatches] = useState<any[]>([]);
  const [checkingName, setCheckingName] = useState(false);
  const nameCheckTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Existing parent communities to auto-join
  const [existingParents, setExistingParents] = useState<any[]>([]);
  const [parentsToJoin, setParentsToJoin] = useState<Set<string>>(new Set());
  const [checkingParents, setCheckingParents] = useState(false);
  const parentCheckTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadHives = useCallback(async () => {
    try {
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (locationFilter) params.location = locationFilter;
      const [hivesRes, countryRes] = await Promise.all([
        api.get('/hives', { params }),
        api.get('/hives', { params: { country_only: true } })
      ]);
      setHives(hivesRes.data);
      setCountryHives(countryRes.data);
    } catch (error) {
      console.error('Error loading hives:', error);
    }
  }, [searchQuery, locationFilter]);

  const loadMyHives = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/hives/my/memberships');
      setMyHives(response.data);
    } catch (error) {
      console.error('Error loading my hives:', error);
    }
  }, [isAuthenticated]);

  // Near Me location filter
  const handleNearMe = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Permission', 'Please enable location to find hives near you.');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      if (geocode.length > 0) {
        const place = geocode[0];
        // Use city/region for filtering
        const locationStr = place.city || place.region || place.country || '';
        setLocationFilter(locationStr);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Could not get your location. Please try again.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const clearLocationFilter = () => {
    setLocationFilter(null);
  };

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
      alert('Please log in to join this community');
      return;
    }
    try {
      await api.post(`/hives/${hiveId}/join`);
      alert('Welcome to the community!');
      await loadMyHives();
      await loadHives();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to join community');
    }
  };

  const handleLeaveHive = async (hiveId: string) => {
    try {
      await api.post(`/hives/${hiveId}/leave`);
      alert('You have left the community');
      await loadMyHives();
      await loadHives();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to leave community');
    }
  };

  const [similarHives, setSimilarHives] = useState<any[]>([]);
  const [showSimilarWarning, setShowSimilarWarning] = useState(false);

  const resetCreateForm = () => {
    setNewHiveName('');
    setNewHiveDescription('');
    setNewHiveVision('');
    setNewHiveParentId(null);
    setHierarchyCountry('');
    setHierarchyCity('');
    setHierarchyTown('');
    setHierarchyNeighborhood('');
    setCommunityType('neighborhood');
    setShowSimilarWarning(false);
    setSimilarHives([]);
    setExistingMatches([]);
    setExistingParents([]);
    setParentsToJoin(new Set());
  };

  // Check for existing parent communities as user fills in hierarchy
  const checkExistingParents = async () => {
    const hierarchy = {
      country: hierarchyCountry.trim() || null,
      city: hierarchyCity.trim() || null,
      town: hierarchyTown.trim() || null,
      neighborhood: hierarchyNeighborhood.trim() || null,
    };
    
    // Only check if we have at least one hierarchy field filled
    if (!hierarchy.country && !hierarchy.city && !hierarchy.town && !hierarchy.neighborhood) {
      setExistingParents([]);
      setParentsToJoin(new Set());
      return;
    }
    
    try {
      setCheckingParents(true);
      const res = await api.post('/hives/check-existing-parents', hierarchy);
      const parents = res.data.will_auto_join || [];
      setExistingParents(parents);
      // Default: all selected
      setParentsToJoin(new Set(parents.map((p: any) => p.id)));
    } catch (error) {
      console.error('Error checking existing parents:', error);
    } finally {
      setCheckingParents(false);
    }
  };

  // Toggle join/don't join for a parent community
  const toggleParentJoin = (parentId: string) => {
    setParentsToJoin(prev => {
      const newSet = new Set(prev);
      if (newSet.has(parentId)) {
        newSet.delete(parentId);
      } else {
        newSet.add(parentId);
      }
      return newSet;
    });
  };

  // Debounced hierarchy change handler
  const handleHierarchyChange = (field: string, value: string) => {
    // Update the appropriate field
    switch (field) {
      case 'country': setHierarchyCountry(value); break;
      case 'city': setHierarchyCity(value); break;
      case 'town': setHierarchyTown(value); break;
      case 'neighborhood': setHierarchyNeighborhood(value); break;
    }
    
    // Clear previous timeout
    if (parentCheckTimeout.current) {
      clearTimeout(parentCheckTimeout.current);
    }
    
    // Set new timeout for debounced check
    parentCheckTimeout.current = setTimeout(() => {
      checkExistingParents();
    }, 800);
  };

  // Real-time check for existing communities as user types
  const checkForExistingCommunities = async (name: string) => {
    if (name.length < 3) {
      setExistingMatches([]);
      return;
    }
    
    try {
      setCheckingName(true);
      const res = await api.get(`/hives?search=${encodeURIComponent(name)}&limit=5`);
      
      // Filter for close matches (case-insensitive partial match)
      const matches = res.data.filter((h: any) => {
        const hiveName = h.name.toLowerCase();
        const searchName = name.toLowerCase();
        // Match if names contain each other or have significant overlap
        return hiveName.includes(searchName) || 
               searchName.includes(hiveName) ||
               hiveName.split(' ').some((word: string) => searchName.includes(word) && word.length > 3);
      });
      
      setExistingMatches(matches);
    } catch (error) {
      console.error('Error checking for existing communities:', error);
    } finally {
      setCheckingName(false);
    }
  };

  // Debounced name change handler
  const handleNameChange = (text: string) => {
    setNewHiveName(text);
    
    // Clear previous timeout
    if (nameCheckTimeout.current) {
      clearTimeout(nameCheckTimeout.current);
    }
    
    // Set new timeout for debounced search
    nameCheckTimeout.current = setTimeout(() => {
      checkForExistingCommunities(text);
    }, 500);
  };

  // Join existing community from the matches
  const handleJoinExisting = async (hiveId: string, hiveName: string) => {
    try {
      await api.post(`/hives/${hiveId}/join`);
      alert(`You've joined ${hiveName}!`);
      setShowCreateModal(false);
      resetCreateForm();
      await Promise.all([loadHives(), loadMyHives()]);
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to join');
    }
  };

  // Build location string from hierarchy
  const buildLocationString = () => {
    const parts = [];
    if (hierarchyNeighborhood) parts.push(hierarchyNeighborhood);
    if (hierarchyTown) parts.push(hierarchyTown);
    if (hierarchyCity) parts.push(hierarchyCity);
    if (hierarchyCountry) parts.push(hierarchyCountry);
    return parts.join(', ');
  };

  const handleCreateHive = async (force: boolean = false) => {
    if (!newHiveName.trim() || !newHiveDescription.trim()) {
      alert('Please fill in name and description');
      return;
    }
    
    if (!hierarchyCountry.trim()) {
      alert('Please select or enter your country');
      return;
    }

    try {
      setCreating(true);
      
      const locationString = buildLocationString();
      
      const params = force ? '?force=true' : '';
      const payload: any = {
        name: newHiveName.trim(),
        description: newHiveDescription.trim(),
        location: locationString,
        vision: newHiveVision.trim(),
        community_type: communityType,
        hierarchy: {
          country: hierarchyCountry.trim(),
          city: hierarchyCity.trim() || null,
          town: hierarchyTown.trim() || null,
          neighborhood: hierarchyNeighborhood.trim() || null,
        },
        join_parent_ids: Array.from(parentsToJoin), // Selected parent communities to join
      };
      if (newHiveParentId) {
        payload.parent_hive_id = newHiveParentId;
      }
      
      await api.post(`/hives${params}`, payload);
      
      // Reset form
      resetCreateForm();
      setShowCreateModal(false);
      
      const joinedCount = parentsToJoin.size;
      const joinMsg = joinedCount > 0 ? ` You've also joined ${joinedCount} parent communit${joinedCount === 1 ? 'y' : 'ies'}.` : '';
      alert(`Community created! You are now the founder.${joinMsg}`);
      await Promise.all([loadHives(), loadMyHives()]);
    } catch (error: any) {
      // Check if it's a "similar hives exist" warning (409 Conflict)
      if (error.response?.status === 409) {
        const detail = error.response?.data?.detail;
        if (detail?.similar) {
          setSimilarHives(detail.similar);
          setShowSimilarWarning(true);
        } else {
          alert('Similar hives exist in this area. Please check existing hives first.');
        }
      } else {
        alert(error.response?.data?.detail || 'Failed to create hive');
      }
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
                <Text style={styles.joinButtonText}>Join Community</Text>
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
          <Text style={styles.loadingText}>Loading communities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Communities</Text>
        <Text style={styles.subtitle}>Connected Local Networks</Text>
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
            My Communities ({myHives.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'discover' && (
        <>
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search communities by name or location..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={loadHives}
            />
          </View>
          
          {/* Filter buttons row */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterButton, locationFilter && styles.filterButtonActive]}
              onPress={locationFilter ? clearLocationFilter : handleNearMe}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <MaterialIcons 
                    name={locationFilter ? "close" : "near-me"} 
                    size={18} 
                    color={locationFilter ? Colors.surface : Colors.primary} 
                  />
                  <Text style={[styles.filterButtonText, locationFilter && styles.filterButtonTextActive]}>
                    {locationFilter ? locationFilter : 'Near Me'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            {isAuthenticated && (
              <TouchableOpacity
                style={styles.createHiveButton}
                onPress={() => setShowCreateModal(true)}
              >
                <MaterialIcons name="add" size={18} color={Colors.surface} />
                <Text style={styles.createHiveButtonText}>Create Community</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
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
                <Text style={styles.emptyTitle}>No Communities Found</Text>
                <Text style={styles.emptyText}>
                  {locationFilter 
                    ? `No communities found near ${locationFilter}. Be the first to create one!`
                    : 'Be the first to create a local community and start building your network!'
                  }
                </Text>
                {isAuthenticated && (
                  <TouchableOpacity
                    style={styles.emptyCreateButton}
                    onPress={() => setShowCreateModal(true)}
                  >
                    <MaterialIcons name="add" size={20} color={Colors.surface} />
                    <Text style={styles.emptyCreateButtonText}>Create a Community</Text>
                  </TouchableOpacity>
                )}
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
                <Text style={styles.emptyTitle}>No Communities Joined</Text>
                <Text style={styles.emptyText}>
                  Discover and join communities to connect with like-minded people!
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Connect Your Platform Link */}
      <TouchableOpacity 
        style={styles.federateLink}
        onPress={() => router.push('/federate')}
      >
        <MaterialIcons name="hub" size={20} color={Colors.primary} />
        <Text style={styles.federateLinkText}>Connect your platform to the network</Text>
        <MaterialIcons name="arrow-forward" size={18} color={Colors.primary} />
      </TouchableOpacity>

      {isAuthenticated && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <MaterialIcons name="add" size={28} color={Colors.surface} />
        </TouchableOpacity>
      )}

      {/* Create Community Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => { resetCreateForm(); setShowCreateModal(false); }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create a Community</Text>
              <TouchableOpacity onPress={() => { resetCreateForm(); setShowCreateModal(false); }}>
                <MaterialIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSubtitle}>
                Communities nest automatically - your street is part of your town, city, and country
              </Text>

              {/* Community Type Selector */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>What type of community?</Text>
                <View style={styles.typeSelector}>
                  {[
                    { key: 'street', label: 'Street/Block', icon: 'home' },
                    { key: 'neighborhood', label: 'Neighborhood', icon: 'holiday-village' },
                    { key: 'town', label: 'Town/Area', icon: 'location-city' },
                    { key: 'city', label: 'City', icon: 'apartment' },
                  ].map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.typeOption,
                        communityType === type.key && styles.typeOptionSelected
                      ]}
                      onPress={() => setCommunityType(type.key as any)}
                    >
                      <MaterialIcons 
                        name={type.icon as any} 
                        size={20} 
                        color={communityType === type.key ? Colors.surface : Colors.textSecondary} 
                      />
                      <Text style={[
                        styles.typeOptionText,
                        communityType === type.key && styles.typeOptionTextSelected
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Community Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Community Name *</Text>
                <View style={styles.nameInputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder={
                      communityType === 'street' ? "e.g., Street 246/247" :
                      communityType === 'neighborhood' ? "e.g., Altaona Golf Resort" :
                      communityType === 'town' ? "e.g., Banos y Mendigo" :
                      "e.g., Murcia"
                    }
                    placeholderTextColor={Colors.textSecondary}
                    value={newHiveName}
                    onChangeText={handleNameChange}
                  />
                  {checkingName && (
                    <ActivityIndicator size="small" color={Colors.primary} style={styles.nameCheckIndicator} />
                  )}
                </View>
                
                {/* Existing Matches Warning */}
                {existingMatches.length > 0 && (
                  <View style={styles.existingMatchesBox}>
                    <View style={styles.existingMatchesHeader}>
                      <MaterialIcons name="info" size={18} color={Colors.accent} />
                      <Text style={styles.existingMatchesTitle}>Similar communities exist!</Text>
                    </View>
                    <Text style={styles.existingMatchesHint}>
                      Consider joining an existing community instead of creating a duplicate:
                    </Text>
                    {existingMatches.map((match) => (
                      <View key={match.id} style={styles.existingMatchCard}>
                        <View style={styles.existingMatchInfo}>
                          <Text style={styles.existingMatchName}>{match.name}</Text>
                          <Text style={styles.existingMatchLocation}>{match.location}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.joinExistingButton}
                          onPress={() => handleJoinExisting(match.id, match.name)}
                        >
                          <Text style={styles.joinExistingText}>Join</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                    <Text style={styles.orContinueText}>
                      Or continue below if this is truly a new community
                    </Text>
                  </View>
                )}
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="What brings this community together?"
                  placeholderTextColor={Colors.textSecondary}
                  value={newHiveDescription}
                  onChangeText={setNewHiveDescription}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Hierarchy Section */}
              <View style={styles.hierarchySection}>
                <View style={styles.hierarchyHeader}>
                  <MaterialIcons name="account-tree" size={20} color={Colors.primary} />
                  <Text style={styles.hierarchyTitle}>Where is this community?</Text>
                </View>
                <Text style={styles.hierarchyHint}>
                  Fill in from largest to smallest. You'll automatically join all parent communities.
                </Text>

                {/* Country */}
                <View style={styles.hierarchyField}>
                  <View style={styles.hierarchyIcon}>
                    <MaterialIcons name="public" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.hierarchyInput}>
                    <Text style={styles.hierarchyLabel}>Country *</Text>
                    <TextInput
                      style={styles.hierarchyTextInput}
                      placeholder="e.g., Spain"
                      placeholderTextColor={Colors.textSecondary}
                      value={hierarchyCountry}
                      onChangeText={(text) => handleHierarchyChange('country', text)}
                    />
                  </View>
                </View>

                {/* City */}
                <View style={styles.hierarchyField}>
                  <View style={styles.hierarchyIcon}>
                    <MaterialIcons name="apartment" size={18} color={communityType !== 'city' ? Colors.primary : Colors.textSecondary} />
                  </View>
                  <View style={styles.hierarchyInput}>
                    <Text style={styles.hierarchyLabel}>City/Region {communityType !== 'city' ? '' : '(this is your community)'}</Text>
                    <TextInput
                      style={styles.hierarchyTextInput}
                      placeholder="e.g., Murcia"
                      placeholderTextColor={Colors.textSecondary}
                      value={hierarchyCity}
                      onChangeText={(text) => handleHierarchyChange('city', text)}
                      editable={communityType !== 'city'}
                    />
                  </View>
                </View>

                {/* Town - only show for town, neighborhood, street */}
                {['town', 'neighborhood', 'street'].includes(communityType) && (
                  <View style={styles.hierarchyField}>
                    <View style={styles.hierarchyIcon}>
                      <MaterialIcons name="location-city" size={18} color={communityType !== 'town' ? Colors.primary : Colors.textSecondary} />
                    </View>
                    <View style={styles.hierarchyInput}>
                      <Text style={styles.hierarchyLabel}>Town/Area {communityType === 'town' ? '(this is your community)' : '(optional)'}</Text>
                      <TextInput
                        style={styles.hierarchyTextInput}
                        placeholder="e.g., Banos y Mendigo"
                        placeholderTextColor={Colors.textSecondary}
                        value={hierarchyTown}
                        onChangeText={(text) => handleHierarchyChange('town', text)}
                        editable={communityType !== 'town'}
                      />
                    </View>
                  </View>
                )}

                {/* Neighborhood - only show for neighborhood, street */}
                {['neighborhood', 'street'].includes(communityType) && (
                  <View style={styles.hierarchyField}>
                    <View style={styles.hierarchyIcon}>
                      <MaterialIcons name="holiday-village" size={18} color={communityType !== 'neighborhood' ? Colors.primary : Colors.textSecondary} />
                    </View>
                    <View style={styles.hierarchyInput}>
                      <Text style={styles.hierarchyLabel}>Neighborhood/Resort {communityType === 'neighborhood' ? '(this is your community)' : '(optional)'}</Text>
                      <TextInput
                        style={styles.hierarchyTextInput}
                        placeholder="e.g., Altaona Golf Resort"
                        placeholderTextColor={Colors.textSecondary}
                        value={hierarchyNeighborhood}
                        onChangeText={(text) => handleHierarchyChange('neighborhood', text)}
                        editable={communityType !== 'neighborhood'}
                      />
                    </View>
                  </View>
                )}
                
                {/* Existing Parent Communities - Optional Join */}
                {existingParents.length > 0 && (
                  <View style={styles.autoJoinBox}>
                    <View style={styles.autoJoinHeader}>
                      <MaterialIcons name="groups" size={20} color={Colors.primary} />
                      <Text style={styles.autoJoinTitle}>Existing communities found:</Text>
                    </View>
                    <Text style={styles.autoJoinHint}>
                      Choose which communities you'd like to join:
                    </Text>
                    {existingParents.map((parent) => (
                      <TouchableOpacity 
                        key={parent.id} 
                        style={[
                          styles.autoJoinItem,
                          parentsToJoin.has(parent.id) && styles.autoJoinItemSelected
                        ]}
                        onPress={() => toggleParentJoin(parent.id)}
                      >
                        <View style={[
                          styles.autoJoinCheckbox,
                          parentsToJoin.has(parent.id) && styles.autoJoinCheckboxSelected
                        ]}>
                          {parentsToJoin.has(parent.id) && (
                            <MaterialIcons name="check" size={16} color={Colors.surface} />
                          )}
                        </View>
                        <View style={styles.autoJoinInfo}>
                          <Text style={styles.autoJoinName}>{parent.name}</Text>
                          {parent.searched_for && parent.searched_for.toLowerCase() !== parent.name.toLowerCase() && (
                            <Text style={styles.autoJoinMatchHint}>
                              (matched from "{parent.searched_for}")
                            </Text>
                          )}
                          <Text style={styles.autoJoinMeta}>
                            {parent.member_count} member{parent.member_count !== 1 ? 's' : ''} • {parent.level}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                    {parentsToJoin.size > 0 && (
                      <Text style={styles.autoJoinSummary}>
                        Will join {parentsToJoin.size} communit{parentsToJoin.size === 1 ? 'y' : 'ies'} when created
                      </Text>
                    )}
                  </View>
                )}
                
                {checkingParents && (
                  <View style={styles.checkingParents}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.checkingParentsText}>Checking existing communities...</Text>
                  </View>
                )}
              </View>

              {/* Preview */}
              {hierarchyCountry && (
                <View style={styles.previewSection}>
                  <Text style={styles.previewTitle}>Your community path:</Text>
                  <View style={styles.previewPath}>
                    <Text style={styles.previewItem}>🇪🇸 {hierarchyCountry}</Text>
                    {hierarchyCity && <Text style={styles.previewArrow}>↳</Text>}
                    {hierarchyCity && <Text style={styles.previewItem}>🏙️ {hierarchyCity}</Text>}
                    {hierarchyTown && <Text style={styles.previewArrow}>↳</Text>}
                    {hierarchyTown && <Text style={styles.previewItem}>🏘️ {hierarchyTown}</Text>}
                    {hierarchyNeighborhood && <Text style={styles.previewArrow}>↳</Text>}
                    {hierarchyNeighborhood && <Text style={styles.previewItem}>🏡 {hierarchyNeighborhood}</Text>}
                    <Text style={styles.previewArrow}>↳</Text>
                    <Text style={styles.previewItemHighlight}>✨ {newHiveName || 'Your Community'}</Text>
                  </View>
                </View>
              )}

              {/* Vision (optional) */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Vision (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="What does this community stand for?"
                  placeholderTextColor={Colors.textSecondary}
                  value={newHiveVision}
                  onChangeText={setNewHiveVision}
                />
              </View>

              <View style={styles.pledgeReminder}>
                <MaterialIcons name="shield" size={20} color={Colors.primary} />
                <Text style={styles.pledgeText}>
                  By creating a community, you commit to the Do No Harm Pledge
                </Text>
              </View>

              {/* Similar Communities Warning */}
              {showSimilarWarning && similarHives.length > 0 && (
                <View style={styles.warningBox}>
                  <View style={styles.warningHeader}>
                    <MaterialIcons name="warning" size={24} color={Colors.accent} />
                    <Text style={styles.warningTitle}>Similar Communities Exist</Text>
                  </View>
                  <Text style={styles.warningText}>
                    We found existing communities in this area. Consider joining one instead:
                  </Text>
                  {similarHives.map((name, index) => (
                    <Text key={index} style={styles.similarHiveName}>• {name}</Text>
                  ))}
                  <View style={styles.warningButtons}>
                    <TouchableOpacity
                      style={styles.cancelWarningButton}
                      onPress={() => {
                        setShowSimilarWarning(false);
                        setShowCreateModal(false);
                      }}
                    >
                      <Text style={styles.cancelWarningText}>Browse Existing</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.forceCreateButton}
                      onPress={() => handleCreateHive(true)}
                      disabled={creating}
                    >
                      {creating ? (
                        <ActivityIndicator color={Colors.surface} size="small" />
                      ) : (
                        <Text style={styles.forceCreateText}>Create Anyway</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {!showSimilarWarning && (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => handleCreateHive(false)}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator color={Colors.surface} />
                  ) : (
                    <>
                      <MaterialIcons name="groups" size={20} color={Colors.surface} />
                      <Text style={styles.submitButtonText}>Create Community</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <View style={styles.verificationNote}>
                <MaterialIcons name="info-outline" size={16} color={Colors.textSecondary} />
                <Text style={styles.verificationNoteText}>
                  New communities may need verification to appear in search results.
                </Text>
              </View>
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  filterButtonTextActive: {
    color: Colors.surface,
  },
  createHiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 6,
  },
  createHiveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.surface,
  },
  emptyCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
  },
  emptyCreateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.surface,
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
  federateLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  federateLinkText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
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
    marginBottom: 20,
  },
  submitButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: Colors.accent + '15',
    borderWidth: 2,
    borderColor: Colors.accent,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  warningText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 12,
  },
  similarHiveName: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 8,
    marginBottom: 4,
  },
  warningButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelWarningButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelWarningText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  forceCreateButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.accent,
    alignItems: 'center',
  },
  forceCreateText: {
    fontSize: 14,
    color: Colors.surface,
    fontWeight: '600',
  },
  verificationNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 8,
    marginBottom: 40,
  },
  verificationNoteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  parentPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  parentPickerText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  parentPickerPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  parentPickerList: {
    marginTop: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 200,
    overflow: 'hidden',
  },
  parentPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  parentPickerItemSelected: {
    backgroundColor: Colors.primary + '15',
  },
  parentPickerItemText: {
    fontSize: 15,
    color: Colors.text,
  },
  parentPickerItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  parentHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  // Hierarchy form styles
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  typeOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeOptionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  typeOptionTextSelected: {
    color: Colors.surface,
  },
  hierarchySection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  hierarchyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  hierarchyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  hierarchyHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  hierarchyField: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  hierarchyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  hierarchyInput: {
    flex: 1,
  },
  hierarchyLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  hierarchyTextInput: {
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.background,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewSection: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 10,
  },
  previewPath: {
    paddingLeft: 4,
  },
  previewItem: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
    marginLeft: 8,
  },
  previewArrow: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 16,
    marginBottom: 2,
  },
  previewItemHighlight: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 8,
  },
  // Real-time name checking styles
  nameInputContainer: {
    position: 'relative',
  },
  nameCheckIndicator: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  existingMatchesBox: {
    backgroundColor: Colors.accent + '15',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  existingMatchesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  existingMatchesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
  },
  existingMatchesHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
    lineHeight: 18,
  },
  existingMatchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  existingMatchInfo: {
    flex: 1,
  },
  existingMatchName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  existingMatchLocation: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  joinExistingButton: {
    backgroundColor: Colors.success,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  joinExistingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.surface,
  },
  orContinueText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 4,
  },
  // Auto-join styles
  autoJoinBox: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  autoJoinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  autoJoinTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  autoJoinHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  autoJoinItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  autoJoinItemSelected: {
    borderColor: Colors.success,
    backgroundColor: Colors.success + '10',
  },
  autoJoinCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  autoJoinCheckboxSelected: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  autoJoinInfo: {
    flex: 1,
  },
  autoJoinName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  autoJoinMatchHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  autoJoinMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  autoJoinSummary: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  checkingParents: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  checkingParentsText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
