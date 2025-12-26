import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { COLORS } from '@/lib/constants';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen message="Memeriksa sesi..." />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.white },
      }}
    >
      <Stack.Screen name="login" />
    </Stack>
  );
}
