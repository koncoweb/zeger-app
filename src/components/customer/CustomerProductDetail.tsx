import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Minus, Flame, ShoppingBag, Bike } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  custom_options: any;
}

interface CustomerProductDetailProps {
  product: Product;
  orderType: 'dine-in' | 'take-away' | 'delivery';
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number, customizations: any) => void;
  cartItemCount: number;
  onViewCart: () => void;
}

export function CustomerProductDetail({ 
  product, 
  orderType,
  onBack, 
  onAddToCart,
  cartItemCount,
  onViewCart
}: CustomerProductDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [temperature, setTemperature] = useState<'hot' | 'ice'>('ice');
  const [size, setSize] = useState<'small' | 'large' | '200ml' | '1lt'>('small');
  const [blend, setBlend] = useState<'senja' | 'pagi'>('senja');
  const [iceLevel, setIceLevel] = useState<'less' | 'normal'>('normal');
  const [sugarLevel, setSugarLevel] = useState<'less' | 'normal'>('normal');
  const [milk, setMilk] = useState<'regular' | 'oat'>('regular');
  const [toppings, setToppings] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const toppingOptions = [
    { id: 'espresso', name: 'Espresso / Shot', price: 5000, icon: '☕' },
    { id: 'oreo', name: 'Oreo Crumb', price: 4000, icon: '🍪' },
    { id: 'cheese', name: 'Cheese', price: 5000, icon: '🧀' },
    { id: 'jelly', name: 'Jelly Pearl', price: 5000, icon: '🔮' },
    { id: 'icecream', name: 'Ice Cream/Scoop', price: 5000, icon: '🍦' },
  ];

  const getCustomPrice = () => {
    let price = product.price;
    
    // Size pricing
    if (size === 'large') price += 5000;
    if (size === '200ml') price += 3000;
    if (size === '1lt') price += 15000;
    
    // Add toppings
    toppings.forEach(toppingId => {
      const topping = toppingOptions.find(t => t.id === toppingId);
      if (topping) price += topping.price;
    });
    
    return price;
  };

  const toggleTopping = (toppingId: string) => {
    setToppings(prev => 
      prev.includes(toppingId) 
        ? prev.filter(id => id !== toppingId)
        : [...prev, toppingId]
    );
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity, {
      temperature, size, blend, iceLevel, sugarLevel, milk, toppings, notes
    });
  };

  const totalPrice = getCustomPrice() * quantity;

  return (
    <div className="min-h-screen bg-[#f8f6f6]">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white sticky top-0 shadow-sm z-10">
        <button onClick={onBack} className="text-gray-900">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{product.name}</h1>
        <div className="w-8"></div>
      </header>

      <main className="p-4 space-y-6">
        {/* Product Card with Image */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center">
          <img 
            src={product.image_url || '/placeholder.svg'} 
            alt={product.name}
            className="w-40 h-64 object-cover rounded-lg"
          />
          
          {/* Badge Icons Row */}
          <div className="flex items-center space-x-2 mt-4">
            <div className="bg-red-100 p-2 rounded-full">
              <Flame className="h-5 w-5 text-[#EA2831]" />
            </div>
            <div className="bg-red-100 p-2 rounded-full">
              <ShoppingBag className="h-5 w-5 text-[#EA2831]" />
            </div>
            <div className="bg-red-100 p-2 rounded-full">
              <Bike className="h-5 w-5 text-[#EA2831]" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mt-4 text-gray-900">{product.name}</h2>
          <p className="text-center text-gray-600 mt-2 text-sm">
            {product.description || 'Premium quality coffee'}
          </p>
        </div>

        {/* Customization Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          {/* Temp */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Temp</h3>
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => setTemperature('hot')}
                className={cn(
                  "col-span-1 py-3 px-4 rounded-lg font-medium transition-all",
                  temperature === 'hot' 
                    ? "bg-indigo-600 text-white shadow-md" 
                    : "bg-[#f8f6f6] text-gray-700"
                )}
              >
                Hot
              </button>
              <button 
                onClick={() => setTemperature('ice')}
                className={cn(
                  "col-span-2 py-3 px-4 rounded-lg font-medium transition-all",
                  temperature === 'ice' 
                    ? "bg-indigo-600 text-white shadow-md" 
                    : "bg-[#f8f6f6] text-gray-700"
                )}
              >
                Ice
              </button>
            </div>
          </div>

          {/* Size */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Size</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'small', label: 'Small' },
                { value: 'large', label: 'Large' },
                { value: '200ml', label: '200ml' },
                { value: '1lt', label: '1 Lt' }
              ].map((sizeOption) => (
                <button
                  key={sizeOption.value}
                  onClick={() => setSize(sizeOption.value as any)}
                  className={cn(
                    "py-3 px-4 rounded-lg font-medium transition-all",
                    size === sizeOption.value 
                      ? "bg-indigo-600 text-white shadow-md" 
                      : "bg-[#f8f6f6] text-gray-700"
                  )}
                >
                  {sizeOption.label}
                </button>
              ))}
            </div>
          </div>

          {/* Blend */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Blend</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setBlend('senja')}
                className={cn(
                  "py-3 px-4 rounded-lg font-medium transition-all",
                  blend === 'senja' 
                    ? "bg-indigo-600 text-white shadow-md" 
                    : "bg-[#f8f6f6] text-gray-700"
                )}
              >
                Senja
              </button>
              <button 
                onClick={() => setBlend('pagi')}
                className={cn(
                  "py-3 px-4 rounded-lg font-medium transition-all",
                  blend === 'pagi' 
                    ? "bg-indigo-600 text-white shadow-md" 
                    : "bg-[#f8f6f6] text-gray-700"
                )}
              >
                Pagi
              </button>
            </div>
          </div>

          {/* Ice Level */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Ice Level</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setIceLevel('less')}
                className={cn(
                  "py-3 px-4 rounded-lg font-medium transition-all",
                  iceLevel === 'less' 
                    ? "bg-indigo-600 text-white shadow-md" 
                    : "bg-[#f8f6f6] text-gray-700"
                )}
              >
                Less
              </button>
              <button 
                onClick={() => setIceLevel('normal')}
                className={cn(
                  "py-3 px-4 rounded-lg font-medium transition-all",
                  iceLevel === 'normal' 
                    ? "bg-indigo-600 text-white shadow-md" 
                    : "bg-[#f8f6f6] text-gray-700"
                )}
              >
                Normal
              </button>
            </div>
          </div>

          {/* Sugar Level */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Sugar Level</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setSugarLevel('less')}
                className={cn(
                  "py-3 px-4 rounded-lg font-medium transition-all",
                  sugarLevel === 'less' 
                    ? "bg-indigo-600 text-white shadow-md" 
                    : "bg-[#f8f6f6] text-gray-700"
                )}
              >
                Less
              </button>
              <button 
                onClick={() => setSugarLevel('normal')}
                className={cn(
                  "py-3 px-4 rounded-lg font-medium transition-all",
                  sugarLevel === 'normal' 
                    ? "bg-indigo-600 text-white shadow-md" 
                    : "bg-[#f8f6f6] text-gray-700"
                )}
              >
                Normal
              </button>
            </div>
          </div>

          {/* Milk */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Milk</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setMilk('regular')}
                className={cn(
                  "py-3 px-4 rounded-lg font-medium transition-all",
                  milk === 'regular' 
                    ? "bg-indigo-600 text-white shadow-md" 
                    : "bg-[#f8f6f6] text-gray-700"
                )}
              >
                Regular
              </button>
              <button 
                onClick={() => setMilk('oat')}
                className={cn(
                  "py-3 px-4 rounded-lg font-medium transition-all",
                  milk === 'oat' 
                    ? "bg-indigo-600 text-white shadow-md" 
                    : "bg-[#f8f6f6] text-gray-700"
                )}
              >
                Oat
              </button>
            </div>
          </div>

          {/* Toppings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Topping</h3>
            <div className="space-y-2">
              {toppingOptions.map((topping) => (
                <label
                  key={topping.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all",
                    toppings.includes(topping.id)
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-200 bg-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={toppings.includes(topping.id)}
                      onChange={() => toggleTopping(topping.id)}
                      className="w-5 h-5 text-indigo-600 rounded"
                    />
                    <span className="text-2xl">{topping.icon}</span>
                    <span className="font-medium text-gray-900">{topping.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-indigo-600">
                    +Rp {topping.price.toLocaleString('id-ID')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Catatan (Optional)</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan khusus..."
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-indigo-600 focus:outline-none resize-none"
              rows={3}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white p-4 rounded-t-xl shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-lg font-bold text-gray-900">
              Rp{totalPrice.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center text-gray-900"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-lg font-bold text-gray-900">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center text-gray-900"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <button 
          onClick={handleAddToCart}
          className="w-full bg-[#EA2831] text-white py-4 rounded-lg text-lg font-semibold shadow-lg"
        >
          Tambah ke Keranjang
        </button>
        {/* Home Indicator Bar */}
        <div className="w-32 h-1.5 bg-gray-300 rounded-full mx-auto mt-4"></div>
      </footer>
    </div>
  );
}