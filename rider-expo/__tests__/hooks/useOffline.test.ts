import { renderHook } from '@testing-library/react-native';
import * as fc from 'fast-check';
import { useOffline } from '../../hooks/useOffline';
import { useOfflineStore } from '../../store/offlineStore';

// Reset store before each test
beforeEach(() => {
  useOfflineStore.setState({
    isOnline: true,
    isConnected: true,
    connectionType: 'wifi',
    pendingTransactions: [],
    pendingLocations: [],
    pendingCheckpoints: [],
    isSyncing: false,
    lastSyncAt: null,
  });
});

describe('useOffline hook', () => {
  describe('Pending Count Calculation', () => {
    /**
     * Property 10: Pending count calculation
     * For any combination of pending items, pendingCount should equal
     * the sum of unsynced transactions + locations + checkpoints
     * Validates: Requirements 15.1
     */
    it('should correctly calculate pending count from unsynced items', () => {
      fc.assert(
        fc.property(
          fc.array(fc.boolean(), { minLength: 0, maxLength: 10 }), // transaction synced states
          fc.array(fc.boolean(), { minLength: 0, maxLength: 10 }), // location synced states
          fc.array(fc.boolean(), { minLength: 0, maxLength: 10 }), // checkpoint synced states
          (txnSynced, locSynced, cpSynced) => {
            // Create pending items with the given synced states
            const pendingTransactions = txnSynced.map((synced, i) => ({
              id: `txn_${i}`,
              data: { test: i },
              createdAt: new Date().toISOString(),
              synced,
            }));

            const pendingLocations = locSynced.map((synced, i) => ({
              riderId: `rider_${i}`,
              latitude: i,
              longitude: i,
              timestamp: new Date().toISOString(),
              synced,
            }));

            const pendingCheckpoints = cpSynced.map((synced, i) => ({
              id: `cp_${i}`,
              data: { name: `checkpoint_${i}` },
              createdAt: new Date().toISOString(),
              synced,
            }));

            // Set store state
            useOfflineStore.setState({
              pendingTransactions,
              pendingLocations,
              pendingCheckpoints,
            });

            // Render hook
            const { result } = renderHook(() => useOffline());

            // Calculate expected count
            const expectedCount =
              txnSynced.filter(s => !s).length +
              locSynced.filter(s => !s).length +
              cpSynced.filter(s => !s).length;

            expect(result.current.pendingCount).toBe(expectedCount);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Has Pending Data Flag', () => {
    /**
     * Property 11: hasPendingData flag
     * hasPendingData should be true if and only if pendingCount > 0
     * Validates: Requirements 15.1
     */
    it('should correctly set hasPendingData based on pending count', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 20 }), // number of unsynced items
          (unsyncedCount) => {
            // Create unsynced transactions
            const pendingTransactions = Array.from({ length: unsyncedCount }, (_, i) => ({
              id: `txn_${i}`,
              data: { test: i },
              createdAt: new Date().toISOString(),
              synced: false,
            }));

            useOfflineStore.setState({
              pendingTransactions,
              pendingLocations: [],
              pendingCheckpoints: [],
            });

            const { result } = renderHook(() => useOffline());

            expect(result.current.hasPendingData).toBe(unsyncedCount > 0);
            expect(result.current.pendingCount).toBe(unsyncedCount);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Online Status', () => {
    /**
     * Property 12: Online status reflection
     * The hook should correctly reflect the store's online status
     * Validates: Requirements 15.1
     */
    it('should reflect store online status', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // isOnline
          fc.boolean(), // isConnected
          fc.constantFrom('wifi', 'cellular', 'none', 'unknown'), // connectionType
          (isOnline, isConnected, connectionType) => {
            useOfflineStore.setState({
              isOnline,
              isConnected,
              connectionType,
            });

            const { result } = renderHook(() => useOffline());

            expect(result.current.isOnline).toBe(isOnline);
            expect(result.current.isConnected).toBe(isConnected);
            expect(result.current.connectionType).toBe(connectionType);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Syncing Status', () => {
    /**
     * Property 13: Syncing status reflection
     * The hook should correctly reflect the store's syncing status
     * Validates: Requirements 15.4
     */
    it('should reflect store syncing status', () => {
      fc.assert(
        fc.property(
          fc.boolean(), // isSyncing
          (isSyncing) => {
            useOfflineStore.setState({ isSyncing });

            const { result } = renderHook(() => useOffline());

            expect(result.current.isSyncing).toBe(isSyncing);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Last Sync Timestamp', () => {
    /**
     * Property 14: Last sync timestamp
     * The hook should correctly reflect the last sync timestamp
     * Validates: Requirements 15.4
     */
    it('should reflect last sync timestamp', () => {
      fc.assert(
        fc.property(
          fc.option(fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') })),
          (lastSyncAt) => {
            useOfflineStore.setState({ lastSyncAt: lastSyncAt ?? null });

            const { result } = renderHook(() => useOffline());

            if (lastSyncAt) {
              expect(result.current.lastSyncAt).toEqual(lastSyncAt);
            } else {
              expect(result.current.lastSyncAt).toBeNull();
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
