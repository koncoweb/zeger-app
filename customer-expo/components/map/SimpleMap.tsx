import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView from 'react-native-maps';

const SIMPLE_REGION = {
  latitude: -7.2575,
  longitude: 112.7521,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export const SimpleMap = () => {
  console.log('🧪 SimpleMap rendering...');

  const handleMapReady = () => {
    console.log('✅ SimpleMap ready!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple Map Test</Text>
      <MapView
        style={styles.map}
        initialRegion={SIMPLE_REGION}
        onMapReady={handleMapReady}
        loadingEnabled={true}
        showsUserLocation={false}
        showsMyLocationButton={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    padding: 10,
    backgroundColor: '#EA2831',
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  map: {
    flex: 1,
  },
});