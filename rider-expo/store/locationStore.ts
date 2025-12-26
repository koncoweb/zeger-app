import { create } from 'zustand';
import * as ExpoLocation from 'expo-location';
import { supabase } from '@/lib/supabase';
import { Location } from '@/lib/types';
import { APP_CONFIG } from '@/lib/constants';

interface LocationState {
  currentLocation: Location | null;
  isTracking: boolean;
  lastUpdate: Date | null;
  error: string | null;
  permissionStatus: ExpoLocation.PermissionStatus | null;

  // Actions
  requestPermissions: () => Promise<boolean>;
  getCurrentLocation: () => Promise<Location | null>;
  startTracking: (riderId: string) => Promise<void>;
  stopTracking: () => void;
  updateRiderLocation: (riderId: string, location: Location) => Promise<void>;
  clearError: () => void;
}

let locationSubscription: ExpoLocation.LocationSubscription | null = null;
let updateInterval: NodeJS.Timeout | null = null;

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  isTracking: false,
  lastUpdate: null,
  error: null,
  permissionStatus: null,

  clearError: () => set({ error: null }),

  requestPermissions: async () => {
    try {
      const { status: foregroundStatus } =
        await ExpoLocation.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        set({
          error: 'Izin lokasi diperlukan untuk menggunakan aplikasi',
          permissionStatus: foregroundStatus,
        });
        return false;
      }

      // Request background permission for continuous tracking
      const { status: backgroundStatus } =
        await ExpoLocation.requestBackgroundPermissionsAsync();

      set({ permissionStatus: foregroundStatus });

      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission not granted');
        // Still return true, we can work with foreground only
      }

      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      set({ error: 'Gagal meminta izin lokasi' });
      return false;
    }
  },

  getCurrentLocation: async () => {
    try {
      const hasPermission = await get().requestPermissions();
      if (!hasPermission) return null;

      const location = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.High,
      });

      const currentLocation: Location = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy ?? undefined,
        heading: location.coords.heading ?? undefined,
        speed: location.coords.speed ?? undefined,
      };

      set({ currentLocation, lastUpdate: new Date() });
      return currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      set({ error: 'Gagal mendapatkan lokasi' });
      return null;
    }
  },

  startTracking: async (riderId: string) => {
    try {
      const hasPermission = await get().requestPermissions();
      if (!hasPermission) return;

      // Stop existing tracking
      get().stopTracking();

      set({ isTracking: true, error: null });

      // Start watching location
      locationSubscription = await ExpoLocation.watchPositionAsync(
        {
          accuracy: ExpoLocation.Accuracy.High,
          distanceInterval: APP_CONFIG.locationDistanceFilter,
          timeInterval: 5000, // Update every 5 seconds locally
        },
        (location) => {
          const currentLocation: Location = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy ?? undefined,
            heading: location.coords.heading ?? undefined,
            speed: location.coords.speed ?? undefined,
          };
          set({ currentLocation, lastUpdate: new Date() });
        }
      );

      // Update server every 30 seconds
      updateInterval = setInterval(async () => {
        const { currentLocation } = get();
        if (currentLocation) {
          await get().updateRiderLocation(riderId, currentLocation);
        }
      }, APP_CONFIG.locationUpdateInterval);

      // Initial update
      const location = await get().getCurrentLocation();
      if (location) {
        await get().updateRiderLocation(riderId, location);
      }
    } catch (error) {
      console.error('Error starting tracking:', error);
      set({ error: 'Gagal memulai tracking lokasi', isTracking: false });
    }
  },

  stopTracking: () => {
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
    set({ isTracking: false });
  },

  updateRiderLocation: async (riderId: string, location: Location) => {
    try {
      // Update rider_locations table
      const { error: locError } = await supabase.from('rider_locations').upsert(
        {
          rider_id: riderId,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy || null,
          heading: location.heading || null,
          speed: location.speed || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'rider_id' }
      );

      if (locError) {
        console.error('Error updating rider_locations:', locError);
      }

      // Also update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          last_known_lat: location.latitude,
          last_known_lng: location.longitude,
          location_updated_at: new Date().toISOString(),
        })
        .eq('id', riderId);

      if (profileError) {
        console.error('Error updating profile location:', profileError);
      }

      set({ lastUpdate: new Date(), error: null });
    } catch (error) {
      console.error('Error in updateRiderLocation:', error);
      set({ error: 'Gagal update lokasi' });
    }
  },
}));
