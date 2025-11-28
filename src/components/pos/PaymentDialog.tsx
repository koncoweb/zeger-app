import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Banknote, QrCode, CreditCard, Loader2 } from 'lucide-react';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirmPayment: (paymentMethod: string, paymentDetails: any) => void;
  splitBillInfo?: {
    currentGroup: number;
    totalGroups: number;
  };
}

export const PaymentDialog = ({
  open,
  onOpenChange,
  total,
  onConfirmPayment,
  splitBillInfo,
}: PaymentDialogProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer'>('cash');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate change for cash payment
  const cashReceivedAmount = parseFloat(cashReceived) || 0;
  const change = cashReceivedAmount - total;
  const isValidCashPayment = cashReceivedAmount >= total;

  const handleConfirm = async () => {
    setIsProcessing(true);
    
    try {
      let paymentDetails: any = {};

      if (paymentMethod === 'cash') {
        if (!isValidCashPayment) {
          return;
        }
        paymentDetails = {
          cash_received: cashReceivedAmount,
          change: change,
        };
      }

      await onConfirmPayment(paymentMethod, paymentDetails);
      
      // Reset state
      setCashReceived('');
      setPaymentMethod('cash');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCashReceivedChange = (value: string) => {
    // Only allow numbers and decimal point
    const sanitized = value.replace(/[^0-9.]/g, '');
    setCashReceived(sanitized);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-red-600">
            {splitBillInfo
              ? `Pembayaran Grup ${splitBillInfo.currentGroup} dari ${splitBillInfo.totalGroups}`
              : 'Pembayaran'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Split Bill Progress */}
          {splitBillInfo && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-sm text-blue-800 font-medium">
                    Split Bill - Grup {splitBillInfo.currentGroup} dari {splitBillInfo.totalGroups}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Total Amount */}
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
                <p className="text-3xl font-bold text-red-600">
                  Rp {total.toLocaleString('id-ID')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Tabs */}
          <Tabs
            value={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value as any)}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cash" className="flex items-center gap-2">
                <Banknote className="w-4 h-4" />
                Cash
              </TabsTrigger>
              <TabsTrigger value="qris" className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                QRIS
              </TabsTrigger>
              <TabsTrigger value="transfer" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Transfer
              </TabsTrigger>
            </TabsList>

            {/* Cash Tab */}
            <TabsContent value="cash" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cash-received">Jumlah Uang Diterima</Label>
                <Input
                  id="cash-received"
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={cashReceived}
                  onChange={(e) => handleCashReceivedChange(e.target.value)}
                  className="text-lg"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[50000, 100000, 200000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => setCashReceived(amount.toString())}
                    className="h-12"
                  >
                    Rp {(amount / 1000).toFixed(0)}k
                  </Button>
                ))}
              </div>

              {/* Change Display */}
              {cashReceived && (
                <Card className={change >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Kembalian</span>
                      <span className={`text-xl font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Rp {Math.abs(change).toLocaleString('id-ID')}
                      </span>
                    </div>
                    {change < 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        Uang yang diterima kurang dari total pembayaran
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* QRIS Tab */}
            <TabsContent value="qris" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    {/* QR Code Placeholder */}
                    <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                      <QrCode className="w-24 h-24 text-gray-400" />
                    </div>
                    
                    <div className="space-y-2">
                      <p className="font-semibold">Scan QR Code untuk membayar</p>
                      <p className="text-sm text-gray-600">
                        Gunakan aplikasi e-wallet atau mobile banking Anda
                      </p>
                      <p className="text-xs text-gray-500">
                        Setelah pembayaran berhasil, klik tombol Konfirmasi
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transfer Tab */}
            <TabsContent value="transfer" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Transfer ke rekening:</p>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Bank</span>
                          <span className="font-semibold">BCA</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">No. Rekening</span>
                          <span className="font-semibold">1234567890</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Atas Nama</span>
                          <span className="font-semibold">PT Zeger Indonesia</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs text-yellow-800">
                        Setelah transfer berhasil, klik tombol Konfirmasi dan tunjukkan bukti transfer
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Confirm Button */}
          <Button
            onClick={handleConfirm}
            disabled={
              isProcessing ||
              (paymentMethod === 'cash' && !isValidCashPayment)
            }
            className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Memproses...
              </>
            ) : (
              'Konfirmasi Pembayaran'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
