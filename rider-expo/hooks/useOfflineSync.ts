import { useCallback } from 'react';
import { useOffline } from './useOffline';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useToast } from './useToast';

export interface OfflineData {
  id: string;
  type: 'transaction' | 'location' | 'checkpoint' | 'attendance' | 'stock_movement' | 'order_update';
  data: any;
  createdAt: string;
  synced: boolean;
  retryCount?: number;
  lastError?: string;
}

export const useOfflineSync = () => {
  const { 
    isOnline, 
    queueTransaction, 
    queueLocation, 
    queueCheckpoint,
    syncAll,
    isSyncing 
  } = useOffline();
  
  const { profile } = useAuthStore();
  const { showToast } = useToast();

  // Enhanced queue functions with better error handling
  const queueSale = useCallback(async (saleData: any) => {
    try {
      if (isOnline) {
        // Try direct sync first
        const { data, error } = await supabase
          .from('transactions')
          .insert({
            ...saleData,
            rider_id: profile?.id,
            created_at: new Date().toISOString(),
            status: 'completed'
          })
          .select()
          .single();

        if (error) throw error;
        
        showToast('Transaksi berhasil disimpan', 'success');
        return data;
      } else {
        // Queue for offline sync
        await queueTransaction({
          ...saleData,
          rider_id: profile?.id,
          created_at: new Date().toISOString(),
          status: 'completed'
        });
        
        showToast('Transaksi disimpan offline, akan disinkron saat online', 'info');
        return null;
      }
    } catch (error) {
      console.error('Error saving sale:', error);
      
      // Fallback to offline queue
      await queueTransaction({
        ...saleData,
        rider_id: profile?.id,
        created_at: new Date().toISOString(),
        status: 'completed'
      });
      
      showToast('Transaksi disimpan offline, akan disinkron saat online', 'warning');
      return null;
    }
  }, [isOnline, profile?.id, queueTransaction, showToast]);

  const queueStockMovement = useCallback(async (stockData: any) => {
    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('stock_movements')
          .insert({
            ...stockData,
            rider_id: profile?.id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        
        showToast('Pergerakan stok berhasil disimpan', 'success');
        return data;
      } else {
        await queueTransaction({
          table: 'stock_movements',
          ...stockData,
          rider_id: profile?.id,
          created_at: new Date().toISOString()
        });
        
        showToast('Pergerakan stok disimpan offline', 'info');
        return null;
      }
    } catch (error) {
      console.error('Error saving stock movement:', error);
      
      await queueTransaction({
        table: 'stock_movements',
        ...stockData,
        rider_id: profile?.id,
        created_at: new Date().toISOString()
      });
      
      showToast('Pergerakan stok disimpan offline', 'warning');
      return null;
    }
  }, [isOnline, profile?.id, queueTransaction, showToast]);

  const queueAttendance = useCallback(async (attendanceData: any) => {
    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('rider_attendance')
          .insert({
            ...attendanceData,
            rider_id: profile?.id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        
        showToast('Absensi berhasil disimpan', 'success');
        return data;
      } else {
        await queueCheckpoint({
          table: 'rider_attendance',
          ...attendanceData,
          rider_id: profile?.id,
          created_at: new Date().toISOString()
        });
        
        showToast('Absensi disimpan offline', 'info');
        return null;
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      
      await queueCheckpoint({
        table: 'rider_attendance',
        ...attendanceData,
        rider_id: profile?.id,
        created_at: new Date().toISOString()
      });
      
      showToast('Absensi disimpan offline', 'warning');
      return null;
    }
  }, [isOnline, profile?.id, queueCheckpoint, showToast]);

  const queueOrderUpdate = useCallback(async (orderId: string, updateData: any) => {
    try {
      if (isOnline) {
        const { data, error } = await supabase
          .from('customer_orders')
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)
          .select()
          .single();

        if (error) throw error;
        
        showToast('Status pesanan berhasil diupdate', 'success');
        return data;
      } else {
        await queueTransaction({
          table: 'customer_orders',
          operation: 'update',
          id: orderId,
          ...updateData,
          updated_at: new Date().toISOString()
        });
        
        showToast('Update pesanan disimpan offline', 'info');
        return null;
      }
    } catch (error) {
      console.error('Error updating order:', error);
      
      await queueTransaction({
        table: 'customer_orders',
        operation: 'update',
        id: orderId,
        ...updateData,
        updated_at: new Date().toISOString()
      });
      
      showToast('Update pesanan disimpan offline', 'warning');
      return null;
    }
  }, [isOnline, queueTransaction, showToast]);

  const queueLocationUpdate = useCallback(async (location: { latitude: number; longitude: number; accuracy?: number }) => {
    if (!profile?.id) return;

    try {
      await queueLocation(profile.id, {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error queuing location:', error);
    }
  }, [profile?.id, queueLocation]);

  const forceSyncAll = useCallback(async () => {
    if (!isOnline) {
      showToast('Tidak dapat sinkron saat offline', 'error');
      return false;
    }

    if (isSyncing) {
      showToast('Sinkronisasi sedang berlangsung', 'info');
      return false;
    }

    try {
      showToast('Memulai sinkronisasi...', 'info');
      await syncAll();
      showToast('Sinkronisasi berhasil', 'success');
      return true;
    } catch (error) {
      console.error('Error during sync:', error);
      showToast('Gagal sinkronisasi, coba lagi nanti', 'error');
      return false;
    }
  }, [isOnline, isSyncing, syncAll, showToast]);

  return {
    // Queue functions
    queueSale,
    queueStockMovement,
    queueAttendance,
    queueOrderUpdate,
    queueLocationUpdate,
    
    // Sync functions
    forceSyncAll,
    
    // Status
    isOnline,
    isSyncing,
  };
};