import { memo, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/lib/constants';

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
}

const actions: QuickAction[] = [
  { id: 'stock-receive', title: 'Terima Stok', icon: 'cube-outline', route: '/stock/receive', color: COLORS.info },
  { id: 'stock-return', title: 'Retur Stok', icon: 'return-down-back-outline', route: '/stock/return', color: COLORS.warning },
  { id: 'attendance', title: 'Absensi', icon: 'finger-print-outline', route: '/attendance', color: COLORS.success },
  { id: 'checkpoints', title: 'Checkpoint', icon: 'location-outline', route: '/checkpoints', color: COLORS.primary },
  { id: 'analytics', title: 'Analitik', icon: 'bar-chart-outline', route: '/analytics', color: '#8B5CF6' },
  { id: 'shift-report', title: 'Laporan', icon: 'document-text-outline', route: '/shift-report', color: COLORS.brown },
];

// Memoized action button component
const ActionButton = memo(({ action, onPress }: { action: QuickAction; onPress: (route: string) => void }) => {
  const iconContainerStyle = useMemo(
    () => [styles.iconContainer, { backgroundColor: `${action.color}15` }],
    [action.color]
  );

  const handlePress = useCallback(() => {
    onPress(action.route);
  }, [action.route, onPress]);

  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={iconContainerStyle}>
        <Ionicons name={action.icon} size={24} color={action.color} />
      </View>
      <Text style={styles.actionTitle}>{action.title}</Text>
    </TouchableOpacity>
  );
});

ActionButton.displayName = 'ActionButton';

const QuickActionsComponent = () => {
  const router = useRouter();

  const handlePress = useCallback((route: string) => {
    router.push(route as any);
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu Cepat</Text>
      <View style={styles.grid}>
        {actions.map((action) => (
          <ActionButton key={action.id} action={action} onPress={handlePress} />
        ))}
      </View>
    </View>
  );
};

export const QuickActions = memo(QuickActionsComponent);

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 11,
    color: COLORS.gray[700],
    textAlign: 'center',
  },
});
