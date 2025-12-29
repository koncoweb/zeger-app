import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface NotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isPermissionGranted: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useNotifications = () => {
  const [state, setState] = useState<NotificationState>({
    expoPushToken: null,
    notification: null,
    isPermissionGranted: false,
    isLoading: true,
    error: null,
  });

  const { user } = useAuthStore();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    registerForPushNotificationsAsync();

    // Listen for notifications received while app is running
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setState((prev) => ({ ...prev, notification }));
      }
    );

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleNotificationResponse(response);
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Register push token with Supabase when user is available
  useEffect(() => {
    if (state.expoPushToken && user?.id) {
      registerPushTokenWithSupabase(state.expoPushToken, user.id);
    }
  }, [state.expoPushToken, user?.id]);

  const registerForPushNotificationsAsync = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      if (!Device.isDevice) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Push notifications only work on physical devices',
        }));
        return;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isPermissionGranted: false,
          error: 'Izin notifikasi diperlukan untuk menerima update pesanan',
        }));
        return;
      }

      // Get push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '4ec080a9-ff0c-45ea-b054-a49952e5a6a5', // From app.json
      });

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Pesanan',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#EA2831',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('promotions', {
          name: 'Promosi',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#EA2831',
          sound: 'default',
        });
      }

      setState((prev) => ({
        ...prev,
        expoPushToken: token.data,
        isPermissionGranted: true,
        isLoading: false,
      }));

    } catch (error) {
      console.error('Error registering for push notifications:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Gagal mendaftar notifikasi',
      }));
    }
  };

  const registerPushTokenWithSupabase = async (token: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('customer_push_tokens')
        .upsert({
          customer_id: userId,
          push_token: token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error registering push token:', error);
      } else {
        console.log('Push token registered successfully');
      }
    } catch (error) {
      console.error('Error registering push token with Supabase:', error);
    }
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const { notification } = response;
    const data = notification.request.content.data;

    // Handle different notification types
    switch (data?.type) {
      case 'order_confirmed':
      case 'order_preparing':
      case 'rider_assigned':
      case 'rider_approaching':
      case 'order_delivered':
        if (data.orderId) {
          router.push(`/order-tracking/${data.orderId}`);
        }
        break;

      case 'promotional':
        if (data.promoCode) {
          router.push(`/menu?promo=${data.promoCode}`);
        } else {
          router.push('/promo');
        }
        break;

      case 'system':
        if (data.deepLink) {
          router.push(data.deepLink);
        }
        break;

      default:
        // Default navigation
        if (data?.deepLink) {
          router.push(data.deepLink);
        } else {
          router.push('/');
        }
    }
  };

  const sendTestNotification = async () => {
    if (!state.expoPushToken) {
      setState((prev) => ({
        ...prev,
        error: 'Push token tidak tersedia',
      }));
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Notifikasi Zeger Customer',
          body: 'Notifikasi berhasil dikirim!',
          data: { type: 'test' },
        },
        trigger: { seconds: 1 },
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      setState((prev) => ({
        ...prev,
        error: 'Gagal mengirim notifikasi test',
      }));
    }
  };

  const clearNotification = () => {
    setState((prev) => ({ ...prev, notification: null }));
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };

  const requestPermissions = async () => {
    await registerForPushNotificationsAsync();
  };

  return {
    ...state,
    sendTestNotification,
    clearNotification,
    clearError,
    requestPermissions,
    hasToken: !!state.expoPushToken,
  };
};

export default useNotifications;