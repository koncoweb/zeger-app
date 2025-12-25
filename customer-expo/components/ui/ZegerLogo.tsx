import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../lib/constants';

interface ZegerLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  textColor?: string;
}

export const ZegerLogo: React.FC<ZegerLogoProps> = ({
  size = 'md',
  showText = true,
  textColor = COLORS.white
}) => {
  const logoSizes = {
    sm: { width: 60, height: 60, fontSize: 24 },
    md: { width: 80, height: 80, fontSize: 32 },
    lg: { width: 100, height: 100, fontSize: 40 }
  };

  const currentSize = logoSizes[size];

  return (
    <View style={styles.container}>
      <View style={[styles.logoContainer, { 
        width: currentSize.width, 
        height: currentSize.height 
      }]}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={[styles.logoImage, { 
            width: currentSize.width, 
            height: currentSize.height 
          }]}
          resizeMode="contain"
        />
      </View>
      {showText && (
        <>
          <Text style={[styles.logoText, { 
            color: textColor,
            fontSize: currentSize.fontSize 
          }]}>
            ZEGER
          </Text>
          <Text style={[styles.logoSubtext, { color: textColor }]}>
            Coffee On The Wheels
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoContainer: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  logoImage: {
    borderRadius: 20,
  },
  logoText: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  logoSubtext: {
    fontSize: 14,
    opacity: 0.9,
  },
});