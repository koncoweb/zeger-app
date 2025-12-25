import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../../lib/constants';
import { ZegerLogo } from './ZegerLogo';

interface LoadingScreenProps {
  backgroundColor?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  backgroundColor = COLORS.primary
}) => {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ZegerLogo size="lg" showText={true} textColor={COLORS.white} />
      <ActivityIndicator 
        size="large" 
        color={COLORS.white} 
        style={styles.spinner}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    marginTop: 32,
  },
});