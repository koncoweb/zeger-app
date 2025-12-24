import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';
import { DEFAULT_REGION } from '@/lib/constants';

interface LocationState {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

interface UseLocationReturn {
  location: LocationState | null;
  errorMsg: string | null;
  isLoading: boolean;
  permissionStatus: Location.PermissionStatus | null;
  requestPermission: () => Promise<boolean>;
  refreshLocation: () => Promise<void>;
}

export const useLocation = (): UseLocationReturn => {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      // Check current permission status
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === Location.PermissionStatus.GRANTED) {
        setPermissionStatus(existingStatus);
        return true;
      }

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== Location.PermissionStatus.GRANTED) {
        setErrorMsg('Izin lokasi ditolak. Silakan aktifkan di pengaturan.');
        
        // Show alert to open settings
        Alert.alert(
          'Izin Lokasi Diperlukan',
          'Zeger membutuhkan akses lokasi untuk menemukan rider terdekat. Silakan aktifkan di pengaturan.',
          [
            { text: 'Batal', style: 'cancel' },
            { 
              text: 'Buka Pengaturan', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            },
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setErrorMsg('Gagal meminta izin lokasi');
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      // Get current position with high accuracy
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      const newLocation: LocationState = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy,
      };

      console.log('📍 Got location:', newLocation);
      setLocation(newLocation);
      setErrorMsg(null);
    } catch (error: any) {
      console.error('Error getting location:', error);
      
      // Set fallback location (Surabaya)
      setLocation({
        latitude: DEFAULT_REGION.latitude,
        longitude: DEFAULT_REGION.longitude,
        accuracy: null,
      });
      
      if (error.code === 'E_LOCATION_SERVICES_DISABLED') {
        setErrorMsg('Layanan lokasi dinonaktifkan. Silakan aktifkan GPS.');
      } else if (error.code === 'E_LOCATION_TIMEOUT') {
        setErrorMsg('Timeout mendapatkan lokasi. Menggunakan lokasi default.');
      } else {
        setErrorMsg('Gagal mendapatkan lokasi. Menggunakan lokasi default.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshLocation = useCallback(async () => {
    const hasPermission = await requestPermission();
    if (hasPermission) {
      await getCurrentLocation();
    }
  }, [requestPermission, getCurrentLocation]);

  useEffect(() => {
    const initLocation = async () => {
      const hasPermission = await requestPermission();
      if (hasPermission) {
        await getCurrentLocation();
      } else {
        // Use fallback location
        setLocation({
          latitude: DEFAULT_REGION.latitude,
          longitude: DEFAULT_REGION.longitude,
          accuracy: null,
        });
        setIsLoading(false);
      }
    };

    initLocation();
  }, []);

  return {
    location,
    errorMsg,
    isLoading,
    permissionStatus,
    requestPermission,
    refreshLocation,
  };
};

// Hook for watching location changes (for tracking)
export const useLocationWatch = (enabled: boolean = false) => {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [subscription, setSubscription] = useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      if (!enabled) return;

      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) return;

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (newLocation) => {
            setLocation({
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              accuracy: newLocation.coords.accuracy,
            });
          }
        );

        setSubscription(locationSubscription);
      } catch (error) {
        console.error('Error watching location:', error);
      }
    };

    startWatching();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [enabled]);

  const stopWatching = useCallback(() => {
    if (subscription) {
      subscription.remove();
      setSubscription(null);
    }
  }, [subscription]);

  return { location, stopWatching };
};
