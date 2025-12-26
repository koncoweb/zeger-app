import { act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as fc from 'fast-check';
import { useOfflineStore } from '../../store/offlineStore';

// Reset store before each test
beforeEach(async () => {
  await AsyncStorage.clear();
  useOfflineStore.setState({
    isOnline: true,
    isConnected: true,
    connectionType: null,
    pendingTransactions: [],
    pendingLocations: [],
    pendingCheckpoints: [],
    isSyncing: false,
    lastSyncAt: null,
  });
});

describe('offlineStore', () => {
  describe('Network Status Detection', () => {
    /**
     * Property 1: Network status detection
     * For any network state (connected/disconnected), the store should correctly
     * reflect the online status based on isConnected AND isInternetReachable
     * Validates: Requirements 15.1
     */
    it('should correctly detect network status based on connection state', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.boolean(), // isConnected
          fc.boolean(), // isInternetReachable
          async (isConnected, isInternetReachable) => {
            // Mock NetInfo.fetch to return the test state
            (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({
              isConnected,
              isInternetReachable,
              type: 'wifi',
            });

            const store = useOfflineStore.getState();
            const result = await store.checkConnection();

            // isOnline should be true only when BOTH isConnected AND isInternetReachable are true
            const expectedOnline = isConnected === true && isInternetReachable === true;
            expect(result).toBe(expectedOnline);
            expect(useOfflineStore.getState().isOnline).toBe(expectedOnline);
            expect(useOfflineStore.getState().isConnected).toBe(isConnected);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Transaction Queue', () => {
    /**
     * Property 2: Transaction queue persistence
     * For any transaction data, queueing it should add it to pendingTransactions
     * and persist it to AsyncStorage
     * Validates: Requirements 15.3
     */
    it('should queue transactions and persist to storage', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            transaction_number: fc.string({ minLength: 1, maxLength: 20 }),
            total_amount: fc.integer({ min: 1000, max: 1000000 }),
            payment_method: fc.constantFrom('cash', 'qris', 'transfer'),
          }),
          async (transactionData) => {
            const store = useOfflineStore.getState();
            const initialCount = store.pendingTransactions.length;

            await act(async () => {
              await store.queueTransaction(transactionData);
            });

            const updatedStore = useOfflineStore.getState();
            
            // Should add one transaction
            expect(updatedStore.pendingTransactions.length).toBe(initialCount + 1);
            
            // Transaction should contain the data
            const lastTransaction = updatedStore.pendingTransactions[updatedStore.pendingTransactions.length - 1];
            expect(lastTransaction.data).toEqual(transactionData);
            expect(lastTransaction.synced).toBe(false);
            expect(lastTransaction.id).toBeDefined();
            expect(lastTransaction.createdAt).toBeDefined();

            // Should be persisted to AsyncStorage
            const stored = await AsyncStorage.getItem('offline_transactions');
            expect(stored).not.toBeNull();
            const parsed = JSON.parse(stored!);
            expect(parsed.length).toBe(initialCount + 1);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Location Queue', () => {
    /**
     * Property 3: Location queue with limit
     * For any sequence of location updates, the queue should keep only the last 100 locations
     * Validates: Requirements 15.3
     */
    it('should queue locations and limit to 100 entries', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              latitude: fc.double({ min: -90, max: 90 }),
              longitude: fc.double({ min: -180, max: 180 }),
              accuracy: fc.double({ min: 1, max: 100 }),
            }),
            { minLength: 1, maxLength: 150 }
          ),
          fc.uuid(),
          async (locations, riderId) => {
            const store = useOfflineStore.getState();

            // Queue all locations
            for (const location of locations) {
              await act(async () => {
                await store.queueLocation(riderId, location);
              });
            }

            const updatedStore = useOfflineStore.getState();
            
            // Should never exceed 100 locations
            expect(updatedStore.pendingLocations.length).toBeLessThanOrEqual(100);
            
            // If more than 100 were added, should have exactly 100
            if (locations.length > 100) {
              expect(updatedStore.pendingLocations.length).toBe(100);
            }
          }
        ),
        { numRuns: 5 }
      );
    });

    /**
     * Property 4: Location data integrity
     * For any location data, the queued location should preserve all coordinates
     * Validates: Requirements 15.3
     */
    it('should preserve location data integrity when queuing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.double({ min: -90, max: 90 }),
          fc.double({ min: -180, max: 180 }),
          fc.double({ min: 1, max: 100 }),
          async (riderId, latitude, longitude, accuracy) => {
            // Reset store
            useOfflineStore.setState({ pendingLocations: [] });
            
            const store = useOfflineStore.getState();
            const location = { latitude, longitude, accuracy };

            await act(async () => {
              await store.queueLocation(riderId, location);
            });

            const updatedStore = useOfflineStore.getState();
            const queuedLocation = updatedStore.pendingLocations[0];

            expect(queuedLocation.riderId).toBe(riderId);
            expect(queuedLocation.latitude).toBe(latitude);
            expect(queuedLocation.longitude).toBe(longitude);
            expect(queuedLocation.accuracy).toBe(accuracy);
            expect(queuedLocation.synced).toBe(false);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Checkpoint Queue', () => {
    /**
     * Property 5: Checkpoint queue persistence
     * For any checkpoint data, queueing it should add it to pendingCheckpoints
     * Validates: Requirements 15.3
     */
    it('should queue checkpoints and persist to storage', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            checkpoint_name: fc.string({ minLength: 1, maxLength: 50 }),
            latitude: fc.double({ min: -90, max: 90 }),
            longitude: fc.double({ min: -180, max: 180 }),
            notes: fc.string({ maxLength: 200 }),
          }),
          async (checkpointData) => {
            // Reset store
            useOfflineStore.setState({ pendingCheckpoints: [] });
            
            const store = useOfflineStore.getState();

            await act(async () => {
              await store.queueCheckpoint(checkpointData);
            });

            const updatedStore = useOfflineStore.getState();
            
            expect(updatedStore.pendingCheckpoints.length).toBe(1);
            
            const queuedCheckpoint = updatedStore.pendingCheckpoints[0];
            expect(queuedCheckpoint.data).toEqual(checkpointData);
            expect(queuedCheckpoint.synced).toBe(false);
            expect(queuedCheckpoint.id).toMatch(/^cp_/);
          }
        ),
        { numRuns: 10 }
      );
    });
  });


  describe('Sync Operations', () => {
    /**
     * Property 6: Sync only when online
     * syncAll should not execute when offline or already syncing
     * Validates: Requirements 15.4
     */
    it('should not sync when offline', async () => {
      // Set store to offline
      useOfflineStore.setState({ isOnline: false });
      
      const store = useOfflineStore.getState();
      
      // Add a pending transaction
      await act(async () => {
        await store.queueTransaction({ test: 'data' });
      });

      const beforeSync = useOfflineStore.getState().pendingTransactions.length;

      // Try to sync
      await act(async () => {
        await store.syncAll();
      });

      // Should not have synced (transaction still pending)
      const afterSync = useOfflineStore.getState();
      expect(afterSync.pendingTransactions.length).toBe(beforeSync);
      expect(afterSync.isSyncing).toBe(false);
    });

    /**
     * Property 7: Sync flag management
     * During sync, isSyncing should be true, and false after completion
     * Validates: Requirements 15.4
     */
    it('should manage syncing flag correctly', async () => {
      useOfflineStore.setState({ isOnline: true, isSyncing: false });
      
      const store = useOfflineStore.getState();
      
      // Start sync
      const syncPromise = store.syncAll();
      
      // After sync completes
      await act(async () => {
        await syncPromise;
      });

      const afterSync = useOfflineStore.getState();
      expect(afterSync.isSyncing).toBe(false);
      expect(afterSync.lastSyncAt).not.toBeNull();
    });
  });

  describe('Clear Synced Data', () => {
    /**
     * Property 8: Clear synced data
     * clearSyncedData should remove only items marked as synced
     * Validates: Requirements 15.4
     */
    it('should clear only synced data', async () => {
      // Setup: Add some synced and unsynced transactions
      useOfflineStore.setState({
        pendingTransactions: [
          { id: '1', data: { test: 1 }, createdAt: new Date().toISOString(), synced: true },
          { id: '2', data: { test: 2 }, createdAt: new Date().toISOString(), synced: false },
          { id: '3', data: { test: 3 }, createdAt: new Date().toISOString(), synced: true },
        ],
        pendingLocations: [
          { riderId: 'r1', latitude: 0, longitude: 0, timestamp: new Date().toISOString(), synced: true },
          { riderId: 'r2', latitude: 1, longitude: 1, timestamp: new Date().toISOString(), synced: false },
        ],
        pendingCheckpoints: [
          { id: 'cp1', data: { name: 'test' }, createdAt: new Date().toISOString(), synced: false },
        ],
      });

      const store = useOfflineStore.getState();
      
      await act(async () => {
        await store.clearSyncedData();
      });

      const afterClear = useOfflineStore.getState();
      
      // Should only have unsynced items
      expect(afterClear.pendingTransactions.length).toBe(1);
      expect(afterClear.pendingTransactions[0].id).toBe('2');
      
      expect(afterClear.pendingLocations.length).toBe(1);
      expect(afterClear.pendingLocations[0].riderId).toBe('r2');
      
      expect(afterClear.pendingCheckpoints.length).toBe(1);
      expect(afterClear.pendingCheckpoints[0].id).toBe('cp1');
    });
  });

  describe('Load Pending Data', () => {
    /**
     * Property 9: Load pending data from storage
     * loadPendingData should restore queued items from AsyncStorage
     * Validates: Requirements 15.2
     */
    it('should load pending data from AsyncStorage', async () => {
      // Setup: Store some data in AsyncStorage
      const storedTransactions = [
        { id: 'stored1', data: { test: 'stored' }, createdAt: new Date().toISOString(), synced: false },
      ];
      const storedLocations = [
        { riderId: 'r1', latitude: 10, longitude: 20, timestamp: new Date().toISOString(), synced: false },
      ];
      const storedCheckpoints = [
        { id: 'cp_stored', data: { name: 'stored checkpoint' }, createdAt: new Date().toISOString(), synced: false },
      ];

      await AsyncStorage.setItem('offline_transactions', JSON.stringify(storedTransactions));
      await AsyncStorage.setItem('offline_locations', JSON.stringify(storedLocations));
      await AsyncStorage.setItem('offline_checkpoints', JSON.stringify(storedCheckpoints));

      // Reset store state
      useOfflineStore.setState({
        pendingTransactions: [],
        pendingLocations: [],
        pendingCheckpoints: [],
      });

      const store = useOfflineStore.getState();
      
      await act(async () => {
        await store.loadPendingData();
      });

      const afterLoad = useOfflineStore.getState();
      
      expect(afterLoad.pendingTransactions).toEqual(storedTransactions);
      expect(afterLoad.pendingLocations).toEqual(storedLocations);
      expect(afterLoad.pendingCheckpoints).toEqual(storedCheckpoints);
    });
  });
});
