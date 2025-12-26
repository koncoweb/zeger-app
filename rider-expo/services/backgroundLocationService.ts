import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_LOCATION_TASK = 'background-location-task';
const RIDER_ID_KEY = 'rider_id_for_background';

// Define the background task
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const location = locations[0];

    if (location) {
      try {
        // Get rider ID from storage
        const riderId = await AsyncStorage.getItem(RIDER_ID_KEY);
        
        if (riderId) {
          await updateLocationInBackground(riderId, {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            heading: location.coords.heading,
            speed: location.coords.speed,
          });
        }
      } catch (err) {
        console.error('Error updating background location:', err);
      }
    }
  }
});

async function updateLocationInBackground(
  riderId: string,
  location: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    heading: number | null;
    speed: number | null;
  }
) {
  try {
    // Update rider_locations table
    await supabase.from('rider_locations').upsert(
      {
        rider_id: riderId,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        heading: location.heading,
        speed: location.speed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'rider_id' }
    );

    // Update profiles table
    await supabase
      .from('profiles')
      .update({
        last_known_lat: location.latitude,
        last_known_lng: location.longitude,
        location_updated_at: new Date().toISOString(),
      })
      .eq('id', riderId);

    console.log('Background location updated:', location.latitude, location.longitude);
  } catch (error) {
    console.error('Error in updateLocationInBackground:', error);
  }
}

export const backgroundLocationService = {
  async startBackgroundTracking(riderId: string): Promise<boolean> {
    try {
      // Check if background location is available
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.log('Foreground location permission not granted');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.log('Background location permission not granted');
        return false;
      }

      // Store rider ID for background task
      await AsyncStorage.setItem(RIDER_ID_KEY, riderId);

      // Check if task is already running
      const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      
      if (isTaskRunning) {
        console.log('Background location task already running');
        return true;
      }

      // Start background location updates
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000, // 30 seconds
        distanceInterval: 50, // 50 meters
        deferredUpdatesInterval: 30000,
        deferredUpdatesDistance: 50,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Zeger Rider Aktif',
          notificationBody: 'Lokasi sedang dilacak untuk pengiriman',
          notificationColor: '#DC2626',
        },
        pausesUpdatesAutomatically: false,
        activityType: Location.ActivityType.AutomotiveNavigation,
      });

      console.log('Background location tracking started');
      return true;
    } catch (error) {
      console.error('Error starting background tracking:', error);
      return false;
    }
  },

  async stopBackgroundTracking(): Promise<void> {
    try {
      const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      
      if (isTaskRunning) {
        await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        console.log('Background location tracking stopped');
      }

      await AsyncStorage.removeItem(RIDER_ID_KEY);
    } catch (error) {
      console.error('Error stopping background tracking:', error);
    }
  },

  async isBackgroundTrackingActive(): Promise<boolean> {
    try {
      return await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    } catch (error) {
      console.error('Error checking background tracking status:', error);
      return false;
    }
  },
};
