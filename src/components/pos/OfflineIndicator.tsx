import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOffline } from '@/hooks/useOffline';

/**
 * Component to display offline status notification
 * Validates: Requirements 12.1
 */
export const OfflineIndicator = () => {
  const { isOffline } = useOffline();

  if (!isOffline) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        Anda sedang offline. Transaksi akan disimpan secara lokal dan disinkronkan saat koneksi kembali.
      </AlertDescription>
    </Alert>
  );
};
