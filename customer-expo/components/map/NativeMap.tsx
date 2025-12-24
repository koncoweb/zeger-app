import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, Polyline } from 'react-native-maps';
import { COLORS } from '@/lib/constants';

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  color?: string;
  label?: string;
  isSelected?: boolean;
}

export interface NativeMapRef {
  fitToCoordinates: (coordinates: { latitude: number; longitude: number }[], options?: any) => void;
  animateToRegion: (region: Region, duration?: number) => void;
}

export interface NativeMapProps {
  initialRegion: Region;
  userLocation?: { latitude: number; longitude: number } | null;
  markers?: MapMarker[];
  selectedMarkerId?: string | null;
  onMarkerPress?: (marker: MapMarker) => void;
  showRoute?: boolean;
  routeCoordinates?: { latitude: number; longitude: number }[];
}

export const NativeMap = forwardRef<NativeMapRef, NativeMapProps>(({
  initialRegion,
  userLocation,
  markers = [],
  onMarkerPress,
  showRoute = false,
  routeCoordinates = [],
}, ref) => {
  const mapRef = useRef<MapView>(null);

  useImperativeHandle(ref, () => ({
    fitToCoordinates: (coordinates, options) => {
      mapRef.current?.fitToCoordinates(coordinates, options);
    },
    animateToRegion: (region, duration) => {
      mapRef.current?.animateToRegion(region, duration);
    },
  }));

  // Debug log untuk troubleshooting
  useEffect(() => {
    console.log('🗺️ NativeMap initialized');
  }, []);

  const handleMapReady = () => {
    console.log('✅ Map is ready');
  };

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={initialRegion}
      showsUserLocation={false}
      showsMyLocationButton={false}
      showsCompass={true}
      mapType="standard"
      onMapReady={handleMapReady}
      loadingEnabled={true}
      loadingIndicatorColor={COLORS.primary}
      loadingBackgroundColor={COLORS.gray[100]}
    >
      {/* User Location Marker */}
      {userLocation && (
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title="Lokasi Anda"
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.userMarker}>
            <View style={styles.userMarkerInner} />
          </View>
        </Marker>
      )}

      {/* Custom Markers */}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          coordinate={{
            latitude: marker.latitude,
            longitude: marker.longitude,
          }}
          title={marker.title}
          description={marker.description}
          onPress={() => onMarkerPress?.(marker)}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View
            style={[
              styles.customMarker,
              { backgroundColor: marker.color || COLORS.primary },
              marker.isSelected && styles.customMarkerSelected,
            ]}
          >
            {marker.label && (
              <Text style={styles.markerLabel}>{marker.label}</Text>
            )}
          </View>
        </Marker>
      ))}

      {/* Route Polyline */}
      {showRoute && routeCoordinates.length >= 2 && (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor={COLORS.primary}
          strokeWidth={3}
          lineDashPattern={[10, 5]}
        />
      )}
    </MapView>
  );
});

NativeMap.displayName = 'NativeMap';

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.info,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  customMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  customMarkerSelected: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: COLORS.primary,
  },
  markerLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default NativeMap;
