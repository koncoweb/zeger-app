import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePOSAuth } from './usePOSAuth';
import { useOffline } from './useOffline';
import {
  getOfflineTransactions,
  removeOfflineTransaction,
  updateOfflineTransactionStatus,
  clearOfflineTransactions,
  OfflineTransaction,
} from '@/lib/offline-storage';
import { toast } from '@/hooks/use-toast';

interface UseOfflineSyncReturn {
  isSyncing: boolean;
  pendingCount: number;
  syncNow: () => Promise<void>;
}

/**
 * Hook to sync offline transactions when connection is restored
 * Validates: Requirements 12.3, 12.4, 12.5
 */
export const useOfflineSync = (): UseOfflineSyncReturn => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { isOnline } = useOffline();
  const { profile } = usePOSAuth();

  /**
   * Calculate exponential backoff delay
   * Validates: Requirements 12.5
   */
  const getBackoffDelay = (retryCount: number): number => {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 60s
    const delay = Math.min(Math.pow(2, retryCount) * 1000, 60000);
    return delay;
  };

  /**
   * Generate transaction number for synced transaction
   */
  const generateTransactionNumber = async (branchCode: string): Promise<string> => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD

    // Get today's transaction count for this branch to generate sequence
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const { count, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('branch_id', profile?.branch_id)
      .gte('transaction_date', startOfDay)
      .lte('transaction_date', endOfDay);

    if (countError) {
      console.error('Error counting transactions:', countError);
    }

    const sequence = ((count || 0) + 1).toString().padStart(4, '0');

    return `ZEG-${branchCode}-${dateStr}-${sequence}`;
  };

  /**
   * Sync a single offline transaction to the database
   */
  const syncTransaction = async (transaction: OfflineTransaction): Promise<boolean> => {
    try {
      // Update status to syncing
      updateOfflineTransactionStatus(transaction.id, 'syncing');

      // Get branch info for branch_code
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .select('code, branch_code')
        .eq('id', transaction.branchId)
        .single();

      if (branchError || !branch) {
        throw new Error('Gagal mengambil informasi branch');
      }

      const branchCode = branch.branch_code || branch.code;

      // Generate transaction number
      const transactionNumber = await generateTransactionNumber(branchCode);

      // Create transaction record
      const { data: dbTransaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          transaction_number: transactionNumber,
          branch_id: transaction.branchId,
          total_amount: transaction.totalAmount,
          discount_amount: transaction.discountAmount,
          final_amount: transaction.finalAmount,
          payment_method: transaction.paymentMethod,
          status: 'completed',
          transaction_date: transaction.timestamp,
          metadata: transaction.paymentDetails
            ? { payment_details: transaction.paymentDetails }
            : null,
        })
        .select()
        .single();

      if (transactionError || !dbTransaction) {
        throw new Error('Gagal membuat transaksi: ' + transactionError?.message);
      }

      // Create transaction items
      const transactionItems = transaction.items.map((item) => ({
        transaction_id: dbTransaction.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(transactionItems);

      if (itemsError) {
        // Rollback: Delete the transaction
        await supabase.from('transactions').delete().eq('id', dbTransaction.id);
        throw new Error('Gagal menyimpan item transaksi: ' + itemsError.message);
      }

      // Update inventory and create stock movements
      for (const item of transaction.items) {
        // Get current inventory
        const { data: inventory, error: inventoryFetchError } = await supabase
          .from('inventory')
          .select('id, stock_quantity')
          .eq('product_id', item.product_id)
          .eq('branch_id', transaction.branchId)
          .single();

        if (inventoryFetchError || !inventory) {
          console.error('Inventory not found for product:', item.product_id);
          continue;
        }

        // Update inventory - decrease stock
        const newStockQuantity = Math.max(0, (inventory.stock_quantity || 0) - item.quantity);

        const { error: inventoryUpdateError } = await supabase
          .from('inventory')
          .update({
            stock_quantity: newStockQuantity,
            last_updated: new Date().toISOString(),
          })
          .eq('id', inventory.id);

        if (inventoryUpdateError) {
          console.error('Failed to update inventory:', inventoryUpdateError);
        }

        // Create stock movement record
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            product_id: item.product_id,
            branch_id: transaction.branchId,
            movement_type: 'out',
            quantity: item.quantity,
            reference_type: 'transaction',
            reference_id: dbTransaction.id,
            notes: `Penjualan (Offline Sync) - ${transactionNumber}`,
            created_by: transaction.userId,
            status: 'completed',
          });

        if (movementError) {
          console.error('Failed to create stock movement:', movementError);
        }
      }

      // Remove from local storage after successful sync
      // Validates: Requirements 12.4
      removeOfflineTransaction(transaction.id);

      return true;
    } catch (error) {
      console.error('Failed to sync transaction:', error);

      // Update status to failed and increment retry count
      updateOfflineTransactionStatus(
        transaction.id,
        'failed',
        transaction.retryCount + 1
      );

      return false;
    }
  };

  /**
   * Sync all pending offline transactions
   * Validates: Requirements 12.3
   */
  const syncAllTransactions = useCallback(async () => {
    if (!isOnline || isSyncing || !profile?.branch_id) {
      return;
    }

    const pendingTransactions = getOfflineTransactions().filter(
      (t) => t.status === 'pending' || t.status === 'failed'
    );

    if (pendingTransactions.length === 0) {
      return;
    }

    setIsSyncing(true);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const transaction of pendingTransactions) {
        // Check if we should retry based on backoff
        if (transaction.status === 'failed' && transaction.lastRetryAt) {
          const timeSinceLastRetry =
            Date.now() - new Date(transaction.lastRetryAt).getTime();
          const backoffDelay = getBackoffDelay(transaction.retryCount);

          if (timeSinceLastRetry < backoffDelay) {
            // Skip this transaction, not enough time has passed
            continue;
          }
        }

        const success = await syncTransaction(transaction);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      // Update pending count
      const remaining = getOfflineTransactions().length;
      setPendingCount(remaining);

      if (successCount > 0) {
        toast({
          title: 'Sinkronisasi Berhasil',
          description: `${successCount} transaksi berhasil disinkronkan.`,
          variant: 'default',
        });
      }

      if (failCount > 0) {
        toast({
          title: 'Sinkronisasi Gagal',
          description: `${failCount} transaksi gagal disinkronkan. Akan dicoba lagi.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Error Sinkronisasi',
        description: 'Terjadi kesalahan saat sinkronisasi. Akan dicoba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, profile]);

  /**
   * Manual sync trigger
   */
  const syncNow = useCallback(async () => {
    await syncAllTransactions();
  }, [syncAllTransactions]);

  // Auto-sync when coming back online
  // Validates: Requirements 12.3
  useEffect(() => {
    if (isOnline && !isSyncing) {
      // Delay sync slightly to ensure connection is stable
      const timer = setTimeout(() => {
        syncAllTransactions();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, syncAllTransactions, isSyncing]);

  // Update pending count on mount and when online status changes
  useEffect(() => {
    const count = getOfflineTransactions().filter(
      (t) => t.status === 'pending' || t.status === 'failed'
    ).length;
    setPendingCount(count);
  }, [isOnline]);

  return {
    isSyncing,
    pendingCount,
    syncNow,
  };
};
