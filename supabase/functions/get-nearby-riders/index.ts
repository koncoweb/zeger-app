import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NearbyRiderRequest {
  customer_lat: number;
  customer_lng: number;
  radius_km?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { customer_lat, customer_lng, radius_km = 10 }: NearbyRiderRequest = await req.json();

    console.log('Finding nearby riders for location:', { customer_lat, customer_lng, radius_km });

    // DEMO MODE: Show all riders regardless of shift status
    // Get ALL rider profiles (active riders with role 'rider')
    const { data: riders, error: ridersError } = await supabase
      .from('profiles')
      .select('id, full_name, phone, last_known_lat, last_known_lng, location_updated_at')
      .eq('role', 'rider')
      .eq('is_active', true);

    if (ridersError) {
      console.error('Error fetching riders:', ridersError);
      throw ridersError;
    }

    console.log('Total riders found:', riders?.length);

    // DEMO: Dummy locations around Jakarta if rider has no location
    const demoLocations = [
      { lat: -6.2088, lng: 106.8456 }, // Central Jakarta
      { lat: -6.1751, lng: 106.8650 }, // North Jakarta
      { lat: -6.2615, lng: 106.7837 }, // West Jakarta
      { lat: -6.2297, lng: 106.9239 }, // East Jakarta
      { lat: -6.3011, lng: 106.8165 }, // South Jakarta
    ];

    // Calculate distances for ALL riders
    const ridersWithDistance = await Promise.all(
      (riders || []).map(async (rider, index) => {
        let distance_km = 9999;
        let eta_minutes = 0;
        let is_online = false;
        let rider_lat = rider.last_known_lat;
        let rider_lng = rider.last_known_lng;

        // DEMO: Use dummy location if rider has no location
        if (!rider_lat || !rider_lng) {
          const demoLoc = demoLocations[index % demoLocations.length];
          rider_lat = demoLoc.lat;
          rider_lng = demoLoc.lng;
          console.log(`Using demo location for ${rider.full_name}: ${rider_lat}, ${rider_lng}`);
        }

        // Calculate distance
        if (rider_lat && rider_lng) {
          // Haversine formula for distance calculation
          const R = 6371; // Earth radius in km
          const dLat = (customer_lat - rider_lat) * Math.PI / 180;
          const dLng = (customer_lng - rider_lng) * Math.PI / 180;
          const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rider_lat * Math.PI / 180) * 
            Math.cos(customer_lat * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distance_km = Math.round((R * c) * 100) / 100;

          // Calculate ETA (assuming 20 km/h average speed)
          eta_minutes = Math.round((distance_km / 20) * 60);

          // DEMO: Mark all riders as online for testing
          is_online = true;
        }

        // Get rider inventory count
        const { data: inventory } = await supabase
          .from('inventory')
          .select('stock_quantity')
          .eq('rider_id', rider.id);

        const total_stock = inventory?.reduce((sum, item) => sum + (item.stock_quantity || 0), 0) || 0;

        return {
          id: rider.id,
          full_name: rider.full_name,
          phone: rider.phone || '',
          distance_km,
          eta_minutes,
          total_stock,
          rating: 4.5, // TODO: Implement real rating system
          lat: rider_lat, // Use demo location if original is null
          lng: rider_lng, // Use demo location if original is null
          last_updated: rider.location_updated_at,
          is_online
        };
      })
    );

    // Sort: online riders first (by distance), then offline riders
    const nearbyRiders = ridersWithDistance.sort((a, b) => {
      if (a.is_online && !b.is_online) return -1;
      if (!a.is_online && b.is_online) return 1;
      return a.distance_km - b.distance_km;
    });

    console.log('Nearby riders found:', nearbyRiders.length);

    return new Response(
      JSON.stringify({ riders: nearbyRiders }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-nearby-riders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
