import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Printer, ShoppingCart } from 'lucide-react';

interface TransactionSuccessProps {
  transactionNumber: string;
  onPrintReceipt: () => void;
  onNewTransaction: () => void;
}

export const TransactionSuccess = ({
  transactionNumber,
  onPrintReceipt,
  onNewTransaction,
}: TransactionSuccessProps) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>

            {/* Success Message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Transaksi Berhasil!
              </h2>
              <p className="text-gray-600">
                Pembayaran telah diterima dan transaksi telah disimpan
              </p>
            </div>

            {/* Transaction Number */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Nomor Transaksi</p>
              <p className="text-xl font-bold text-red-600 font-mono">
                {transactionNumber}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Print Receipt Button */}
              <Button
                onClick={onPrintReceipt}
                variant="outline"
                className="w-full h-12 text-base font-semibold border-red-600 text-red-600 hover:bg-red-50"
              >
                <Printer className="w-5 h-5 mr-2" />
                Cetak Struk
              </Button>

              {/* New Transaction Button */}
              <Button
                onClick={onNewTransaction}
                className="w-full h-12 text-base font-semibold bg-red-600 hover:bg-red-700 text-white"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Transaksi Baru
              </Button>
            </div>

            {/* Additional Info */}
            <p className="text-xs text-gray-500">
              Struk dapat dicetak ulang dari menu Riwayat Transaksi
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
