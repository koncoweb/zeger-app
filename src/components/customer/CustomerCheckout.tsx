import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, ShoppingBag, Bike } from "lucide-react";
import { cn } from "@/lib/utils";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: any;
}

interface CustomerUser {
  id: string;
  points: number;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface Voucher {
  id: string;
  code: string;
  discount_value: number;
  min_order: number;
}

interface CustomerCheckoutProps {
  cart: CartItem[];
  outletId: string;
  outletName: string;
  outletAddress: string;
  customerUser: CustomerUser;
  onConfirm: (orderData: any) => void;
  onBack: () => void;
}

export default function CustomerCheckout({
  cart, outletId, outletName, outletAddress, customerUser, onConfirm, onBack
}: CustomerCheckoutProps) {
  const { toast } = useToast();
  const [orderType, setOrderType] = useState<"outlet_pickup" | "outlet_delivery">("outlet_pickup");
  const [deliveryAddress, setDeliveryAddress] = useState(customerUser.address || "");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "e_wallet">("cash");
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(false);
  const [useZegerPoints, setUseZegerPoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);

  const subtotal = cart.reduce((sum, item) => {
    let itemPrice = item.price;
    if (item.customizations?.size === 'large') itemPrice += 5000;
    if (item.customizations?.size === 'ultimate') itemPrice += 10000;
    if (item.customizations?.extraShot) itemPrice += 6000;
    return sum + (itemPrice * item.quantity);
  }, 0);
  
  const deliveryFee = orderType === "outlet_delivery" ? 10000 : 0;
  const takeAwayCharge = orderType === "outlet_pickup" ? 2000 : 0;
  const voucherDiscount = appliedVoucher ? Math.floor(subtotal * (appliedVoucher.discount_value / 100)) : 0;
  const deliveryDiscount = orderType === "outlet_delivery" ? Math.floor(deliveryFee * 0.2) : 0;
  const maxPointsCanUse = Math.min(customerUser.points, Math.floor(subtotal / 500));
  const pointsDiscount = useZegerPoints ? Math.min(pointsToUse, maxPointsCanUse) * 500 : 0;
  const total = subtotal + deliveryFee + takeAwayCharge - voucherDiscount - deliveryDiscount - pointsDiscount;
  const earnedPoints = Math.floor(total / 10000);

  const handleConfirmOrder = () => {
    if (orderType === "outlet_delivery" && !deliveryAddress.trim()) {
      toast({ title: "Error", description: "Masukkan alamat", variant: "destructive" });
      return;
    }
    setLoading(true);
    onConfirm({
      outletId, orderType, deliveryAddress: orderType === "outlet_delivery" ? deliveryAddress : undefined,
      deliveryLat: customerUser.latitude, deliveryLng: customerUser.longitude,
      paymentMethod, voucherId: appliedVoucher?.id, totalPrice: total, deliveryFee,
      discount: voucherDiscount + deliveryDiscount + pointsDiscount,
      pointsUsed: useZegerPoints ? pointsToUse : 0, pointsEarned: earnedPoints
    });
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="sticky top-0 bg-white border-b z-10 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5"/></Button>
          <h1 className="text-xl font-bold">Konfirmasi Pesanan</h1>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <Button variant={orderType==='outlet_pickup'?'default':'outline'} className={cn("flex-1 rounded-full",orderType==='outlet_pickup'?"bg-red-500 hover:bg-red-600 text-white":"border-gray-300")} onClick={()=>setOrderType('outlet_pickup')}><ShoppingBag className="h-4 w-4 mr-2"/>Take Away</Button>
          <Button variant={orderType==='outlet_delivery'?'default':'outline'} className={cn("flex-1 rounded-full",orderType==='outlet_delivery'?"bg-red-500 hover:bg-red-600 text-white":"border-gray-300")} onClick={()=>setOrderType('outlet_delivery')}><Bike className="h-4 w-4 mr-2"/>Delivery</Button>
        </div>
        {orderType==='outlet_delivery' && <Input value={deliveryAddress} onChange={e=>setDeliveryAddress(e.target.value)} placeholder="Alamat pengiriman"/>}
        <Card><CardContent className="p-6 space-y-3"><h3 className="font-bold text-lg mb-4">Zeger Point</h3><div className="flex items-center justify-between mb-3"><div><p className="font-semibold">Tersedia: {customerUser.points} poin</p><p className="text-xs text-gray-500">= Rp {(customerUser.points*500).toLocaleString('id-ID')}</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={useZegerPoints} onChange={e=>{setUseZegerPoints(e.target.checked);if(!e.target.checked)setPointsToUse(0)}} className="sr-only peer"/><div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div></label></div>{useZegerPoints&&<div className="space-y-2 pt-2 border-t"><Label>Gunakan Poin</Label><div className="flex gap-2"><Input type="number" value={pointsToUse} onChange={e=>setPointsToUse(Math.min(parseInt(e.target.value)||0,maxPointsCanUse))} max={maxPointsCanUse} placeholder={`Max ${maxPointsCanUse}`}/><Button type="button" variant="outline" size="sm" onClick={()=>setPointsToUse(maxPointsCanUse)}>Max</Button></div><p className="text-xs text-gray-600">= Rp {(pointsToUse*500).toLocaleString('id-ID')} diskon</p></div>}</CardContent></Card>
        <Card><CardContent className="p-6 space-y-2"><div className="flex justify-between text-sm"><span>Subtotal</span><span>Rp {subtotal.toLocaleString('id-ID')}</span></div>{deliveryDiscount>0&&<div className="flex justify-between text-red-600 text-sm"><span>🎟️ Diskon Ongkir 20%</span><span>-Rp {deliveryDiscount.toLocaleString('id-ID')}</span></div>}{takeAwayCharge>0&&<div className="flex justify-between text-sm"><span>Take Away Charge</span><span>Rp {takeAwayCharge.toLocaleString('id-ID')}</span></div>}{deliveryFee>0&&<div className="flex justify-between text-sm"><span>Delivery Fee</span><span>Rp {deliveryFee.toLocaleString('id-ID')}</span></div>}{pointsDiscount>0&&<div className="flex justify-between text-purple-600 text-sm"><span>Diskon Zeger Point</span><span>-Rp {pointsDiscount.toLocaleString('id-ID')}</span></div>}<div className="border-t pt-3 flex justify-between font-bold text-lg"><span>Total</span><span className="text-red-600">Rp {total.toLocaleString('id-ID')}</span></div><div className="bg-purple-50 rounded-lg p-3 flex items-center gap-2"><span className="text-2xl">💰</span><div className="text-sm"><p className="font-semibold text-purple-700">Rp {(earnedPoints*500).toLocaleString('id-ID')}</p><p className="text-xs text-gray-600">Total XP: {earnedPoints}</p></div></div></CardContent></Card>
        <div className="bg-purple-600 text-white text-xs px-4 py-3 rounded-lg text-center">Dengan membayar pesanan, anda telah menyetujui <span className="font-bold">Syarat Dan Ketentuan</span> Kami</div>
        <Button className="w-full h-14 bg-red-500 hover:bg-red-600 text-white rounded-full text-base font-bold" onClick={handleConfirmOrder} disabled={loading||(!deliveryAddress&&orderType==='outlet_delivery')}>Pilih Pembayaran</Button>
      </div>
    </div>
  );
}
