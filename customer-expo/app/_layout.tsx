import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { COLORS } from '@/lib/constants';

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // Only initialize on client-side
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return;
    }
    initialize();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.white },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="map/index" 
          options={{ 
            headerShown: true,
            title: 'Zeger On The Wheels',
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: COLORS.white,
            headerTitleStyle: { fontWeight: 'bold' },
          }} 
        />
        <Stack.Screen name="menu/index" options={{ headerShown: false }} />
        <Stack.Screen name="cart/index" options={{ headerShown: false }} />
        <Stack.Screen name="checkout/index" options={{ headerShown: false }} />
        <Stack.Screen name="outlets/index" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
