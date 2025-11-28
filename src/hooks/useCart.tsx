import { useState, useCallback, useMemo } from 'react';
import { Product, CartItem } from '@/lib/types';

interface UseCartReturn {
  items: CartItem[];
  addItem: (product: Product) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
}

export const useCart = (): UseCartReturn => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);

  // Add item to cart
  const addItem = useCallback((product: Product) => {
    setItems((prevItems) => {
      // Check if product already exists in cart
      const existingItemIndex = prevItems.findIndex(
        (item) => item.product_id === product.id
      );

      if (existingItemIndex >= 0) {
        // Product exists, increment quantity
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = existingItem.quantity + 1;
        
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          total_price: newQuantity * existingItem.unit_price,
        };
        
        return updatedItems;
      } else {
        // Product doesn't exist, add new item with quantity 1
        const newItem: CartItem = {
          product_id: product.id,
          product_name: product.name,
          product_code: product.code,
          quantity: 1,
          unit_price: product.price,
          total_price: product.price,
        };
        
        return [...prevItems, newItem];
      }
    });
  }, []);

  // Update quantity of an item
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      // If quantity is 0 or negative, remove the item
      removeItem(productId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product_id === productId
          ? {
              ...item,
              quantity,
              total_price: quantity * item.unit_price,
            }
          : item
      )
    );
  }, []);

  // Remove item from cart
  const removeItem = useCallback((productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product_id !== productId));
  }, []);

  // Clear all items from cart
  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
  }, []);

  // Calculate subtotal
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  }, [items]);

  // Calculate total (subtotal - discount)
  const total = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  // Calculate total item count
  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  return {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    discount,
    total,
    itemCount,
  };
};
