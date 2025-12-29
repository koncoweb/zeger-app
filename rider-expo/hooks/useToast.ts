import { useCallback } from 'react';
import { Alert, Platform } from 'react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export const useToast = () => {
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    if (Platform.OS === 'web') {
      // For web, we'll use a simple alert for now
      // In a real app, you might want to use a proper toast library
      console.log(`[${type.toUpperCase()}] ${message}`);
      
      // You can integrate with a web toast library here
      // For example: toast(message, { type });
    } else {
      // For mobile, use Alert
      const title = {
        success: 'Berhasil',
        error: 'Error',
        warning: 'Peringatan',
        info: 'Info'
      }[type];

      Alert.alert(title, message);
    }
  }, []);

  return { showToast };
};