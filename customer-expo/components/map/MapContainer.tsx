import React from 'react';
import { Platform } from 'react-native';
import NativeMap from './NativeMap';
import NativeMapWeb from './NativeMap.web';

interface MapContainerProps {
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  nearbyRiders?: Array<{
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    distance?: number;
    status?: string;
  }>;
  selectedRider?: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  onRiderSelect?: (rider: any) => void;
  showRoute?: boolean;
  routeCoordinates?: Array<{
    latitude: number;
    longitude: number;
  }>;
  style?: any;
  onMapReady?: () => void;
  onRegionChange?: (region: any) => void;
}

export const MapContainer: React.FC<MapContainerProps> = (props) => {
  // Use platform-specific map implementation
  if (Platform.OS === 'web') {
    return <NativeMapWeb {...props} />;
  }
  
  return <NativeMap {...props} />;
};

export default MapContainer;