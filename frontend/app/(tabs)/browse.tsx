import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import api, { Pledge, Wish, Category } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

type TabType = 'pledges' | 'wishes';

export default function BrowseScreen() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<TabType>('pledges');
  const [pledges, setPledges] = useState<Pledge[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [pledgesRes, wishesRes, categoriesRes] = await Promise.all([
        api.get('/pledges', {
          params: {
            category: selectedCategory || undefined,
            search: searchQuery || undefined,
          },
        }),
        api.get('/wishes', {
          params: {
            category: selectedCategory || undefined,
            search: searchQuery || undefined,
          },
        }),
        api.get('/categories'),
      ]);
      setPledges(pledgesRes.data);
      setWishes(wishesRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleConnect = async (item: Pledge | Wish, type: 'pledge' | 'wish') => {
    if (item.user_id === user?.id) {
      Alert.alert('Notice', 'You cannot connect with your own ' + type);
      return;
    }

    Alert.prompt(
      'Connect',
      `Send a message to ${item.user_name}`,
      async (message) => {
        if (message) {
          try {
            await api.post('/connections', {
              pledge_id: type === 'pledge' ? item.id : undefined,
              wish_id: type === 'wish' ? item.id : undefined,
              receiver_id: item.user_id,
              message: message,
            });
            Alert.alert('Success', 'Connection request sent!');
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.detail || 'Failed to connect');
          }
        }
      },
      'plain-text',
      '',
      'default'
    );
  };

  const items = activeTab === 'pledges' ? pledges : wishes;
  const emptyMessage = activeTab === 'pledges' ? 'No pledges found' : 'No wishes found';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Browse</Text>
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

              {item.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {item.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

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
                <Text style={styles.connectButtonText}>Connect</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        )}

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
  connectButton: {
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
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
    fontStyle: 'italic',
  },
});
