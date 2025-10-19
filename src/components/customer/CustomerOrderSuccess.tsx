import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Store, Share2, Star } from "lucide-react";

interface CustomerOrderSuccessProps {
  orderId: string;
  orderNumber: string;
  orderType: "outlet_pickup" | "outlet_delivery";
  outletName?: string;
  outletAddress?: string;
  deliveryAddress?: string;
  estimatedTime: string;
  onNavigate: (view: string, orderId?: string) => void;
}

export default function CustomerOrderSuccess({
  orderId,
  orderNumber,
  orderType,
  outletName,
  outletAddress,
  deliveryAddress,
  estimatedTime,
  onNavigate,
}: CustomerOrderSuccessProps) {
  return (
    <div className="min-h-screen bg-[#f8f6f6] flex items-center justify-center p-4">
      <div className="w-full max-w-sm mx-auto text-center space-y-6">
        {/* Delivery Illustration */}
        <div className="mb-8">
          <div className="relative w-64 h-64 mx-auto">
            {/* Animated delivery illustration */}
            <svg viewBox="0 0 300 300" fill="none" className="w-full h-full">
              {/* Motorcycle wheels */}
              <circle cx="90" cy="210" r="25" fill="#F59E0B" stroke="#1F2937" strokeWidth="4" />
              <circle cx="210" cy="210" r="25" fill="#F59E0B" stroke="#1F2937" strokeWidth="4" />
              
              {/* Motorcycle body */}
              <path 
                d="M75 180 L120 180 L135 150 L195 150 L210 180 L225 180" 
                stroke="#1F2937" 
                strokeWidth="12" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                fill="none"
              />
              
              {/* Rider */}
              <circle cx="142" cy="120" r="18" fill="#FDE68A" stroke="#1F2937" strokeWidth="3" />
              <path d="M142 138 L142 165" stroke="#1F2937" strokeWidth="10" strokeLinecap="round" />
              <path d="M120 155 L142 165 L164 155" stroke="#1F2937" strokeWidth="8" strokeLinecap="round" />
              
              {/* Delivery box */}
              <rect x="180" y="140" width="40" height="35" rx="5" fill="#EA2831" stroke="#1F2937" strokeWidth="3" />
              <path d="M185 140 L200 157 L215 140" stroke="#FEF3C7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Motion lines */}
              <path d="M30 150 L50 150 M20 170 L45 170 M35 190 L60 190" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" opacity="0.5">
                <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" repeatCount="indefinite" />
              </path>
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Placed Successfully</h1>
          <p className="text-gray-600 mb-8">Your meal is being processed to be delivered at your doorstep shortly</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 mb-8">
          <Button
            className="w-full bg-[#EA2831] hover:bg-red-600 text-white font-semibold py-4 rounded-lg shadow-md"
            onClick={() => onNavigate("order-tracking", orderId)}
          >
            Track Order
          </Button>
          <Button
            className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-600 font-semibold py-4 rounded-lg"
            onClick={() => onNavigate("home")}
          >
            Back to home
          </Button>
        </div>

        {/* What's Next Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">What's Next?</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Reorder */}
            <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 transition-colors cursor-pointer">
              <RefreshCw className="h-8 w-8 text-[#EA2831]" />
              <p className="font-medium text-sm text-gray-800 text-center">Reorder last meal</p>
            </div>
            
            {/* Explore */}
            <div 
              className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onNavigate("menu")}
            >
              <Store className="h-8 w-8 text-[#EA2831]" />
              <p className="font-medium text-sm text-gray-800 text-center">Explore new restaurants</p>
            </div>
            
            {/* Share */}
            <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 transition-colors cursor-pointer">
              <Share2 className="h-8 w-8 text-[#EA2831]" />
              <p className="font-medium text-sm text-gray-800 text-center">Share your order</p>
            </div>
            
            {/* Rate */}
            <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center space-y-2 hover:bg-gray-50 transition-colors cursor-pointer">
              <Star className="h-8 w-8 text-[#EA2831]" />
              <p className="font-medium text-sm text-gray-800 text-center">Rate your experience</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
