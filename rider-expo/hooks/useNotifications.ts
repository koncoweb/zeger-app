import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationData {
  type: 'new_order' | 'stock_transfer' | 'message' | 'system';
  orderId?: string;
  stockMovementId?: string;
  title?: string;
  body?: string;
}

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();
  const { user } = useAuthStore();

  useEffect(() => {
    registerForPushNotifications().then(token => {
      if (token) {
        setExpoPushToken(token);
        // Save token to database
        if (user?.id) {
          saveTokenToDatabase(user.id, token);
        }
      }
    });

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      console.log('Notification received:', notification);
    });

    // Listen for notification responses (when user taps notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user?.id]);

  const registerForPushNotifications = async (userId?: string): Promise<string | null> => {
    let token: string | null = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Pesanan Baru',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#DC2626',
        sound: 'notification.wav',
      });

      await Notifications.setNotificationChannelAsync('stock', {
        name: 'Transfer Stok',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#DC2626',
      });

      await Notifications.setNotificationChannelAsync('system', {
        name: 'Sistem',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    setPermissionStatus(finalStatus);

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with actual project ID
      });
      token = tokenData.data;
      setExpoPushToken(token);
      
      // Save token to database if userId provided
      if (userId && token) {
        await saveTokenToDatabase(userId, token);
      }
    } catch (error) {
      console.error('Error getting push token:', error);
    }

    return token;
  };

  const saveTokenToDatabase = async (userId: string, token: string) => {
    try {
      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: userId,
          token: token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Error saving push token:', error);
      }
    } catch (error) {
      console.error('Error in saveTokenToDatabase:', error);
    }
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as NotificationData;

    switch (data.type) {
      case 'new_order':
        if (data.orderId) {
          router.push(`/order/${data.orderId}`);
        } else {
          router.push('/(tabs)/orders');
        }
        break;
      case 'stock_transfer':
        router.push('/stock/receive');
        break;
      default:
        // Navigate to home
        router.push('/(tabs)');
    }
  };

  const scheduleLocalNotification = async (
    title: string,
    body: string,
    data?: NotificationData,
    channelId: string = 'system'
  ) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
        ...(Platform.OS === 'android' && { channelId }),
      },
      trigger: null, // Immediate
    });
  };

  const clearAllNotifications = async () => {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  };

  return {
    expoPushToken,
    notification,
    permissionStatus,
    registerForPushNotifications,
    setupNotificationListeners: () => {
      // Setup listeners and return cleanup function
      const notifListener = Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification);
      });
      
      const respListener = Notifications.addNotificationResponseReceivedListener(response => {
        handleNotificationResponse(response);
      });

      return () => {
        Notifications.removeNotificationSubscription(notifListener);
        Notifications.removeNotificationSubscription(respListener);
      };
    },
    scheduleLocalNotification,
    clearAllNotifications,
  };
}
