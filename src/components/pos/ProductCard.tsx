import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Package } from 'lucide-react';
import { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
  stock: number;
  onAddToCart: (product: Product) => void;
}

export const ProductCard = ({ product, stock, onAddToCart }: ProductCardProps) => {
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= 10;

  const handleAddToCart = () => {
    // Prevent adding if out of stock
    if (isOutOfStock) {
      return;
    }
    onAddToCart(product);
  };

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${isOutOfStock ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="w-12 h-12 text-gray-400" />
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <div>
            <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
              {product.name}
            </h3>
            <p className="text-xs text-gray-500">{product.code}</p>
          </div>

          {/* Category */}
          {product.category && (
            <Badge variant="outline" className="text-xs">
              {product.category}
            </Badge>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-red-600">
                Rp {product.price.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Stock Status */}
          <div className="flex items-center justify-between">
            <div className="text-xs">
              {isOutOfStock ? (
                <Badge variant="destructive">Habis</Badge>
              ) : isLowStock ? (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Stok: {stock}
                </Badge>
              ) : (
                <span className="text-gray-600">Stok: {stock}</span>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="w-full bg-red-600 hover:bg-red-700"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Tambah
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
