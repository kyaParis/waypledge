import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const PUSH_TOKEN_KEY = 'waypledge_push_token';
const NOTIFICATIONS_ENABLED_KEY = 'waypledge_notifications_enabled';

export interface NotificationData {
  type: 'message' | 'gratitude' | 'link_request' | 'pledge_match' | 'wish_match';
  title: string;
  body: string;
  data?: any;
}

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Load notification preference
    loadNotificationPreference();

    // Register for push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        // Save token locally
        AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
      }
    });

    // Listen for incoming notifications (when app is open)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Listen for notification interactions (user tapped notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      handleNotificationResponse(data);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const loadNotificationPreference = async () => {
    try {
      const enabled = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
      setNotificationsEnabled(enabled !== 'false'); // Default to true
    } catch (error) {
      console.error('Error loading notification preference:', error);
    }
  };

  const handleNotificationResponse = (data: any) => {
    // Handle navigation based on notification type
    // This will be handled by the component using this hook
    console.log('Notification tapped:', data);
  };

  // Register push token with backend
  const registerTokenWithBackend = async (token: string) => {
    try {
      await api.post('/users/push-token', { push_token: token });
      console.log('Push token registered with backend');
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  };

  // Unregister push token (when user disables notifications)
  const unregisterTokenFromBackend = async () => {
    try {
      await api.delete('/users/push-token');
      console.log('Push token removed from backend');
    } catch (error) {
      console.error('Error removing push token:', error);
    }
  };

  // Toggle notifications on/off
  const toggleNotifications = async (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
    
    if (enabled && expoPushToken) {
      await registerTokenWithBackend(expoPushToken);
    } else {
      await unregisterTokenFromBackend();
    }
  };

  // Initialize notifications (call after user logs in)
  const initializeNotifications = async () => {
    if (expoPushToken && notificationsEnabled) {
      await registerTokenWithBackend(expoPushToken);
    }
  };

  return {
    expoPushToken,
    notification,
    notificationsEnabled,
    toggleNotifications,
    initializeNotifications,
  };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Must be a physical device for push notifications
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    // Return a mock token for web/simulator testing
    return 'ExponentPushToken[simulator-mock-token]';
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  try {
    // Get the Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    token = tokenData.data;
    console.log('Expo push token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
  }

  // Configure Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'WayPledge',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F5A623',
    });
  }

  return token;
}

// Helper to send local notification (for testing)
export async function sendLocalNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // Immediately
  });
}
