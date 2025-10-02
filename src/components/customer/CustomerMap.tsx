import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Star, Clock, Navigation, Phone, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Rider {
  id: string;
  name: string;
  distance: number;
  eta: string;
  rating: number;
  phone: string;
  total_stock: number;
  is_online: boolean;
}

export function CustomerMap() {
  const [nearbyRiders, setNearbyRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation tidak didukung browser Anda');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(location);
        fetchNearbyRiders(location.lat, location.lng);
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Gagal mendapatkan lokasi Anda');
        setLoading(false);
      }
    );
  };

  const fetchNearbyRiders = async (lat: number, lng: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-nearby-riders', {
        body: {
          customer_lat: lat,
          customer_lng: lng,
          radius_km: 10
        }
      });

      if (error) throw error;

      setNearbyRiders(data.riders || []);
    } catch (error) {
      console.error('Error fetching riders:', error);
      toast.error('Gagal memuat daftar rider');
    } finally {
      setLoading(false);
    }
  };

  const callRider = (riderId: string) => {
    const rider = nearbyRiders.find(r => r.id === riderId);
    if (rider) {
      window.open(`tel:${rider.phone}`, '_self');
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
    <div className="space-y-6 p-4">
      <div className="text-center">
        <h2 className="text-xl font-bold">Pilih Rider Terdekat</h2>
        <p className="text-muted-foreground">
          {nearbyRiders.length} rider online di sekitar Anda
        </p>
      </div>

      {/* Map placeholder - in real app this would be an actual map */}
      <Card className="h-48 bg-gradient-to-b from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950">
        <CardContent className="p-4 h-full flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-12 w-12 mx-auto text-primary mb-2" />
            {userLocation ? (
              <p className="text-sm text-muted-foreground">
                Lokasi Anda: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Mencari lokasi Anda...</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {nearbyRiders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Tidak ada rider online di sekitar Anda</p>
            </CardContent>
          </Card>
        ) : (
          nearbyRiders.map((rider) => (
            <Card key={rider.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{rider.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{rider.name}</p>
                        {rider.is_online && (
                          <span className="h-2 w-2 rounded-full bg-green-500"></span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{rider.distance.toFixed(1)} km</span>
                        <Clock className="h-3 w-3" />
                        <span>{rider.eta}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{rider.rating}</span>
                        <span className="text-xs text-muted-foreground">
                          • Stok: {rider.total_stock} item
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => callRider(rider.id)}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => callRider(rider.id)}
                    >
                      <Navigation className="h-4 w-4 mr-1" />
                      Panggil
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}