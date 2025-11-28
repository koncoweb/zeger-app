import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseOfflineReturn {
  isOnline: boolean;
  isOffline: boolean;
}

/**
 * Hook to detect network status and display notifications
 * Validates: Requirements 12.1
 */
export const useOffline = (): UseOfflineReturn => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Koneksi Kembali',
        description: 'Anda kembali online. Transaksi akan disinkronkan.',
        variant: 'default',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'Tidak Ada Koneksi',
        description: 'Anda sedang offline. Transaksi akan disimpan secara lokal.',
        variant: 'destructive',
      });
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
};
