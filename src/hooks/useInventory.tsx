import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type InventoryRow = Database['public']['Tables']['inventory']['Row'];
type ProductRow = Database['public']['Tables']['products']['Row'];

export interface InventoryItem extends InventoryRow {
  product?: ProductRow;
}

interface UseInventoryReturn {
  inventory: InventoryItem[];
  loading: boolean;
  error: Error | null;
  refreshInventory: () => Promise<void>;
  getProductStock: (productId: string) => number;
}

export function useInventory(branchId: string | null): UseInventoryReturn {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInventory = useCallback(async () => {
    if (!branchId) {
      setInventory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch inventory with product details
      const { data, error: fetchError } = await supabase
        .from('inventory')
        .select(`
          *,
          product:products(*)
        `)
        .eq('branch_id', branchId)
        .order('product(name)');

      if (fetchError) throw fetchError;

      setInventory(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch inventory'));
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  // Initial fetch
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Real-time subscription for inventory updates
  useEffect(() => {
    if (!branchId) return;

    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory',
          filter: `branch_id=eq.${branchId}`,
        },
        () => {
          // Refresh inventory when changes occur
          fetchInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [branchId, fetchInventory]);

  const refreshInventory = useCallback(async () => {
    await fetchInventory();
  }, [fetchInventory]);

  const getProductStock = useCallback(
    (productId: string): number => {
      const item = inventory.find((inv) => inv.product_id === productId);
      return item?.stock_quantity || 0;
    },
    [inventory]
  );

  return {
    inventory,
    loading,
    error,
    refreshInventory,
    getProductStock,
  };
}
