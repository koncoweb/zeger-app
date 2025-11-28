import { CartItem } from './types';

/**
 * Offline transaction storage key
 */
const OFFLINE_TRANSACTIONS_KEY = 'zeger_offline_transactions';

/**
 * Interface for offline transaction
 */
export interface OfflineTransaction {
  id: string;
  items: CartItem[];
  paymentMethod: string;
  paymentDetails?: {
    cash_received?: number;
    change?: number;
  };
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  branchId: string;
  userId: string;
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  lastRetryAt?: string;
}

/**
 * Save a transaction to local storage when offline
 * Validates: Requirements 12.2
 */
export const saveOfflineTransaction = (transaction: OfflineTransaction): void => {
  try {
    const existingTransactions = getOfflineTransactions();
    const updatedTransactions = [...existingTransactions, transaction];
    localStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(updatedTransactions));
  } catch (error) {
    console.error('Failed to save offline transaction:', error);
    throw new Error('Gagal menyimpan transaksi offline');
  }
};

/**
 * Get all offline transactions from local storage
 */
export const getOfflineTransactions = (): OfflineTransaction[] => {
  try {
    const stored = localStorage.getItem(OFFLINE_TRANSACTIONS_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as OfflineTransaction[];
  } catch (error) {
    console.error('Failed to get offline transactions:', error);
    return [];
  }
};

/**
 * Update an offline transaction status
 */
export const updateOfflineTransactionStatus = (
  transactionId: string,
  status: 'pending' | 'syncing' | 'failed',
  retryCount?: number
): void => {
  try {
    const transactions = getOfflineTransactions();
    const updatedTransactions = transactions.map((t) =>
      t.id === transactionId
        ? {
            ...t,
            status,
            retryCount: retryCount !== undefined ? retryCount : t.retryCount,
            lastRetryAt: new Date().toISOString(),
          }
        : t
    );
    localStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(updatedTransactions));
  } catch (error) {
    console.error('Failed to update offline transaction status:', error);
  }
};

/**
 * Remove a transaction from local storage after successful sync
 * Validates: Requirements 12.4
 */
export const removeOfflineTransaction = (transactionId: string): void => {
  try {
    const transactions = getOfflineTransactions();
    const filteredTransactions = transactions.filter((t) => t.id !== transactionId);
    localStorage.setItem(OFFLINE_TRANSACTIONS_KEY, JSON.stringify(filteredTransactions));
  } catch (error) {
    console.error('Failed to remove offline transaction:', error);
  }
};

/**
 * Clear all offline transactions from local storage
 * Validates: Requirements 12.4
 */
export const clearOfflineTransactions = (): void => {
  try {
    localStorage.removeItem(OFFLINE_TRANSACTIONS_KEY);
  } catch (error) {
    console.error('Failed to clear offline transactions:', error);
  }
};

/**
 * Get count of pending offline transactions
 */
export const getPendingTransactionCount = (): number => {
  const transactions = getOfflineTransactions();
  return transactions.filter((t) => t.status === 'pending').length;
};

/**
 * Generate a unique ID for offline transaction
 */
export const generateOfflineTransactionId = (): string => {
  return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
