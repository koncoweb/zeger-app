import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MapPin, Truck, Clock, Home, FileText } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-yellow-50 dark:from-orange-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Success Animation */}
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
          {/* Delivery Illustration */}
          <div className="relative w-48 h-48">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-full animate-pulse" />
            <div className="relative flex items-center justify-center h-full">
              <svg className="w-32 h-32" viewBox="0 0 200 200" fill="none">
                {/* Motorcycle */}
                <circle cx="60" cy="140" r="15" fill="#F59E0B" />
                <circle cx="140" cy="140" r="15" fill="#F59E0B" />
                <path d="M50 110 L80 110 L90 90 L130 90 L140 110 L150 110" stroke="#1F2937" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="95" cy="75" r="12" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="3" />
                {/* Rider */}
                <circle cx="95" cy="60" r="10" fill="#FDE68A" />
                <path d="M95 70 L95 85" stroke="#1F2937" strokeWidth="6" strokeLinecap="round" />
                {/* Delivery Box */}
                <rect x="120" y="85" width="25" height="20" rx="3" fill="#DC2626" />
                <path d="M127 85 L132.5 95 L138 85" stroke="#FEF3C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {/* Motion Lines */}
                <path d="M20 100 L35 100 M15 115 L30 115 M25 130 L40 130" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-2">
              <CheckCircle className="h-10 w-10 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Pesanan Berhasil!
            </h1>
            <p className="text-muted-foreground">Rider sedang menuju lokasi Anda</p>
          </div>
        </div>

        {/* Order Info Card */}
        <Card className="p-6 space-y-4 border-2 border-orange-200 bg-white/80 backdrop-blur">
          {/* Order Number */}
          <div className="text-center pb-4 border-b border-orange-200">
            <p className="text-sm text-muted-foreground mb-1">Nomor Pesanan</p>
            <p className="text-2xl font-bold tracking-wider text-orange-600">{orderNumber}</p>
          </div>

          {/* Order Type */}
          <div className="flex justify-center">
            {orderType === "outlet_pickup" ? (
              <Badge className="px-4 py-2 text-base bg-orange-100 text-orange-700 border-orange-300">
                <MapPin className="h-4 w-4 mr-2" />
                Pickup di Outlet
              </Badge>
            ) : (
              <Badge className="px-4 py-2 text-base bg-red-100 text-red-700 border-red-300">
                <Truck className="h-4 w-4 mr-2" />
                Delivery
              </Badge>
            )}
          </div>

          {/* Location */}
          {orderType === "outlet_pickup" && outletName && (
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="font-semibold text-orange-900 mb-1">{outletName}</p>
              <p className="text-sm text-orange-700 flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{outletAddress}</span>
              </p>
            </div>
          )}

          {orderType === "outlet_delivery" && deliveryAddress && (
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="font-semibold text-orange-900 mb-1">Alamat Pengiriman</p>
              <p className="text-sm text-orange-700 flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{deliveryAddress}</span>
              </p>
            </div>
          )}

          {/* Estimated Time */}
          <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-2">
                <Clock className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">Estimasi Waktu</p>
                <p className="text-sm text-orange-100">{estimatedTime}</p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 justify-center pt-2">
            <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
            <p className="text-sm font-medium text-orange-600">
              Pesanan sedang disiapkan
            </p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full h-14 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold text-lg shadow-lg"
            onClick={() => onNavigate("order-detail", orderId)}
          >
            <Truck className="h-5 w-5 mr-2" />
            Track Order
          </Button>
          
          <Button
            size="lg"
            variant="outline"
            className="w-full h-12 bg-amber-50 hover:bg-amber-100 text-amber-900 border-2 border-amber-300"
            onClick={() => onNavigate("home")}
          >
            <Home className="h-5 w-5 mr-2" />
            Kembali ke Home
          </Button>
        </div>

        {/* Info Text */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground px-4">
            Anda dapat melacak status pesanan secara real-time
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full">
            <div className="h-1.5 w-1.5 bg-orange-500 rounded-full animate-pulse" />
            <span>Rider akan segera mengambil pesanan</span>
          </div>
        </div>
      </div>
    </div>
  );
}
