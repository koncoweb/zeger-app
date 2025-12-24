import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { GOOGLE_MAPS_API_KEY } from '@/config/maps';

interface CustomerMapBasicProps {
  customerUser?: any;
  onCallRider?: (orderId: string, rider: any) => void;
}

const CustomerMapBasic = ({ customerUser, onCallRider }: CustomerMapBasicProps = {}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    console.log('🗺️ Basic Map: Starting initialization...');
    initializeBasicMap();
  }, []);

  const initializeBasicMap = async () => {
    try {
      // Step 1: Get user location
      console.log('📍 Step 1: Getting user location...');
      const location = await getUserLocation();
      setUserLocation(location);
      console.log('✅ Location obtained:', location);

      // Step 2: Load Google Maps
      console.log('📥 Step 2: Loading Google Maps script...');
      await loadGoogleMapsScript();
      console.log('✅ Google Maps script loaded');

      // Step 3: Initialize map
      console.log('🗺️ Step 3: Initializing map...');
      await initMap(location);
      console.log('✅ Map initialized successfully');

      setLoading(false);
    } catch (err: any) {
      console.error('❌ Error initializing map:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const getUserLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error('Tidak dapat mengakses lokasi: ' + error.message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  };

  const loadGoogleMapsScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if ((window as any).google?.maps) {
        resolve();
        return;
      }

      // Check API key
      if (!GOOGLE_MAPS_API_KEY) {
        reject(new Error('Google Maps API key tidak ditemukan'));
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Script loading failed')));
        return;
      }

      // Create and load script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;

      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps script'));

      document.head.appendChild(script);
    });
  };

  const initMap = async (location: { lat: number; lng: number }): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Wait for container to be ready
      const checkContainer = () => {
        if (!mapContainer.current) {
          console.log('⏳ Waiting for map container...');
          setTimeout(checkContainer, 100);
          return;
        }

        try {
          console.log('🎯 Creating map with location:', location);
          
          const map = new google.maps.Map(mapContainer.current, {
            center: location,
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true
          });

          // Add user marker
          const marker = new google.maps.Marker({
            position: location,
            map: map,
            title: 'Lokasi Anda',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="#DC2626" stroke="#FFFFFF" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" fill="#FFFFFF"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(24, 24),
              anchor: new google.maps.Point(12, 12)
            }
          });

          // Add info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold;">Lokasi Anda</h3>
                <p style="margin: 0; font-size: 12px; color: #666;">
                  Lat: ${location.lat.toFixed(6)}<br />
                  Lng: ${location.lng.toFixed(6)}
                </p>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          console.log('✅ Map and marker created successfully');
          resolve();
        } catch (err) {
          console.error('❌ Error creating map:', err);
          reject(err);
        }
      };

      checkContainer();
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Peta Lokasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Memuat peta...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Error Memuat Peta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={initializeBasicMap}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Coba Lagi
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Peta Lokasi Anda
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div 
            ref={mapContainer} 
            className="w-full h-96 rounded-lg"
            style={{ minHeight: '400px' }}
          />
        </CardContent>
      </Card>
      
      {userLocation && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Informasi Lokasi</h3>
            <p className="text-sm text-gray-600">
              Latitude: {userLocation.lat.toFixed(6)}<br />
              Longitude: {userLocation.lng.toFixed(6)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerMapBasic;