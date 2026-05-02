import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '../../store/authStore';
import { useEffect, useState } from 'react';
import api, { getPendingGratitude } from '../../utils/api';

export default function TabsLayout() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.is_admin || false;
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingGratitudeCount, setPendingGratitudeCount] = useState(0);

  // Check for unread messages and pending gratitude periodically
  useEffect(() => {
    const checkNotifications = async () => {
      if (!user) return;
      try {
        // Check unread messages
        const unreadResponse = await api.get('/connections/unread-count');
        setUnreadCount(unreadResponse.data.count || 0);
        
        // Check pending gratitude
        const pendingGratitude = await getPendingGratitude();
        setPendingGratitudeCount(pendingGratitude.length || 0);
      } catch (error) {
        // Silently fail - endpoints might not exist yet
      }
    };

    checkNotifications();
    // Check every 30 seconds
    const interval = setInterval(checkNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="explore" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <View>
              <MaterialIcons name="chat" size={size} color={color} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <View>
              <MaterialIcons name="person" size={size} color={color} />
              {pendingGratitudeCount > 0 && (
                <View style={[styles.badge, styles.gratitudeBadge]}>
                  <Text style={styles.badgeText}>
                    {pendingGratitudeCount > 9 ? '9+' : pendingGratitudeCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      {/* Hidden tabs - accessible from Profile */}
      <Tabs.Screen
        name="hive"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          href: null, // Hide from tab bar - access from Profile
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  gratitudeBadge: {
    backgroundColor: Colors.accent, // Gold color for gratitude
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
