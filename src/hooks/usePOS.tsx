import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '@/lib/types';
import { usePOSAuth } from './usePOSAuth';
import { useOffline } from './useOffline';
import {
  saveOfflineTransaction,
  generateOfflineTransactionId,
  OfflineTransaction,
} from '@/lib/offline-storage';
import { toast } from '@/hooks/use-toast';

interface CreateTransactionParams {
  items: CartItem[];
  paymentMethod: string;
  paymentDetails?: {
    cash_received?: number;
    change?: number;
  };
}

interface Transaction {
  id: string;
  transaction_number: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string;
  status: string;
  transaction_date: string;
}

interface UsePOSReturn {
  createTransaction: (params: CreateTransactionParams) => Promise<Transaction>;
  createSplitBillTransactions: (
    itemGroups: CartItem[][],
    paymentMethod: string,
    paymentDetails?: any
  ) => Promise<Transaction[]>;
  loading: boolean;
  error: Error | null;
}

export const usePOS = (): UsePOSReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { profile } = usePOSAuth();
  const { isOffline } = useOffline();

  /**
   * Generate transaction number with format: ZEG-{branch_code}-{YYYYMMDD}-{sequence}
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
   * Create a new transaction with all related records
   */
  const createTransaction = async ({
    items,
    paymentMethod,
    paymentDetails,
  }: CreateTransactionParams): Promise<Transaction> => {
    setLoading(true);
    setError(null);

    try {
      if (!profile?.branch_id) {
        throw new Error('Branch ID tidak ditemukan');
      }

      if (items.length === 0) {
        throw new Error('Keranjang kosong');
      }

      // If offline, save to local storage
      if (isOffline) {
        const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);
        const discountAmount = 0;
        const finalAmount = totalAmount - discountAmount;

        const offlineTransaction: OfflineTransaction = {
          id: generateOfflineTransactionId(),
          items,
          paymentMethod,
          paymentDetails,
          totalAmount,
          discountAmount,
          finalAmount,
          branchId: profile.branch_id,
          userId: profile.id,
          timestamp: new Date().toISOString(),
          status: 'pending',
          retryCount: 0,
        };

        saveOfflineTransaction(offlineTransaction);

        toast({
          title: 'Transaksi Disimpan Offline',
          description: 'Transaksi akan disinkronkan saat koneksi kembali.',
          variant: 'default',
        });

        setLoading(false);

        // Return a mock transaction for offline mode
        return {
          id: offlineTransaction.id,
          transaction_number: `OFFLINE-${offlineTransaction.id}`,
          total_amount: totalAmount,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          payment_method: paymentMethod,
          status: 'pending',
          transaction_date: offlineTransaction.timestamp,
        } as Transaction;
      }

      // Get branch info for branch_code
      const { data: branch, error: branchError } = await supabase
        .from('branches')
        .select('code, branch_code')
        .eq('id', profile.branch_id)
        .single();

      if (branchError || !branch) {
        throw new Error('Gagal mengambil informasi branch');
      }

      const branchCode = branch.branch_code || branch.code;

      // Calculate totals
      const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);
      const discountAmount = 0; // TODO: Implement discount logic
      const finalAmount = totalAmount - discountAmount;

      // Generate transaction number
      const transactionNumber = await generateTransactionNumber(branchCode);

      // Start transaction - Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          transaction_number: transactionNumber,
          branch_id: profile.branch_id,
          total_amount: totalAmount,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          payment_method: paymentMethod,
          status: 'completed',
          transaction_date: new Date().toISOString(),
          metadata: paymentDetails ? { payment_details: paymentDetails } : null,
        })
        .select()
        .single();

      if (transactionError || !transaction) {
        throw new Error('Gagal membuat transaksi: ' + transactionError?.message);
      }

      // Create transaction items
      const transactionItems = items.map((item) => ({
        transaction_id: transaction.id,
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
        await supabase.from('transactions').delete().eq('id', transaction.id);
        throw new Error('Gagal menyimpan item transaksi: ' + itemsError.message);
      }

      // Update inventory and create stock movements
      for (const item of items) {
        // Get current inventory
        const { data: inventory, error: inventoryFetchError } = await supabase
          .from('inventory')
          .select('id, stock_quantity')
          .eq('product_id', item.product_id)
          .eq('branch_id', profile.branch_id)
          .single();

        if (inventoryFetchError || !inventory) {
          console.error('Inventory not found for product:', item.product_id);
          continue;
        }

        // Check if sufficient stock
        if ((inventory.stock_quantity || 0) < item.quantity) {
          // Rollback: Delete transaction and items
          await supabase.from('transaction_items').delete().eq('transaction_id', transaction.id);
          await supabase.from('transactions').delete().eq('id', transaction.id);
          throw new Error(`Stok tidak mencukupi untuk ${item.product_name}`);
        }

        // Update inventory - decrease stock
        const newStockQuantity = (inventory.stock_quantity || 0) - item.quantity;
        
        const { error: inventoryUpdateError } = await supabase
          .from('inventory')
          .update({
            stock_quantity: newStockQuantity,
            last_updated: new Date().toISOString(),
          })
          .eq('id', inventory.id);

        if (inventoryUpdateError) {
          console.error('Failed to update inventory:', inventoryUpdateError);
          // Continue with other items, but log the error
        }

        // Create stock movement record
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            product_id: item.product_id,
            branch_id: profile.branch_id,
            movement_type: 'out',
            quantity: item.quantity,
            reference_type: 'transaction',
            reference_id: transaction.id,
            notes: `Penjualan - ${transactionNumber}`,
            created_by: profile.id,
            status: 'completed',
          });

        if (movementError) {
          console.error('Failed to create stock movement:', movementError);
          // Continue with other items, but log the error
        }
      }

      setLoading(false);
      return transaction as Transaction;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setLoading(false);
      throw error;
    }
  };

  /**
   * Create multiple transactions for split bill
   * Each group of items becomes a separate transaction
   */
  const createSplitBillTransactions = async (
    itemGroups: CartItem[][],
    paymentMethod: string,
    paymentDetails?: any
  ): Promise<Transaction[]> => {
    setLoading(true);
    setError(null);

    try {
      if (!profile?.branch_id) {
        throw new Error('Branch ID tidak ditemukan');
      }

      if (itemGroups.length === 0) {
        throw new Error('Tidak ada grup untuk split bill');
      }

      // Validate that all groups have items
      const validGroups = itemGroups.filter((group) => group.length > 0);
      if (validGroups.length === 0) {
        throw new Error('Semua grup kosong');
      }

      // Calculate original total to validate split
      const originalTotal = validGroups.reduce((sum, group) => {
        return sum + group.reduce((groupSum, item) => groupSum + item.total_price, 0);
      }, 0);

      // Create a transaction for each group
      const transactions: Transaction[] = [];

      for (let i = 0; i < validGroups.length; i++) {
        const groupItems = validGroups[i];
        
        try {
          // Create transaction for this group
          const transaction = await createTransaction({
            items: groupItems,
            paymentMethod,
            paymentDetails,
          });

          transactions.push(transaction);
        } catch (err) {
          // If any transaction fails, we should ideally rollback all previous transactions
          // For now, we'll throw an error and let the caller handle it
          console.error(`Failed to create transaction for group ${i + 1}:`, err);
          
          // Attempt to rollback previously created transactions
          for (const prevTransaction of transactions) {
            try {
              // Delete transaction items
              await supabase
                .from('transaction_items')
                .delete()
                .eq('transaction_id', prevTransaction.id);
              
              // Delete transaction
              await supabase
                .from('transactions')
                .delete()
                .eq('id', prevTransaction.id);
              
              // Note: Inventory rollback would be complex, might need manual intervention
            } catch (rollbackErr) {
              console.error('Failed to rollback transaction:', rollbackErr);
            }
          }
          
          throw new Error(`Gagal membuat transaksi untuk grup ${i + 1}: ${(err as Error).message}`);
        }
      }

      // Validate that sum of all transaction totals equals original total
      const splitTotal = transactions.reduce((sum, t) => sum + t.final_amount, 0);
      if (Math.abs(splitTotal - originalTotal) > 0.01) {
        console.warn('Split bill total mismatch:', { splitTotal, originalTotal });
      }

      // Mark all transactions as completed (they already are, but this is explicit)
      // All transactions should have status 'completed' from createTransaction

      setLoading(false);
      return transactions;
    } catch (err) {
      const error = err as Error;
      setError(error);
      setLoading(false);
      throw error;
    }
  };

  return {
    createTransaction,
    createSplitBillTransactions,
    loading,
    error,
  };
};
