import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CustomerPaymentMethodProps {
  orderId: string;
  totalAmount: number;
  orderType?: string;
  onBack: () => void;
  onSuccess: (paymentMethod?: string, invoiceUrl?: string) => void;
}

const eWalletOptions = [
  { id: 'GOPAY', name: 'GOPAY', icon: '💚', bgColor: 'bg-green-500' },
  { id: 'SHOPEEPAY', name: 'SHOPEEPAY / SPAYLATER', icon: '🟠', bgColor: 'bg-orange-500' },
  { id: 'OVO', name: 'OVO', icon: '🟣', bgColor: 'bg-purple-600' },
  { id: 'JENIUSPAY', name: 'JENIUS PAY', icon: '🔵', bgColor: 'bg-blue-500' },
];

export default function CustomerPaymentMethod({
  orderId,
  totalAmount,
  orderType,
  onBack,
  onSuccess,
}: CustomerPaymentMethodProps) {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showQRISModal, setShowQRISModal] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast({
        title: 'Error',
        description: 'Pilih metode pembayaran terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    // SPECIAL HANDLING FOR QRIS - Show static QRIS
    if (selectedMethod === 'QRIS') {
      setShowQRISModal(true);
      return;
    }

    setLoading(true);

    try {
      console.log('💳 Processing payment:', {
        order_id: orderId,
        amount: totalAmount,
        method: selectedMethod
      });

      // Call Xendit edge function for e-wallets
      const { data, error } = await supabase.functions.invoke('create-xendit-invoice', {
        body: {
          order_id: orderId,
          amount: totalAmount,
          payment_method: selectedMethod,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('✅ Xendit response:', data);

      // Redirect to Xendit payment page
      if (data?.invoice_url) {
        console.log('🔗 Redirecting to:', data.invoice_url);
        window.location.href = data.invoice_url;
      } else {
        // Payment method doesn't require redirect
        onSuccess(selectedMethod);
      }
      
    } catch (error: any) {
      console.error('❌ Payment error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Gagal memproses pembayaran',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f6f6] font-display">
      <div className="container mx-auto max-w-md">
        <div className="flex flex-col h-screen">
          {/* Header */}
          <header className="flex items-center p-4 border-b border-gray-200 bg-white">
            <button onClick={onBack} className="text-gray-900">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="flex-1 text-center text-lg font-medium text-gray-900">
              Metode Pembayaran
            </h1>
            <div className="w-6"></div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">E-Wallet</h2>
            <div className="space-y-4">
              {eWalletOptions.map((wallet) => (
                <label 
                  key={wallet.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all",
                    selectedMethod === wallet.id 
                      ? "border-[#EA2831] bg-red-50" 
                      : "border-gray-200 bg-white"
                  )}
                >
                  <div className="flex items-center space-x-4">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
                      wallet.bgColor
                    )}>
                      {wallet.icon}
                    </div>
                    <span className="font-medium text-gray-900">{wallet.name}</span>
                  </div>
                  <input 
                    type="radio"
                    name="payment_method"
                    value={wallet.id}
                    checked={selectedMethod === wallet.id}
                    onChange={() => setSelectedMethod(wallet.id)}
                    className="form-radio h-5 w-5 text-[#EA2831]"
                  />
                </label>
              ))}
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">QRIS</h2>
            <label className="flex items-center justify-between p-4 rounded-lg bg-white border border-gray-200 cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center text-xs font-bold">
                  QRIS
                </div>
                <span className="font-medium text-gray-900">QRIS</span>
              </div>
              <input 
                type="radio"
                name="payment_method"
                value="QRIS"
                checked={selectedMethod === 'QRIS'}
                onChange={() => setSelectedMethod('QRIS')}
                className="form-radio h-5 w-5 text-[#EA2831]"
              />
            </label>
          </main>

          {/* Footer */}
          <footer className="p-4 border-t border-gray-200 bg-white">
            <div className="bg-purple-900 text-white p-4 rounded-lg flex items-start space-x-3 mb-4">
              <div className="bg-red-500 rounded-full p-2">
                <span className="text-white text-xl">📢</span>
              </div>
              <div>
                <p className="font-bold">Pastikan Saldo Cukup!</p>
                <p className="text-sm">Pastikan saldo kamu cukup sebelum melakukan pembayaran</p>
              </div>
            </div>
            <button 
              onClick={handlePayment}
              disabled={!selectedMethod || loading}
              className={cn(
                "w-full py-4 rounded-full font-bold transition-colors",
                selectedMethod 
                  ? "bg-[#EA2831] text-white hover:bg-red-600" 
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
            >
              {loading ? 'Memproses...' : 'Konfirmasi'}
            </button>
          </footer>
        </div>
      </div>

      {/* QRIS Payment Modal */}
      {showQRISModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">Pembayaran QRIS</h2>
              <button 
                onClick={() => {
                  setShowQRISModal(false);
                  setPaymentConfirmed(false);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* QRIS Image */}
            <div className="p-6">
              <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
                <img 
                  src="/qris/zeger-qris.jpg" 
                  alt="QRIS Code Zeger Coffee"
                  className="w-full h-auto rounded-lg"
                />
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-blue-900 mb-2">Cara Pembayaran:</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Buka aplikasi e-wallet Anda (GoPay, OVO, Dana, dll)</li>
                  <li>Pilih menu "Scan QR" atau "Bayar"</li>
                  <li>Scan QRIS code di atas</li>
                  <li>Masukkan nominal: <span className="font-bold">Rp{totalAmount.toLocaleString('id-ID')}</span></li>
                  <li>Konfirmasi pembayaran</li>
                  <li>Klik tombol "Sudah Bayar" di bawah</li>
                </ol>
              </div>

              {/* Total Amount */}
              <div className="bg-gray-100 rounded-lg p-4 mb-6 text-center">
                <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
                <p className="text-3xl font-bold text-[#EA2831]">
                  Rp{totalAmount.toLocaleString('id-ID')}
                </p>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-3 mb-6 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={paymentConfirmed}
                  onChange={(e) => setPaymentConfirmed(e.target.checked)}
                  className="mt-1 h-5 w-5 text-[#EA2831] rounded"
                />
                <span className="text-sm text-gray-700">
                  Saya sudah melakukan pembayaran melalui QRIS
                </span>
              </label>

              {/* Confirm Button */}
              <button
                onClick={() => {
                  if (!paymentConfirmed) {
                    toast({
                      title: 'Perhatian',
                      description: 'Centang konfirmasi pembayaran terlebih dahulu',
                      variant: 'destructive'
                    });
                    return;
                  }
                  setShowQRISModal(false);
                  onSuccess('QRIS');
                }}
                disabled={!paymentConfirmed}
                className={cn(
                  "w-full py-4 rounded-full font-bold transition-colors",
                  paymentConfirmed
                    ? "bg-[#EA2831] text-white hover:bg-red-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                )}
              >
                Sudah Bayar
              </button>

              {/* Cancel Button */}
              <button
                onClick={() => {
                  setShowQRISModal(false);
                  setPaymentConfirmed(false);
                }}
                className="w-full mt-3 py-3 text-gray-600 hover:text-gray-900 font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}