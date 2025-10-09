import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Gift, Package, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavigationProps {
  activeView: string;
  activeOrdersCount: number;
  onNavigate: (view: string) => void;
}

export function BottomNavigation({ activeView, activeOrdersCount, onNavigate }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
      <div className="flex items-center justify-around py-3 max-w-md mx-auto">
        <Button
          variant="ghost"
          className={cn(
            "flex-col h-auto py-2 gap-1 transition-colors",
            activeView === 'home' ? 'text-red-500' : 'text-gray-500'
          )}
          onClick={() => onNavigate('home')}
        >
          <Home className={cn("h-6 w-6", activeView === 'home' && "fill-red-500")} />
          <span className="text-xs font-medium">Home</span>
        </Button>
        
        <Button
          variant="ghost"
          className={cn(
            "flex-col h-auto py-2 gap-1 transition-colors",
            activeView === 'menu' ? 'text-red-500' : 'text-gray-500'
          )}
          onClick={() => onNavigate('menu')}
        >
          <Gift className={cn("h-6 w-6", activeView === 'menu' && "fill-red-500")} />
          <span className="text-xs font-medium">Menu</span>
        </Button>
        
        <Button
          variant="ghost"
          className={cn(
            "flex-col h-auto py-2 gap-1 relative transition-colors",
            activeView === 'orders' ? 'text-red-500' : 'text-gray-500'
          )}
          onClick={() => onNavigate('orders')}
        >
          <Package className={cn("h-6 w-6", activeView === 'orders' && "fill-red-500")} />
          <span className="text-xs font-medium">Pesanan</span>
          {activeOrdersCount > 0 && (
            <Badge className="absolute top-0 right-6 h-5 w-5 flex items-center justify-center p-0 bg-red-500 border-2 border-white text-xs">
              {activeOrdersCount}
            </Badge>
          )}
        </Button>
        
        <Button
          variant="ghost"
          className={cn(
            "flex-col h-auto py-2 gap-1 transition-colors",
            activeView === 'profile' ? 'text-red-500' : 'text-gray-500'
          )}
          onClick={() => onNavigate('profile')}
        >
          <User className={cn("h-6 w-6", activeView === 'profile' && "fill-red-500")} />
          <span className="text-xs font-medium">Akun</span>
        </Button>
      </div>
    </nav>
  );
}
