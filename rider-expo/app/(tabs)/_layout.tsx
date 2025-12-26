import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/authStore';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { isRiderRole } from '@/lib/utils';
import { COLORS } from '@/lib/constants';

export default function TabsLayout() {
  const { isAuthenticated, isLoading, profile, signOut } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen message="Memuat..." />;
  }

  if (!isAuthenticated || !profile) {
    return <Redirect href="/(auth)/login" />;
  }

  // Validate rider role - redirect to login if not a rider
  if (!isRiderRole(profile.role)) {
    // Sign out non-rider users
    signOut();
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray[400],
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.gray[200],
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          headerTitle: 'Zeger Rider',
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Jual',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart" size={size} color={color} />
          ),
          headerTitle: 'Penjualan',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pesanan',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
          headerTitle: 'Pesanan Online',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          headerTitle: 'Profil Saya',
        }}
      />
    </Tabs>
  );
}
