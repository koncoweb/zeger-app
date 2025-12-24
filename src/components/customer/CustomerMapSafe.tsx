import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Phone, Star, Package, Navigation, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  is_shift_active: boolean;
  has_gps?: boolean;
  branch_name?: string;
  branch_address?: string;
  photo_url?: string;
}

interface CustomerMapProps {
  customerUser?: any;
  onCallRider?: (orderId: string, rider: Rider) => void;
}

const CustomerMapSafe = ({ customerUser, onCallRider }: CustomerMapProps = {}) => {
  const [nearbyRiders, setNearbyRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingRider, setRequestingRider] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation tidak didukung oleh browser ini');
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
        setUserLocation(location);
        fetchNearbyRiders(location);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError('Tidak dapat mengakses lokasi. Pastikan izin lokasi sudah diberikan.');
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
    try {
      const { data: riders, error } = await supabase
        .from('rider_profiles')
        .select(`
          id,
          full_name,
          phone,
          rating,
          photo_url,
          lat,
          lng,
          last_updated,
          is_online,
          is_shift_active,
          branch:branches(name, address)
        `)
        .eq('is_online', true)
        .eq('is_shift_active', true)
        .not('lat', 'is', null)
        .not('lng', 'is', null);

      if (error) throw error;

      // Calculate distance and filter nearby riders
      const ridersWithDistance = riders?.map(rider => {
        const distance = calculateDistance(
          location.lat,
          location.lng,
          rider.lat!,
          rider.lng!
        );
        
        return {
          ...rider,
          distance_km: distance,
          eta_minutes: Math.round(distance * 3), // Rough estimate: 3 minutes per km
          total_stock: Math.floor(Math.random() * 50) + 10, // Mock stock data
          branch_name: rider.branch?.name,
          branch_address: rider.branch?.address
        };
      }).filter(rider => rider.distance_km <= 10) // Only show riders within 10km
        .sort((a, b) => a.distance_km - b.distance_km) || [];

      setNearbyRiders(ridersWithDistance);
    } catch (error) {
      console.error('Error fetching riders:', error);
      toast.error('Gagal memuat data rider terdekat');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleCallRider = async (rider: Rider) => {
    if (!customerUser?.id) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }

    setRequestingRider(rider.id);
    
    try {
      // Create order
      const { data: order, error } = await supabase
        .from('customer_orders')
        .insert({
          user_id: customerUser.id,
          rider_profile_id: rider.id,
          status: 'pending',
          delivery_address: 'Lokasi saat ini',
          latitude: userLocation?.lat,
          longitude: userLocation?.lng,
          total_amount: 0,
          items: []
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
  };

  const openInGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

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

  if (locationError) {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Akses Lokasi Diperlukan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{locationError}</p>
          <Button onClick={requestLocationPermission} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Rider Terdekat
          </CardTitle>
          <CardDescription>
            Ditemukan {nearbyRiders.length} rider dalam radius 10km
          </CardDescription>
        </CardHeader>
      </Card>

      {nearbyRiders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Tidak ada rider tersedia di sekitar Anda</p>
            <Button 
              onClick={() => fetchNearbyRiders(userLocation!)} 
              variant="outline" 
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardContent>
        </Card>
      ) : (
        nearbyRiders.map((rider) => (
          <Card key={rider.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={rider.photo_url} alt={rider.full_name} />
                  <AvatarFallback>{rider.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{rider.full_name}</h3>
                    <Badge variant={rider.is_online ? "default" : "secondary"}>
                      {rider.is_online ? "Online" : "Offline"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{rider.distance_km.toFixed(1)} km</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{rider.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      <span>{rider.total_stock} item</span>
                    </div>
                  </div>
                  
                  {rider.branch_name && (
                    <p className="text-xs text-gray-500 mb-2">
                      {rider.branch_name} - {rider.branch_address}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleCallRider(rider)}
                      disabled={requestingRider === rider.id}
                      className="flex-1"
                      size="sm"
                    >
                      {requestingRider === rider.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Phone className="h-4 w-4 mr-2" />
                      )}
                      Panggil Rider
                    </Button>
                    
                    <Button
                      onClick={() => openInGoogleMaps(rider.lat!, rider.lng!)}
                      variant="outline"
                      size="sm"
                    >
                      <Navigation className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default CustomerMapSafe;