import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Phone, Star, Package, Navigation, Loader2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Rider {
  id: string;
  full_name: string;
  distance_km: number;
  eta_minutes: number;
  rating: number;
  phone: string;
  total_stock: number;
  lat: number | null;
  lng: number | null;
  last_updated: string | null;
  is_online: boolean;
}

// Temporary: User should add their Mapbox token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiemVnZXJhcHAiLCJhIjoiY20zeTh6Y2VhMGF5cTJsc2J5bmZ1b3RtMCJ9.FUQ8xRvXaKHLJLdXZegerA';

const CustomerMap = () => {
  const [nearbyRiders, setNearbyRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    getUserLocation();
    
    // Cleanup map on unmount
    return () => {
      markers.current.forEach(marker => marker.remove());
      if (map.current) map.current.remove();
    };
  }, []);

  // Initialize map when location is available
  useEffect(() => {
    if (!userLocation || !mapContainer.current) return;
    if (map.current) return; // Map already initialized

    console.log('🗺️ Initializing map with user location:', userLocation);
    
    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [userLocation.lng, userLocation.lat],
        zoom: 12
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add customer marker (blue)
      const customerEl = document.createElement('div');
      customerEl.className = 'w-8 h-8 bg-primary rounded-full border-4 border-white shadow-lg';
      new mapboxgl.Marker(customerEl)
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>Lokasi Anda</strong>'))
        .addTo(map.current);

      // Add rider markers (if any)
      console.log('📍 Adding markers for riders:', nearbyRiders.length);
      nearbyRiders.forEach(rider => {
        if (rider.lat && rider.lng) {
          const riderEl = document.createElement('div');
          riderEl.className = rider.is_online 
            ? 'w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-lg'
            : 'w-6 h-6 bg-gray-400 rounded-full border-2 border-white shadow-lg';
          
          const marker = new mapboxgl.Marker(riderEl)
            .setLngLat([rider.lng, rider.lat])
            .setPopup(new mapboxgl.Popup().setHTML(
              `<strong>${rider.full_name}</strong><br/>
               ${rider.is_online ? '🟢 Online' : '⚪ Offline'}<br/>
               ${rider.distance_km < 999 ? `📍 ${rider.distance_km} km` : '📍 Lokasi tidak tersedia'}`
            ))
            .addTo(map.current!);
          
          markers.current.push(marker);
        }
      });

      // Fit bounds to show all markers (if riders exist)
      if (nearbyRiders.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([userLocation.lng, userLocation.lat]);
        nearbyRiders.forEach(rider => {
          if (rider.lat && rider.lng) {
            bounds.extend([rider.lng, rider.lat]);
          }
        });
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
      }
      
      // Map loaded successfully
      map.current.on('load', () => {
        console.log('✅ Map loaded successfully');
        setMapError(null);
      });

      // Handle map errors
      map.current.on('error', (e) => {
        console.error('❌ Map error:', e);
        setMapError('Gagal memuat peta. Periksa koneksi internet Anda.');
      });
    } catch (error) {
      console.error('❌ Error initializing map:', error);
      setMapError('Gagal menginisialisasi peta.');
    }
  }, [userLocation, nearbyRiders]);

  const getUserLocation = () => {
    console.log('📍 Requesting user location...');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('✅ Got user location:', location);
          setUserLocation(location);
          fetchNearbyRiders(location.lat, location.lng);
        },
        (error) => {
          console.error('❌ Error getting location:', error);
          // Use Jakarta as fallback location
          const fallbackLocation = { lat: -6.2088, lng: 106.8456 };
          console.log('📍 Using fallback location (Jakarta):', fallbackLocation);
          setUserLocation(fallbackLocation);
          fetchNearbyRiders(fallbackLocation.lat, fallbackLocation.lng);
          setMapError('Lokasi tidak dapat diakses. Menggunakan lokasi default (Jakarta).');
        }
      );
    } else {
      console.error('❌ Geolocation not supported');
      // Use Jakarta as fallback location
      const fallbackLocation = { lat: -6.2088, lng: 106.8456 };
      setUserLocation(fallbackLocation);
      fetchNearbyRiders(fallbackLocation.lat, fallbackLocation.lng);
      setMapError('Browser tidak mendukung geolokasi. Menggunakan lokasi default (Jakarta).');
    }
  };

  const fetchNearbyRiders = async (lat: number, lng: number) => {
    console.log('🔍 Fetching nearby riders for location:', { lat, lng });
    try {
      const { data, error } = await supabase.functions.invoke('get-nearby-riders', {
        body: {
          customer_lat: lat,
          customer_lng: lng,
          radius_km: 50 // Large radius to show all riders
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        throw error;
      }
      
      console.log('✅ Fetched riders:', data.riders?.length || 0, 'riders found');
      setNearbyRiders(data.riders || []);
    } catch (error) {
      console.error('❌ Error fetching nearby riders:', error);
    } finally {
      setLoading(false);
    }
  };

  const callRider = (riderId: string) => {
    const rider = nearbyRiders.find(r => r.id === riderId);
    if (rider?.phone) {
      window.location.href = `tel:${rider.phone}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl font-bold">Zeger On The Wheels</CardTitle>
        <CardDescription>Pilih rider terdekat untuk pengiriman Anda</CardDescription>
      </CardHeader>

      {/* Interactive Map */}
      {mapError && (
        <Card className="mb-4 border-yellow-500 bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-800">{mapError}</p>
          </CardContent>
        </Card>
      )}
      <Card className="mb-6 overflow-hidden shadow-lg">
        <CardContent className="p-0">
          <div ref={mapContainer} className="h-80 w-full" />
        </CardContent>
      </Card>

      {/* Riders List */}
      {nearbyRiders.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Tidak ada rider yang tersedia saat ini
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {nearbyRiders.map((rider) => (
            <Card 
              key={rider.id} 
              className={`overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 shadow-lg ${
                !rider.is_online ? 'opacity-60' : ''
              }`}
            >
              <CardHeader className="pb-3 bg-gradient-to-br from-gray-50 to-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-14 w-14 ring-2 ring-primary/10">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${rider.id}`} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {rider.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-md ${
                        rider.is_online ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">{rider.full_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-semibold">{rider.rating}</span>
                        </div>
                        <Badge variant={rider.is_online ? "default" : "secondary"} className="text-xs">
                          {rider.is_online ? '🟢 Online' : '⚪ Offline'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1 shadow-sm">
                    <Package className="h-3 w-3" />
                    <span className="font-bold">{rider.total_stock}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded-lg">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold">
                      {rider.distance_km < 999 ? `${rider.distance_km} km` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded-lg">
                    <Navigation className="h-4 w-4 text-green-600" />
                    <span className="font-semibold">
                      {rider.eta_minutes > 0 ? `~${rider.eta_minutes} min` : 'N/A'}
                    </span>
                  </div>
                </div>
                {!rider.lat || !rider.lng ? (
                  <p className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                    📍 Lokasi tidak tersedia
                  </p>
                ) : null}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 shadow-sm hover:shadow-md transition-shadow"
                    onClick={() => callRider(rider.id)}
                    disabled={!rider.is_online || !rider.phone}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 shadow-md hover:shadow-lg transition-shadow"
                    disabled={!rider.is_online || !rider.lat || !rider.lng}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Navigate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerMap;
