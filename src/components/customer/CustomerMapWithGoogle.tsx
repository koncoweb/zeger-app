import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Phone, Star, Package, Navigation, Loader2, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GOOGLE_MAPS_API_KEY } from '@/config/maps';

interface Rider {
  id: string;
  full_name: string;
  distance_km: number;
  eta_minutes: number;
  rating: number;
  phone?: string;
  total_stock: number;
  lat: number | null;
  lng: number | null;
  last_updated: string | null;
  is_online: boolean;
  is_shift_active: boolean;
  has_gps?: boolean;
  branch_name?: string;
  branch_address?: string;
  photo_url?: string;
  last_known_lat?: number;
  last_known_lng?: number;
  location_updated_at?: string;
}

interface CustomerMapProps {
  customerUser?: any;
  onCallRider?: (orderId: string, rider: Rider) => void;
}

const CustomerMapWithGoogle = ({ customerUser, onCallRider }: CustomerMapProps = {}) => {
  console.log('🗺️ CustomerMapWithGoogle rendered with customerUser:', customerUser);
  
  const [nearbyRiders, setNearbyRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingRider, setRequestingRider] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const userMarker = useRef<google.maps.Marker | null>(null);
  const riderMarkers = useRef<google.maps.Marker[]>([]);
  const infoWindow = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    requestLocationPermission();
    
    return () => {
      // Cleanup
      if (userMarker.current) userMarker.current.setMap(null);
      riderMarkers.current.forEach(marker => marker.setMap(null));
      if (infoWindow.current) infoWindow.current.close();
    };
  }, []);

  // Load Google Maps when location is available
  useEffect(() => {
    console.log('🔄 useEffect triggered - userLocation:', userLocation, 'mapContainer:', !!mapContainer.current, 'mapLoaded:', mapLoaded);
    
    if (!userLocation || mapLoaded) {
      console.log('⏭️ Skipping Google Maps load - userLocation or mapLoaded condition not met');
      return;
    }
    
    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!mapContainer.current) {
        console.log('❌ mapContainer still not ready after delay');
        return;
      }
      
      console.log('🚀 Starting Google Maps load process...');
      loadGoogleMaps()
        .then(() => {
          console.log('🗺️ Initializing map...');
          initializeMap();
          setMapLoaded(true);
        })
        .catch((error) => {
          console.error('❌ Failed to load Google Maps:', error);
          setMapError(error.message);
          toast.error('Gagal memuat peta', {
            description: 'Menggunakan tampilan daftar sebagai alternatif'
          });
        });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [userLocation, mapLoaded]);

  // Update rider markers when riders data changes
  useEffect(() => {
    if (map.current && nearbyRiders.length > 0) {
      updateRiderMarkers();
    }
  }, [nearbyRiders]);

  const loadGoogleMaps = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log('🔑 Checking Google Maps API key:', GOOGLE_MAPS_API_KEY ? 'Found' : 'Missing');
      
      if (!GOOGLE_MAPS_API_KEY) {
        console.error('❌ Google Maps API key not found');
        reject(new Error('Google Maps API key tidak ditemukan'));
        return;
      }

      if ((window as any).google?.maps) {
        console.log('✅ Google Maps already loaded');
        resolve();
        return;
      }

      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Gagal memuat Google Maps')));
        return;
      }

      console.log('📥 Loading Google Maps script...');
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('✅ Google Maps script loaded successfully');
        resolve();
      };
      script.onerror = () => {
        console.error('❌ Failed to load Google Maps script');
        reject(new Error('Gagal memuat Google Maps script'));
      };
      
      document.head.appendChild(script);
    });
  };

  const initializeMap = () => {
    if (!userLocation || !mapContainer.current) return;

    const mapOptions: google.maps.MapOptions = {
      center: { lat: userLocation.lat, lng: userLocation.lng },
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    };

    map.current = new google.maps.Map(mapContainer.current, mapOptions);
    infoWindow.current = new google.maps.InfoWindow();

    // Add user location marker
    userMarker.current = new google.maps.Marker({
      position: { lat: userLocation.lat, lng: userLocation.lng },
      map: map.current,
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

    // Add click listener to user marker
    userMarker.current.addListener('click', () => {
      if (infoWindow.current) {
        infoWindow.current.setContent(`
          <div class="p-2">
            <h3 class="font-semibold">Lokasi Anda</h3>
            <p class="text-sm text-gray-600">Lat: ${userLocation.lat.toFixed(6)}</p>
            <p class="text-sm text-gray-600">Lng: ${userLocation.lng.toFixed(6)}</p>
          </div>
        `);
        infoWindow.current.open(map.current, userMarker.current);
      }
    });
  };

  const updateRiderMarkers = () => {
    if (!map.current) return;

    // Clear existing rider markers
    riderMarkers.current.forEach(marker => marker.setMap(null));
    riderMarkers.current = [];

    // Add new rider markers
    nearbyRiders.forEach((rider, index) => {
      if (!rider.lat || !rider.lng) return;

      const marker = new google.maps.Marker({
        position: { lat: rider.lat, lng: rider.lng },
        map: map.current,
        title: rider.full_name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="14" fill="#10B981" stroke="#FFFFFF" stroke-width="2"/>
              <path d="M16 8L20 12H18V20H14V12H12L16 8Z" fill="#FFFFFF"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      });

      // Add click listener to rider marker
      marker.addListener('click', () => {
        if (infoWindow.current) {
          infoWindow.current.setContent(`
            <div class="p-3 min-w-[200px]">
              <div class="flex items-center gap-2 mb-2">
                <img src="${rider.photo_url || '/placeholder.svg'}" alt="${rider.full_name}" 
                     class="w-8 h-8 rounded-full object-cover" 
                     onerror="this.src='/placeholder.svg'">
                <div>
                  <h3 class="font-semibold">${rider.full_name}</h3>
                  <div class="flex items-center gap-1 text-sm text-gray-600">
                    <span>⭐ ${rider.rating.toFixed(1)}</span>
                    <span>• ${rider.distance_km.toFixed(1)} km</span>
                  </div>
                </div>
              </div>
              <div class="text-sm text-gray-600 mb-2">
                <p>📦 ${rider.total_stock} item tersedia</p>
                <p>⏱️ ETA: ${rider.eta_minutes} menit</p>
                ${rider.branch_name ? `<p>🏪 ${rider.branch_name}</p>` : ''}
              </div>
              <button 
                onclick="window.callRider('${rider.id}')"
                class="w-full px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
              >
                📞 Panggil Rider
              </button>
            </div>
          `);
          infoWindow.current.open(map.current, marker);
        }
      });

      riderMarkers.current.push(marker);
    });

    // Adjust map bounds to show all markers
    if (nearbyRiders.length > 0 && userLocation) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
      nearbyRiders.forEach(rider => {
        if (rider.lat && rider.lng) {
          bounds.extend({ lat: rider.lat, lng: rider.lng });
        }
      });
      map.current.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = google.maps.event.addListener(map.current, 'bounds_changed', () => {
        if (map.current!.getZoom()! > 16) {
          map.current!.setZoom(16);
        }
        google.maps.event.removeListener(listener);
      });
    }
  };

  const requestLocationPermission = () => {
    console.log('🌍 Requesting location permission...');
    
    if (!navigator.geolocation) {
      console.error('❌ Geolocation not supported');
      setMapError('Geolocation tidak didukung oleh browser ini');
      setLoading(false);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log('✅ Location obtained:', location);
        setUserLocation(location);
        fetchNearbyRiders(location);
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        setMapError('Tidak dapat mengakses lokasi. Pastikan izin lokasi sudah diberikan.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const fetchNearbyRiders = async (location: { lat: number; lng: number }) => {
    console.log('🔍 Fetching nearby riders for location:', location);
    try {
      const { data: riders, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          phone,
          photo_url,
          last_known_lat,
          last_known_lng,
          location_updated_at,
          branch:branches(name, address)
        `)
        .in('role', ['rider', 'sb_rider', 'bh_rider'])
        .eq('is_active', true)
        .not('last_known_lat', 'is', null)
        .not('last_known_lng', 'is', null);

      if (error) throw error;

      console.log('📊 Raw riders data:', riders);

      const ridersWithDistance = riders?.map(rider => {
        console.log('🔍 Processing rider:', rider.full_name, 'lat:', rider.last_known_lat, 'lng:', rider.last_known_lng);
        
        // Skip riders without location data
        if (!rider.last_known_lat || !rider.last_known_lng) {
          console.log('⏭️ Skipping rider without location:', rider.full_name);
          return null;
        }
        
        const distance = calculateDistance(
          location.lat,
          location.lng,
          rider.last_known_lat,
          rider.last_known_lng
        );
        
        console.log('📏 Distance calculated for', rider.full_name, ':', distance, 'km');
        
        return {
          ...rider,
          lat: rider.last_known_lat,
          lng: rider.last_known_lng,
          distance_km: distance,
          eta_minutes: Math.round(distance * 3),
          rating: 4.5, // Default rating since not in profiles table
          total_stock: Math.floor(Math.random() * 50) + 10,
          is_online: true, // Assume online if has recent location
          is_shift_active: true,
          branch_name: rider.branch?.name,
          branch_address: rider.branch?.address,
          last_updated: rider.location_updated_at
        };
      }).filter(rider => rider !== null && rider.distance_km <= 10)
        .sort((a, b) => a.distance_km - b.distance_km) || [];

      console.log('🎯 Processed riders with distance:', ridersWithDistance);
      setNearbyRiders(ridersWithDistance);
    } catch (error) {
      console.error('❌ Error fetching riders:', error);
      toast.error('Gagal memuat data rider terdekat');
    } finally {
      console.log('✅ Finished fetching riders, setting loading to false');
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleCallRider = useCallback(async (riderId: string) => {
    const rider = nearbyRiders.find(r => r.id === riderId);
    if (!rider || !customerUser?.id) {
      toast.error('Rider tidak ditemukan atau Anda belum login');
      return;
    }

    setRequestingRider(riderId);
    
    try {
      const { data: order, error } = await supabase
        .from('customer_orders')
        .insert({
          user_id: customerUser.id,
          rider_profile_id: rider.id,
          status: 'pending',
          delivery_address: 'Lokasi saat ini',
          latitude: userLocation?.lat,
          longitude: userLocation?.lng,
          total_price: 0
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Berhasil memanggil ${rider.full_name}`);
      
      if (onCallRider) {
        onCallRider(order.id, rider);
      }
    } catch (error) {
      console.error('Error calling rider:', error);
      toast.error('Gagal memanggil rider');
    } finally {
      setRequestingRider(null);
    }
  }, [nearbyRiders, customerUser, userLocation, onCallRider]);

  // Expose callRider function to window for InfoWindow buttons
  useEffect(() => {
    (window as any).callRider = handleCallRider;
    return () => {
      delete (window as any).callRider;
    };
  }, [handleCallRider]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Mencari rider terdekat...</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Peta Tidak Tersedia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{mapError}</p>
            <Button onClick={requestLocationPermission} className="w-full mb-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </CardContent>
        </Card>

        {/* Fallback: Show riders in list format */}
        {nearbyRiders.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Rider Terdekat ({nearbyRiders.length})</h3>
            {nearbyRiders.map((rider) => (
              <Card key={rider.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={rider.photo_url} alt={rider.full_name} />
                      <AvatarFallback>{rider.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium">{rider.full_name}</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>⭐ {rider.rating.toFixed(1)}</span>
                        <span>📍 {rider.distance_km.toFixed(1)} km</span>
                        <span>⏱️ {rider.eta_minutes} min</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleCallRider(rider.id)}
                      disabled={requestingRider === rider.id}
                      size="sm"
                    >
                      {requestingRider === rider.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Phone className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Peta Rider Terdekat
          </CardTitle>
          <CardDescription>
            Ditemukan {nearbyRiders.length} rider dalam radius 10km
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Google Maps Container */}
      <Card>
        <CardContent className="p-0">
          <div 
            ref={mapContainer} 
            className="w-full h-96 rounded-lg bg-gray-100"
            style={{ minHeight: '400px' }}
          >
            {!mapLoaded && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Memuat peta...</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rider List Below Map */}
      {nearbyRiders.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Rider Tersedia</h3>
          {nearbyRiders.slice(0, 3).map((rider) => (
            <Card key={rider.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={rider.photo_url} alt={rider.full_name} />
                    <AvatarFallback>{rider.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{rider.full_name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {rider.distance_km.toFixed(1)} km
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {rider.rating.toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {rider.eta_minutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {rider.total_stock} item
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleCallRider(rider.id)}
                    disabled={requestingRider === rider.id}
                    size="sm"
                  >
                    {requestingRider === rider.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Phone className="h-4 w-4 mr-2" />
                    )}
                    Panggil
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

export default CustomerMapWithGoogle;