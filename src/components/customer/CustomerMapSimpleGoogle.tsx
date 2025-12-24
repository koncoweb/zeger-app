import React, { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { GOOGLE_MAPS_API_KEY } from '@/config/maps';

interface CustomerMapProps {
  customerUser?: any;
  onCallRider?: (orderId: string, rider: any) => void;
}

const CustomerMapSimpleGoogle = ({ customerUser, onCallRider }: CustomerMapProps = {}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    initMap();
  }, []);

  const initMap = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🗺️ Starting Google Maps initialization...');
      console.log('🔑 API Key available:', !!GOOGLE_MAPS_API_KEY);

      // Step 1: Get user location
      const location = await getCurrentLocation();
      console.log('📍 User location obtained:', location);
      setUserLocation(location);

      // Step 2: Load Google Maps API using new functional API
      console.log('📥 Setting up Google Maps API...');
      setOptions({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: 'weekly'
      });

      console.log('📥 Loading Google Maps library...');
      const { Map } = await importLibrary('maps') as google.maps.MapsLibrary;
      const { Marker } = await importLibrary('marker') as google.maps.MarkerLibrary;
      console.log('✅ Google Maps API loaded successfully');

      // Step 3: Initialize map
      if (!mapRef.current) {
        throw new Error('Map container not found');
      }

      console.log('🗺️ Creating map instance...');
      const mapInstance = new Map(mapRef.current, {
        center: location,
        zoom: 15,
        mapId: 'DEMO_MAP_ID', // Required for new API
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      });

      // Step 4: Add user marker
      const marker = new Marker({
        position: location,
        map: mapInstance,
        title: 'Lokasi Anda'
      });

      // Step 5: Add info window (using legacy API for InfoWindow as it's still supported)
      const { InfoWindow } = await importLibrary('maps') as google.maps.MapsLibrary;
      const infoWindow = new InfoWindow({
        content: `
          <div style="padding: 10px; font-family: Arial, sans-serif;">
            <h3 style="margin: 0 0 8px 0; color: #333;">Lokasi Anda</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">
              Lat: ${location.lat.toFixed(6)}<br/>
              Lng: ${location.lng.toFixed(6)}
            </p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstance, marker);
      });

      setMap(mapInstance);
      setLoading(false);
      
      console.log('✅ Map initialization completed successfully');

    } catch (err: any) {
      console.error('❌ Error initializing map:', err);
      setError(err.message || 'Gagal memuat peta');
      setLoading(false);
    }
  };

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation tidak didukung oleh browser ini'));
        return;
      }

      console.log('🌍 Requesting geolocation permission...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('✅ Geolocation success:', location);
          resolve(location);
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
          let errorMessage = 'Tidak dapat mengakses lokasi';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Izin akses lokasi ditolak. Silakan aktifkan lokasi di browser.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Informasi lokasi tidak tersedia.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Timeout saat mengakses lokasi.';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
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
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-gray-600">Memuat peta Google Maps...</p>
                <p className="text-sm text-gray-500 mt-2">
                  Pastikan izin lokasi sudah diaktifkan
                </p>
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
              Gagal Memuat Peta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-red-600">{error}</p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Troubleshooting:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Pastikan izin lokasi sudah diaktifkan di browser</li>
                  <li>• Periksa koneksi internet</li>
                  <li>• Coba refresh halaman</li>
                  <li>• Pastikan Google Maps API key valid</li>
                </ul>
              </div>
              
              <Button onClick={initMap} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
            </div>
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
            <MapPin className="h-5 w-5 text-green-600" />
            Peta Lokasi Anda
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div 
            ref={mapRef}
            className="w-full h-96 rounded-lg"
            style={{ minHeight: '400px' }}
          />
        </CardContent>
      </Card>
      
      {userLocation && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Informasi Lokasi</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Latitude: {userLocation.lat.toFixed(6)}</div>
                  <div>Longitude: {userLocation.lng.toFixed(6)}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <h3 className="font-semibold mb-2">🎉 Peta Berhasil Dimuat!</h3>
            <p className="text-sm text-gray-600">
              Klik marker merah untuk melihat detail lokasi Anda
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerMapSimpleGoogle;