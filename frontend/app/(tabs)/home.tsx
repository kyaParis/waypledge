import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import api, { Pledge, Wish, Gratitude } from '../../utils/api';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const [recentPledges, setRecentPledges] = useState<Pledge[]>([]);
  const [recentWishes, setRecentWishes] = useState<Wish[]>([]);
  const [recentGratitude, setRecentGratitude] = useState<Gratitude[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [pledgesRes, wishesRes, gratitudeRes] = await Promise.all([
        api.get('/pledges'),
        api.get('/wishes'),
        api.get('/gratitude/wall'),
      ]);
      setRecentPledges(pledgesRes.data.slice(0, 3));
      setRecentWishes(wishesRes.data.slice(0, 3));
      setRecentGratitude(gratitudeRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
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
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Friend'}! 👋</Text>
          </View>
        </View>

        <View style={styles.welcomeCard}>
          <MaterialIcons name="favorite" size={40} color={Colors.accent} />
          <Text style={styles.welcomeText}>
            A community built on mutual support and shared intention
          </Text>
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gratitude Wall</Text>
            <MaterialIcons name="favorite" size={24} color={Colors.accent} />
          </View>
          {recentGratitude.length > 0 ? (
            recentGratitude.map((gratitude) => (
              <View key={gratitude.id} style={styles.gratitudeCard}>
                <Text style={styles.gratitudeMessage}>"{gratitude.message}"</Text>
                <Text style={styles.gratitudeAuthor}>
                  {gratitude.from_user_name} → {gratitude.to_user_name}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No gratitude messages yet</Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
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
  welcomeText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 22,
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
});
