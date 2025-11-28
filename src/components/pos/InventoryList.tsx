import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  code: string;
  category: string | null;
}

interface InventoryItem {
  id: string;
  product_id: string;
  stock_quantity: number;
  min_stock_level: number;
  product?: Product;
}

interface InventoryListProps {
  inventory: InventoryItem[];
  loading?: boolean;
}

export function InventoryList({ inventory, loading = false }: InventoryListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter inventory based on search query
  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) {
      return inventory;
    }

    const query = searchQuery.toLowerCase();
    return inventory.filter((item) => {
      const productName = item.product?.name?.toLowerCase() || '';
      const productCode = item.product?.code?.toLowerCase() || '';
      return productName.includes(query) || productCode.includes(query);
    });
  }, [inventory, searchQuery]);

  // Get status badge based on stock level
  const getStatusBadge = (item: InventoryItem) => {
    const stockQty = item.stock_quantity || 0;
    const minLevel = item.min_stock_level || 0;

    if (stockQty === 0) {
      return (
        <Badge variant="destructive" className="bg-red-600 text-white">
          Habis
        </Badge>
      );
    } else if (minLevel > 0 && stockQty < minLevel) {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50">
          Stok Rendah
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
          Stok Aman
        </Badge>
      );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Memuat data inventory...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-red-600">Inventory</CardTitle>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari produk berdasarkan nama atau kode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredInventory.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">
              {searchQuery ? 'Tidak ada produk yang ditemukan' : 'Tidak ada data inventory'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.product?.name || 'Unknown Product'}
                    </TableCell>
                    <TableCell>{item.product?.code || '-'}</TableCell>
                    <TableCell>{item.product?.category || '-'}</TableCell>
                    <TableCell className="text-right">
                      {item.stock_quantity || 0}
                    </TableCell>
                    <TableCell>{getStatusBadge(item)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
