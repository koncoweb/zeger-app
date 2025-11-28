import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, Plus, Minus, Split } from 'lucide-react';
import { CartItem } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  onSplitBill?: () => void;
  subtotal: number;
  discount: number;
  total: number;
}

export const Cart = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onSplitBill,
  subtotal,
  discount,
  total,
}: CartProps) => {
  const isEmpty = items.length === 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="bg-red-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Keranjang ({items.length})
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {isEmpty ? (
          // Empty Cart State
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Keranjang Kosong</p>
            <p className="text-sm text-gray-400 mt-2">
              Tambahkan produk untuk memulai transaksi
            </p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.product_id}
                    className="bg-gray-50 rounded-lg p-3 space-y-2"
                  >
                    {/* Product Info */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{item.product_name}</h4>
                        <p className="text-xs text-gray-500">{item.product_code}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onRemoveItem(item.product_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Quantity Controls and Price */}
                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            onUpdateQuantity(item.product_id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-12 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            onUpdateQuantity(item.product_id, item.quantity + 1)
                          }
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          @Rp {item.unit_price.toLocaleString('id-ID')}
                        </p>
                        <p className="font-bold text-red-600">
                          Rp {item.total_price.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Cart Summary */}
            <div className="border-t p-4 space-y-3">
              {/* Subtotal */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">
                  Rp {subtotal.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Discount */}
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Diskon</span>
                  <span className="font-semibold text-green-600">
                    -Rp {discount.toLocaleString('id-ID')}
                  </span>
                </div>
              )}

              <Separator />

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-bold text-red-600">
                  Rp {total.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {/* Split Bill Button */}
                {onSplitBill && items.length > 1 && (
                  <Button
                    onClick={onSplitBill}
                    variant="outline"
                    className="w-full h-10 border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <Split className="w-4 h-4 mr-2" />
                    Split Bill
                  </Button>
                )}

                {/* Checkout Button */}
                <Button
                  onClick={onCheckout}
                  className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg font-semibold"
                  size="lg"
                >
                  Checkout
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
