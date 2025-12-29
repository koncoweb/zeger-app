import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useOfflineStore } from '../store/offlineStore';

interface OfflineState {
  isOnline: boolean;
  isConnected: boolean;
  connectionType: string | null;
  isInternetReachable: boolean | null;
}

export const useOffline = () => {
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: true,
    isConnected: true,
    connectionType: null,
    isInternetReachable: null,
  });

  const setOnlineStatus = useOfflineStore((state) => state.setOnlineStatus);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = state.isConnected && state.isInternetReachable !== false;
      
      setOfflineState({
        isOnline,
        isConnected: state.isConnected || false,
        connectionType: state.type,
        isInternetReachable: state.isInternetReachable,
      });

      // Update offline store
      setOnlineStatus(isOnline);
    });

    // Get initial network state
    NetInfo.fetch().then((state) => {
      const isOnline = state.isConnected && state.isInternetReachable !== false;
      
      setOfflineState({
        isOnline,
        isConnected: state.isConnected || false,
        connectionType: state.type,
        isInternetReachable: state.isInternetReachable,
      });

      setOnlineStatus(isOnline);
    });

    return unsubscribe;
  }, [setOnlineStatus]);

  return {
    ...offlineState,
    // Helper methods
    isOffline: !offlineState.isOnline,
    hasConnection: offlineState.isConnected,
    connectionQuality: getConnectionQuality(offlineState.connectionType),
  };
};

function getConnectionQuality(connectionType: string | null): 'excellent' | 'good' | 'poor' | 'none' {
  if (!connectionType) return 'none';
  
  switch (connectionType.toLowerCase()) {
    case 'wifi':
      return 'excellent';
    case '4g':
    case 'lte':
      return 'good';
    case '3g':
    case '2g':
      return 'poor';
    default:
      return 'none';
  }
}

export default useOffline;