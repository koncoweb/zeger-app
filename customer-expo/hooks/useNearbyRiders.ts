import { useState, useEffect, useCallback } from 'react';
import { supabase, Rider } from '@/lib/supabase';
import { RIDER_SEARCH_RADIUS_KM } from '@/lib/constants';

interface UseNearbyRidersReturn {
  riders: Rider[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useNearbyRiders = (
  latitude: number | null,
  longitude: number | null
): UseNearbyRidersReturn => {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNearbyRiders = useCallback(async () => {
    if (latitude === null || longitude === null) {
      console.log('⚠️ No location available for fetching riders');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Fetching nearby riders for location:', { latitude, longitude });

      const { data, error: fetchError } = await supabase.functions.invoke('get-nearby-riders', {
        body: {
          customer_lat: latitude,
          customer_lng: longitude,
          radius_km: RIDER_SEARCH_RADIUS_KM,
        },
      });

      if (fetchError) {
        console.error('❌ Edge function error:', fetchError);
        throw new Error(fetchError.message || 'Gagal memuat data rider');
      }

      console.log('✅ Fetched riders:', data?.riders?.length || 0);

      if (!data?.riders || data.riders.length === 0) {
        setError('Tidak ada rider tersedia di area ini saat ini.');
        setRiders([]);
      } else {
        setRiders(data.riders);
        setError(null);
      }
    } catch (err: any) {
      console.error('❌ Error fetching nearby riders:', err);
      setError(err.message || 'Gagal memuat rider terdekat');
      setRiders([]);
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      fetchNearbyRiders();
    }
  }, [latitude, longitude, fetchNearbyRiders]);

  return {
    riders,
    isLoading,
    error,
    refetch: fetchNearbyRiders,
  };
};

// Hook for real-time rider location updates
export const useRiderLocationUpdates = (riderIds: string[]) => {
  const [riderLocations, setRiderLocations] = useState<Map<string, { lat: number; lng: number }>>(
    new Map()
  );

  useEffect(() => {
    if (riderIds.length === 0) return;

    console.log('🔄 Subscribing to rider location updates for', riderIds.length, 'riders');

    const channel = supabase
      .channel('rider_locations_realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rider_locations',
        },
        (payload) => {
          const riderId = payload.new.rider_id;
          const newLat = payload.new.latitude;
          const newLng = payload.new.longitude;

          if (riderIds.includes(riderId)) {
            console.log('📍 Rider location updated:', { riderId, newLat, newLng });

            setRiderLocations((prev) => {
              const newMap = new Map(prev);
              newMap.set(riderId, { lat: newLat, lng: newLng });
              return newMap;
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Unsubscribing from rider location updates');
      supabase.removeChannel(channel);
    };
  }, [riderIds.join(',')]);

  return riderLocations;
};
