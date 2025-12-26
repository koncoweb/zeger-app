import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/lib/constants';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({ message = 'Memuat...' }: LoadingScreenProps) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray[600],
  },
});
