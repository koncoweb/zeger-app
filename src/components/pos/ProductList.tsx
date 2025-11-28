import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Product, InventoryItem } from '@/lib/types';
import { ProductCard } from './ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';

interface ProductListProps {
  branchId: string;
  onAddToCart: (product: Product) => void;
}

export const ProductList = ({ branchId, onAddToCart }: ProductListProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    fetchProducts();
    fetchInventory();
  }, [branchId]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Gagal memuat produk');
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('branch_id', branchId);

      if (error) throw error;
      setInventory(data || []);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      toast.error('Gagal memuat inventory');
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!debouncedSearch) return products;

    const query = debouncedSearch.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.code.toLowerCase().includes(query)
    );
  }, [products, debouncedSearch]);

  // Get stock for a product
  const getProductStock = (productId: string): number => {
    const inventoryItem = inventory.find((item) => item.product_id === productId);
    return inventoryItem?.stock_quantity || 0;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Cari produk berdasarkan nama atau kode..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchQuery ? 'Produk tidak ditemukan' : 'Tidak ada produk tersedia'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              stock={getProductStock(product.id)}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
};
