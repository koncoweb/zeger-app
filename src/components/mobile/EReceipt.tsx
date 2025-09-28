import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, Share2, Printer } from 'lucide-react';
import { ZegerLogo } from '@/components/ui/zeger-logo';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface TransactionItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products?: {
    name: string;
  };
}

interface Transaction {
  id: string;
  transaction_number: string;
  transaction_date: string;
  final_amount: number;
  payment_method: string;
  customer_name?: string;
  customer_phone?: string;
  transaction_items: TransactionItem[];
}

interface EReceiptProps {
  transaction: Transaction;
  onClose: () => void;
}

export const EReceipt: React.FC<EReceiptProps> = ({ transaction, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const barcodeRef = useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    // Generate barcode
    if (barcodeRef.current && transaction.transaction_number) {
      JsBarcode(barcodeRef.current, transaction.transaction_number, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 12,
        margin: 5
      });
    }
  }, [transaction.transaction_number]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadPDF = async () => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200] // Receipt paper size
      });

      // Header
      pdf.setFontSize(16);
      pdf.text('ZEGER COFFEE', 40, 15, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.text('Digital Receipt', 40, 22, { align: 'center' });
      
      // Transaction Details
      pdf.setFontSize(8);
      pdf.text(`No: ${transaction.transaction_number}`, 5, 35);
      pdf.text(`Tanggal: ${formatDate(transaction.transaction_date)}`, 5, 42);
      
      if (transaction.customer_name) {
        pdf.text(`Customer: ${transaction.customer_name}`, 5, 49);
      }
      
      // Separator
      pdf.line(5, 55, 75, 55);
      
      // Items
      let y = 65;
      transaction.transaction_items.forEach((item) => {
        const productName = item.products?.name || 'Unknown Product';
        pdf.text(productName, 5, y);
        pdf.text(`${item.quantity} x ${formatCurrency(item.unit_price)}`, 5, y + 5);
        pdf.text(formatCurrency(item.total_price), 75, y + 5, { align: 'right' });
        y += 12;
      });
      
      // Total
      pdf.line(5, y, 75, y);
      y += 8;
      pdf.setFontSize(10);
      pdf.text('TOTAL', 5, y);
      pdf.text(formatCurrency(transaction.final_amount), 75, y, { align: 'right' });
      
      // Payment Method
      y += 8;
      pdf.setFontSize(8);
      pdf.text(`Pembayaran: ${transaction.payment_method}`, 5, y);
      
      // Footer
      y += 15;
      pdf.text('Terima kasih atas kunjungan Anda!', 40, y, { align: 'center' });
      
      pdf.save(`receipt-${transaction.transaction_number}.pdf`);
      toast.success('Receipt berhasil didownload');
    } catch (error) {
      toast.error('Gagal download receipt');
    }
  };

  const shareReceipt = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Zeger Coffee Receipt',
          text: `Receipt #${transaction.transaction_number} - Total: ${formatCurrency(transaction.final_amount)}`,
          url: window.location.href
        });
      } catch (error) {
        fallbackShare();
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    const text = `Receipt Zeger Coffee\nNo: ${transaction.transaction_number}\nTotal: ${formatCurrency(transaction.final_amount)}\nTanggal: ${formatDate(transaction.transaction_date)}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success('Receipt info disalin ke clipboard');
    } else {
      toast.info('Share tidak tersedia di browser ini');
    }
  };

  const printReceipt = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt ${transaction.transaction_number}</title>
              <style>
                body { font-family: monospace; margin: 0; padding: 20px; }
                .receipt { max-width: 300px; margin: 0 auto; }
                .center { text-align: center; }
                .separator { border-top: 1px dashed #000; margin: 10px 0; }
                .flex { display: flex; justify-content: space-between; }
              </style>
            </head>
            <body>
              ${receiptRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-sm bg-white shadow-2xl">
        <CardContent className="p-6">
          <div ref={receiptRef} className="space-y-4">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-2">
                <ZegerLogo className="h-12 w-auto" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">ZEGER COFFEE</h2>
              <p className="text-sm text-gray-600">Digital Receipt</p>
            </div>

            <Separator />

            {/* Transaction Info */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>No Receipt:</span>
                <span className="font-mono">{transaction.transaction_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal:</span>
                <span>{formatDate(transaction.transaction_date)}</span>
              </div>
              {transaction.customer_name && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{transaction.customer_name}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Items */}
            <div className="space-y-2">
              {transaction.transaction_items.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="font-medium text-sm">
                    {item.products?.name || 'Unknown Product'}
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                    <span>{formatCurrency(item.total_price)}</span>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between text-lg font-bold">
              <span>TOTAL</span>
              <span>{formatCurrency(transaction.final_amount)}</span>
            </div>

            {/* Payment Method */}
            <div className="text-center text-sm text-gray-600">
              Pembayaran: {transaction.payment_method}
            </div>

            {/* Barcode */}
            <div className="flex justify-center">
              <canvas ref={barcodeRef} className="border rounded" />
            </div>

            <div className="text-center text-xs text-gray-500 pt-2">
              Terima kasih atas kunjungan Anda!
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={printReceipt}
              className="flex-1"
            >
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadPDF}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={shareReceipt}
              className="flex-1"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>

          {/* Close Button */}
          <Button 
            onClick={onClose} 
            className="w-full mt-3" 
            variant="secondary"
          >
            Tutup
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};