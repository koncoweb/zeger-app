import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useOfflineStore } from '@/store/offlineStore';
import { useNotifications } from '@/hooks/useNotifications';
import { COLORS } from '@/lib/constants';

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);
  const { profile } = useAuthStore();
  const initNetworkListener = useOfflineStore((state) => state.initNetworkListener);
  const { registerForPushNotifications, setupNotificationListeners } = useNotifications();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return;
    }
    initialize();
  }, []);

  // Initialize offline listener
  useEffect(() => {
    if (Platform.OS === 'web') return;
    
    const unsubscribe = initNetworkListener();
    return () => unsubscribe();
  }, []);

  // Setup push notifications
  useEffect(() => {
    if (Platform.OS === 'web' || !profile) return;

    const setupNotifications = async () => {
      await registerForPushNotifications(profile.id);
    };
    
    setupNotifications();
    const cleanup = setupNotificationListeners();
    
    return () => cleanup();
  }, [profile]);

  // Handle app state changes for sync
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - trigger sync
        useOfflineStore.getState().syncAll();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.gray[50] },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen
          name="stock/receive"
          options={{
            headerShown: true,
            title: 'Terima Stok',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: COLORS.white,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="stock/return"
          options={{
            headerShown: true,
            title: 'Retur Stok',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: COLORS.white,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="attendance/index"
          options={{
            headerShown: true,
            title: 'Absensi',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: COLORS.white,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="checkpoints/index"
          options={{
            headerShown: true,
            title: 'Checkpoint',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: COLORS.white,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="analytics/index"
          options={{
            headerShown: true,
            title: 'Analitik Penjualan',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: COLORS.white,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="shift-report/index"
          options={{
            headerShown: true,
            title: 'Laporan Shift',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: COLORS.white,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="order/[orderId]"
          options={{
            headerShown: true,
            title: 'Detail Pesanan',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: COLORS.white,
          }}
        />
      </Stack>
    </>
  );
}
