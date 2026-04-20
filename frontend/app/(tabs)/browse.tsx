import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  SafeAreaView,
  Alert,
  Modal,
  ActivityIndicator,
  Pressable,
  AppState,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { Colors } from '../../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import api, { Pledge, Wish, Category } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import ReportModal from '../../components/ReportModal';

type TabType = 'pledges' | 'wishes';

// Radius options in km
const RADIUS_OPTIONS = [10, 25, 50, 100, 250, 0]; // 0 = no limit

// Helper function to format dates
const formatDate = (dateString: string | null | undefined): string | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Helper to get urgency display info
const getUrgencyInfo = (urgency: string | undefined) => {
  switch (urgency) {
    case 'urgent':
      return { label: 'URGENT', color: Colors.error, icon: 'warning' as const };
    case 'flexible':
      return { label: 'Flexible', color: Colors.success, icon: 'all-inclusive' as const };
    default:
      return null; // Don't show badge for 'normal'
  }
};

export default function BrowseScreen() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<TabType>('pledges');
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportItem, setReportItem] = useState<{ type: 'pledge' | 'wish'; id: string; title: string; userId: string; userName: string } | null>(null);
  
  // Connection modal state
  const [connectModalVisible, setConnectModalVisible] = useState(false);
  const [connectItem, setConnectItem] = useState<{ item: Pledge | Wish; type: 'pledge' | 'wish' } | null>(null);
  const [connectMessage, setConnectMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Auto-refresh state
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFocusedRef = useRef(true);
  
  // Location search state
  const [searchLocationText, setSearchLocationText] = useState('');
  const [searchLat, setSearchLat] = useState<number | null>(null);
  const [searchLng, setSearchLng] = useState<number | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(50); // Default 50km
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showRadiusModal, setShowRadiusModal] = useState(false);

  // Get user's current GPS location
  const useMyLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions to use this feature.');
        setIsGettingLocation(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;
      
      // Reverse geocode for display
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const parts = [];
        if (addr.city) parts.push(addr.city);
        if (addr.region) parts.push(addr.region);
        setSearchLocationText(parts.join(', ') || 'My Location');
      } else {
        setSearchLocationText('My Location');
      }
      
      setSearchLat(latitude);
      setSearchLng(longitude);
    } catch (error) {
      Alert.alert('Error', 'Could not get your location.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Search in a typed location - use text matching
  const searchInLocation = async () => {
    if (!searchLocationText.trim()) {
      // Clear location filter
      setLocationFilter('');
      setSearchLat(null);
      setSearchLng(null);
      return;
    }
    
    // Use text-based location filtering instead of geocoding
    setLocationFilter(searchLocationText.trim());
    
    // Also try geocoding for distance-based filtering (may not work on web)
    setIsGettingLocation(true);
    try {
      const results = await Location.geocodeAsync(searchLocationText);
      if (results && results.length > 0) {
        setSearchLat(results[0].latitude);
        setSearchLng(results[0].longitude);
      }
    } catch (error) {
      console.log('Geocoding not available, using text filter only');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Clear location search
  const clearLocationSearch = () => {
    setSearchLocationText('');
    setLocationFilter('');
    setSearchLat(null);
    setSearchLng(null);
  };

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const pledgeParams: any = {
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
      };
      
      const wishParams: any = {
        category: selectedCategory || undefined,
        search: searchQuery || undefined,
      };
      
      // Add location-based search if coordinates are set
      if (searchLat !== null && searchLng !== null) {
        pledgeParams.lat = searchLat;
        pledgeParams.lng = searchLng;
        pledgeParams.radius_km = searchRadius || 10000; // No limit if 0
        
        wishParams.lat = searchLat;
        wishParams.lng = searchLng;
        wishParams.radius_km = searchRadius || 10000;
      } else if (locationFilter) {
        // Fallback to text-based location filter
        pledgeParams.location = locationFilter;
        wishParams.location = locationFilter;
      }
      
      const [pledgesRes, wishesRes, categoriesRes] = await Promise.all([
        api.get('/pledges', { params: pledgeParams }),
        api.get('/wishes', { params: wishParams }),
        api.get('/categories'),
      ]);
      setPledges(pledgesRes.data);
      setWishes(wishesRes.data);
      setCategories(categoriesRes.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  }, [selectedCategory, searchQuery, locationFilter, searchLat, searchLng, searchRadius]);

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
    loadData();
  }, [selectedCategory, searchQuery, locationFilter, searchLat, searchLng, searchRadius]);

  const onRefresh = async () => {
    await loadData(true);
  };

  const handleConnect = (item: Pledge | Wish, type: 'pledge' | 'wish') => {
    if (item.user_id === user?.id) {
      Alert.alert('Notice', 'You cannot connect with your own ' + type);
      return;
    }
    // Open the connect modal
    setConnectItem({ item, type });
    setConnectMessage('');
    setConnectModalVisible(true);
  };

  const sendConnection = async () => {
    console.log('sendConnection called, message:', connectMessage, 'connectItem:', connectItem);
    
    if (!connectItem) {
      console.log('No connectItem');
      Alert.alert('Error', 'No item selected');
      return;
    }
    
    if (!connectMessage.trim()) {
      console.log('Empty message');
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    setSendingMessage(true);
    try {
      console.log('Sending connection request...');
      await api.post('/connections', {
        pledge_id: connectItem.type === 'pledge' ? connectItem.item.id : undefined,
        wish_id: connectItem.type === 'wish' ? connectItem.item.id : undefined,
        receiver_id: connectItem.item.user_id,
        message: connectMessage.trim(),
      });
      console.log('Connection sent successfully');
      setConnectModalVisible(false);
      setConnectItem(null);
      setConnectMessage('');
      Alert.alert('Success', 'Message sent! Check the Messages tab for replies.');
    } catch (error: any) {
      console.log('Error sending connection:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleReport = (item: Pledge | Wish, type: 'pledge' | 'wish') => {
    setReportItem({ type, id: item.id, title: item.title, userId: item.user_id, userName: item.user_name });
    setReportModalVisible(true);
  };

  const items = activeTab === 'pledges' ? pledges : wishes;
  const emptyMessage = activeTab === 'pledges' ? 'No pledges found' : 'No wishes found';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse</Text>
      </View>

      {/* Last Updated indicator with refresh button */}
      <View style={styles.refreshBar}>
        <Text style={styles.lastUpdatedText}>
          Updated {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={() => loadData(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <>
              <MaterialIcons name="refresh" size={18} color={Colors.primary} />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      {/* Location Search with GPS and Radius */}
      <View style={styles.locationSearchContainer}>
        <Text style={styles.searchSectionLabel}>Filter by Location</Text>
        <View style={styles.locationInputRow}>
          <View style={styles.locationInputWrapper}>
            <MaterialIcons name="location-on" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Type a city or country (e.g., London, UK)"
              value={searchLocationText}
              onChangeText={setSearchLocationText}
              onSubmitEditing={searchInLocation}
              returnKeyType="search"
              placeholderTextColor={Colors.textSecondary}
            />
            {searchLocationText && (
              <TouchableOpacity onPress={clearLocationSearch} style={styles.clearButton}>
                <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={styles.gpsButton} 
            onPress={useMyLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <ActivityIndicator size="small" color={Colors.surface} />
            ) : (
              <MaterialIcons name="my-location" size={20} color={Colors.surface} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.searchLocationButton} 
            onPress={searchInLocation}
            disabled={isGettingLocation || !searchLocationText.trim()}
          >
            <MaterialIcons name="search" size={20} color={Colors.surface} />
          </TouchableOpacity>
        </View>
        
        {/* Show active location filter */}
        {locationFilter && locationFilter !== 'Online' && (
          <View style={styles.activeFilterBar}>
            <MaterialIcons name="filter-list" size={16} color={Colors.primary} />
            <Text style={styles.activeFilterText}>
              Showing results matching: "{locationFilter}"
            </Text>
            <TouchableOpacity onPress={clearLocationSearch}>
              <MaterialIcons name="close" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Radius selector */}
        <View style={styles.radiusRow}>
          <Text style={styles.radiusLabel}>Search radius:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.radiusScroll}>
            {RADIUS_OPTIONS.map((radius) => (
              <TouchableOpacity
                key={radius}
                style={[
                  styles.radiusChip,
                  searchRadius === radius && styles.radiusChipActive,
                ]}
                onPress={() => setSearchRadius(radius)}
              >
                <Text style={[
                  styles.radiusChipText,
                  searchRadius === radius && styles.radiusChipTextActive,
                ]}>
                  {radius === 0 ? 'No limit' : `${radius} km`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Show active location indicator */}
        {searchLat !== null && searchLng !== null && (
          <View style={styles.activeLocationBar}>
            <MaterialIcons name="place" size={16} color={Colors.primary} />
            <Text style={styles.activeLocationText}>
              Searching near: {searchLocationText || 'Selected location'}
              {searchRadius > 0 ? ` (within ${searchRadius}km)` : ' (no distance limit)'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.locationQuickFilters}>
        <TouchableOpacity
          style={[
            styles.quickFilterButton,
            locationFilter === 'Online' && styles.quickFilterButtonActive,
          ]}
          onPress={() => setLocationFilter(locationFilter === 'Online' ? '' : 'Online')}
        >
          <MaterialIcons
            name="language"
            size={18}
            color={locationFilter === 'Online' ? Colors.surface : Colors.primary}
          />
          <Text
            style={[
              styles.quickFilterText,
              locationFilter === 'Online' && styles.quickFilterTextActive,
            ]}
          >
            Online Only
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'pledges' && { backgroundColor: Colors.pledgeLight },
          ]}
          onPress={() => setActiveTab('pledges')}
        >
          <MaterialIcons
            name="card-giftcard"
            size={20}
            color={activeTab === 'pledges' ? Colors.pledgeDark : Colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'pledges' && { color: Colors.pledgeDark, fontWeight: '600' },
            ]}
          >
            Pledges
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'wishes' && { backgroundColor: Colors.wishLight },
          ]}
          onPress={() => setActiveTab('wishes')}
        >
          <MaterialIcons
            name="star"
            size={20}
            color={activeTab === 'wishes' ? Colors.wishDark : Colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'wishes' && { color: Colors.wishDark, fontWeight: '600' },
            ]}
          >
            Wishes
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            !selectedCategory && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory('')}
        >
          <Text
            style={[
              styles.categoryChipText,
              !selectedCategory && styles.categoryChipTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.name && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category.name)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category.name && styles.categoryChipTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Helpful tip at top */}
        <View style={styles.tipBox}>
          <MaterialIcons name="lightbulb" size={18} color={Colors.accent} />
          <Text style={styles.tipText}>
            Tap <Text style={styles.tipBold}>Connect</Text> on any card to send a message. Check the <Text style={styles.tipBold}>Messages</Text> tab to see replies!
          </Text>
        </View>

        {items.length > 0 ? (
          items.map((item) => (
            <View
              key={item.id}
              style={[
                styles.card,
                {
                  borderLeftColor:
                    activeTab === 'pledges' ? Colors.pledgeDark : Colors.wishDark,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardAuthor}>by {item.user_name}</Text>
                </View>
                <View
                  style={[
                    styles.categoryBadge,
                    {
                      backgroundColor:
                        activeTab === 'pledges' ? Colors.pledgeLight : Colors.wishLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryBadgeText,
                      {
                        color:
                          activeTab === 'pledges' ? Colors.pledgeDark : Colors.wishDark,
                      },
                    ]}
                  >
                    {item.category}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardDescription}>{item.description}</Text>

              {/* Display image if available */}
              {item.image && item.image.startsWith('http') && (
                <Image
                  source={{ uri: item.image }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              )}

              {/* Only show "Online" indicator, hide specific locations for privacy */}
              {item.location === 'Online' && (
                <View style={styles.locationContainer}>
                  <MaterialIcons
                    name="language"
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={[
                    styles.locationText,
                    { color: Colors.primary, fontWeight: '600' }
                  ]}>
                    Online
                  </Text>
                </View>
              )}

              {item.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {item.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Urgency Badge & Timing Info */}
              {activeTab === 'wishes' && (
                <View style={styles.timingContainer}>
                  {getUrgencyInfo((item as Wish).urgency) && (
                    <View style={[
                      styles.urgencyBadge,
                      { backgroundColor: getUrgencyInfo((item as Wish).urgency)!.color }
                    ]}>
                      <MaterialIcons 
                        name={getUrgencyInfo((item as Wish).urgency)!.icon} 
                        size={14} 
                        color={Colors.surface} 
                      />
                      <Text style={styles.urgencyBadgeText}>
                        {getUrgencyInfo((item as Wish).urgency)!.label}
                      </Text>
                    </View>
                  )}
                  {(item as Wish).needed_by && (
                    <View style={styles.dateInfo}>
                      <MaterialIcons name="event" size={14} color={Colors.textSecondary} />
                      <Text style={styles.dateText}>
                        Needed by {formatDate((item as Wish).needed_by)}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {activeTab === 'pledges' && (item as Pledge).available_until && (
                <View style={styles.timingContainer}>
                  <View style={styles.dateInfo}>
                    <MaterialIcons name="schedule" size={14} color={Colors.textSecondary} />
                    <Text style={styles.dateText}>
                      Available until {formatDate((item as Pledge).available_until)}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[
                    styles.connectButton,
                    {
                      backgroundColor:
                        activeTab === 'pledges' ? Colors.pledgeMedium : Colors.wishMedium,
                    },
                  ]}
                  onPress={() => handleConnect(item, activeTab === 'pledges' ? 'pledge' : 'wish')}
                >
                  <MaterialIcons name="chat" size={18} color={Colors.surface} />
                  <Text style={styles.connectButtonText}>
                    {activeTab === 'pledges' ? 'Ask About This' : 'Offer to Help'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.reportButton}
                  onPress={() => handleReport(item, activeTab === 'pledges' ? 'pledge' : 'wish')}
                >
                  <MaterialIcons name="flag" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <ReportModal
        visible={reportModalVisible}
        onClose={() => {
          setReportModalVisible(false);
          setReportItem(null);
        }}
        reportType={reportItem?.type || 'pledge'}
        itemId={reportItem?.id}
        itemTitle={reportItem?.title}
        userId={reportItem?.userId}
        userName={reportItem?.userName}
      />

      {/* Connect Modal */}
      <Modal
        visible={connectModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setConnectModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          setConnectModalVisible(false);
        }}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidContainer}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
            >
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {connectItem?.type === 'pledge' ? 'Ask About This Pledge' : 'Offer to Help'}
                    </Text>
                    <TouchableOpacity onPress={() => setConnectModalVisible(false)}>
                      <MaterialIcons name="close" size={24} color={Colors.text} />
                    </TouchableOpacity>
                  </View>
                  
                  {connectItem && (
                    <View style={styles.modalItemInfo}>
                      <Text style={styles.modalItemTitle}>{connectItem.item.title}</Text>
                      <Text style={styles.modalItemUser}>by {connectItem.item.user_name}</Text>
                    </View>
                  )}
                  
                  <Text style={styles.modalLabel}>Your message:</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={connectItem?.type === 'pledge' 
                      ? "Hi! I'm interested in your pledge..."
                      : "Hi! I'd like to help with this..."
                    }
                    value={connectMessage}
                    onChangeText={setConnectMessage}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={Colors.textSecondary}
                  />
                  
                  <View style={styles.modalButtons}>
                    <Pressable 
                      style={({ pressed }) => [
                        styles.modalCancelButton,
                        pressed && { opacity: 0.7 }
                      ]}
                      onPress={() => setConnectModalVisible(false)}
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </Pressable>
                    
                    <Pressable 
                      style={({ pressed }) => [
                        styles.modalSendButton,
                        { backgroundColor: connectItem?.type === 'pledge' ? Colors.pledgeMedium : Colors.wishMedium },
                        (!connectMessage.trim() || sendingMessage) && { opacity: 0.5 },
                        pressed && { opacity: 0.8 }
                      ]}
                      onPress={() => {
                        console.log('Send button pressed');
                        Keyboard.dismiss();
                        sendConnection();
                      }}
                      disabled={sendingMessage || !connectMessage.trim()}
                    >
                      {sendingMessage ? (
                        <ActivityIndicator color={Colors.surface} size="small" />
                      ) : (
                        <>
                          <MaterialIcons name="send" size={18} color={Colors.surface} />
                          <Text style={styles.modalSendText}>Send Message</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
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
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  clearButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    gap: 8,
  },
  tabText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  categoriesScroll: {
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: Colors.text,
  },
  categoryChipTextActive: {
    color: Colors.surface,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  cardAuthor: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: Colors.primary,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  connectButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  reportButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  locationQuickFilters: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  quickFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: 6,
    alignSelf: 'flex-start',
  },
  quickFilterButtonActive: {
    backgroundColor: Colors.primary,
  },
  quickFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  quickFilterTextActive: {
    color: Colors.surface,
  },
  timingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 4,
  },
  urgencyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.surface,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.accent + '15',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  tipBold: {
    fontWeight: '700',
    color: Colors.primary,
  },
  // Connect Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidContainer: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  modalItemInfo: {
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  modalItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  modalItemUser: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modalSendButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalSendText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.surface,
  },
  refreshBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastUpdatedText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.background,
    gap: 4,
  },
  refreshButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.primary,
  },
  locationSearchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  searchSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  activeFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  activeFilterText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  locationInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  locationInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gpsButton: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchLocationButton: {
    backgroundColor: Colors.secondary,
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  radiusLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  radiusScroll: {
    flex: 1,
  },
  radiusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  radiusChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  radiusChipText: {
    fontSize: 12,
    color: Colors.text,
  },
  radiusChipTextActive: {
    color: Colors.surface,
    fontWeight: '600',
  },
  activeLocationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: Colors.primary + '15',
    borderRadius: 8,
  },
  activeLocationText: {
    fontSize: 12,
    color: Colors.primary,
    flex: 1,
  },
});
