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
  cashierName?: string;
}

export const EReceipt: React.FC<EReceiptProps> = ({ transaction, onClose, cashierName = 'Unknown' }) => {
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
        format: [80, 250] // Larger receipt paper size
      });

      // Add logo (simplified representation)
      pdf.setFontSize(16);
      pdf.text('ZEGER COFFEE', 40, 15, { align: 'center' });
      
      pdf.setFontSize(8);
      pdf.text('Digital Receipt', 40, 22, { align: 'center' });
      
      // Cashier info
      pdf.text(`Cashier: ${cashierName}`, 5, 30);
      
      // Dashed line separator
      pdf.setLineDashPattern([1, 1], 0);
      pdf.line(5, 35, 75, 35);
      pdf.setLineDashPattern([], 0);
      
      // Transaction Details
      pdf.text(`No: ${transaction.transaction_number}`, 5, 42);
      pdf.text(`Tanggal: ${formatDate(transaction.transaction_date)}`, 5, 47);
      
      if (transaction.customer_name) {
        pdf.text(`Customer: ${transaction.customer_name}`, 5, 52);
      }
      
      // Items separator
      pdf.setLineDashPattern([1, 1], 0);
      pdf.line(5, 58, 75, 58);
      pdf.setLineDashPattern([], 0);
      
      // Items
      let y = 68;
      transaction.transaction_items.forEach((item) => {
        const productName = item.products?.name || 'Unknown Product';
        pdf.text(productName, 5, y);
        pdf.text(`${item.quantity} x ${formatCurrency(item.unit_price)}`, 5, y + 4);
        pdf.text(formatCurrency(item.total_price), 75, y + 4, { align: 'right' });
        y += 12;
      });
      
      // Total separator
      pdf.setLineDashPattern([1, 1], 0);
      pdf.line(5, y, 75, y);
      pdf.setLineDashPattern([], 0);
      y += 8;
      
      pdf.setFontSize(10);
      pdf.text('TOTAL', 5, y);
      pdf.text(formatCurrency(transaction.final_amount), 75, y, { align: 'right' });
      
      // Payment Method
      y += 8;
      pdf.setFontSize(8);
      pdf.text(`Pembayaran: ${transaction.payment_method}`, 5, y);
      
      // Add barcode representation
      y += 15;
      pdf.text('Barcode:', 5, y);
      pdf.text(transaction.transaction_number, 5, y + 5);
      
      // Footer note
      y += 20;
      pdf.text('Enjoy A Happiness Coffee', 40, y, { align: 'center' });
      y += 8;
      pdf.text('Terima kasih atas kunjungan Anda!', 40, y, { align: 'center' });
      
      pdf.save(`receipt-${transaction.transaction_number}.pdf`);
      toast.success('Receipt berhasil didownload');
    } catch (error) {
      toast.error('Gagal download receipt');
    }
  };

  const shareReceipt = async () => {
    const receiptText = `*ZEGER COFFEE* ☕
━━━━━━━━━━━━━━━
📧 *Receipt #${transaction.transaction_number}*
📅 ${formatDate(transaction.transaction_date)}
👤 Cashier: ${cashierName}
${transaction.customer_name ? `🧑‍💼 Customer: ${transaction.customer_name}` : ''}

📋 *Items:*
${transaction.transaction_items.map(item => 
  `• ${item.products?.name || 'Unknown'}\n  ${item.quantity}x @ ${formatCurrency(item.unit_price)} = ${formatCurrency(item.total_price)}`
).join('\n')}

━━━━━━━━━━━━━━━
💰 *TOTAL: ${formatCurrency(transaction.final_amount)}*
💳 Payment: ${transaction.payment_method}

✨ *Enjoy A Happiness Coffee* ✨
Terima kasih atas kunjungan Anda!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Zeger Coffee Receipt',
          text: receiptText
        });
      } catch (error) {
        fallbackShare(receiptText);
      }
    } else {
      fallbackShare(receiptText);
    }
  };

  const fallbackShare = (text: string) => {
    // Try WhatsApp first
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    const gmailUrl = `mailto:?subject=Zeger Coffee Receipt&body=${encodeURIComponent(text.replace(/\*/g, '').replace(/━/g, '-'))}`;
    
    const shareOptions = [
      { name: 'WhatsApp', url: whatsappUrl },
      { name: 'Email', url: gmailUrl },
      { name: 'Copy to Clipboard', action: () => {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text);
          toast.success('Receipt info disalin ke clipboard');
        } else {
          toast.error('Clipboard tidak didukung');
        }
      }}
    ];

    // Create simple selection dialog
    const choice = confirm('Pilih cara share:\n1. WhatsApp (OK)\n2. Email/Copy (Cancel)');
    
    if (choice) {
      window.open(whatsappUrl, '_blank');
    } else {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        toast.success('Receipt info disalin ke clipboard');
      } else {
        window.open(gmailUrl, '_blank');
      }
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
          <div ref={receiptRef} className="space-y-4 bg-white p-4 font-mono text-sm">
            {/* Header with Logo Only */}
            <div className="text-center space-y-2 pb-2">
              <div className="flex justify-center">
                <ZegerLogo size="sm" className="h-16 w-auto" />
              </div>
              <p className="text-xs text-muted-foreground">Digital Receipt</p>
            </div>

            {/* Dashed separator */}
            <div className="border-t border-dashed border-gray-300"></div>

            {/* Cashier Info */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Cashier/Rider:</span>
                <span className="font-medium">{cashierName}</span>
              </div>
            </div>

            {/* Dashed separator */}
            <div className="border-t border-dashed border-gray-300"></div>

            {/* Transaction Info */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>No Receipt:</span>
                <span className="font-mono font-medium">{transaction.transaction_number}</span>
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

            {/* Dashed separator */}
            <div className="border-t border-dashed border-gray-300"></div>

            {/* Items */}
            <div className="space-y-2">
              {transaction.transaction_items.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="font-medium text-xs">
                    {item.products?.name || 'Unknown Product'}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                    <span className="font-medium text-foreground">{formatCurrency(item.total_price)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Dashed separator */}
            <div className="border-t border-dashed border-gray-300"></div>

            {/* Total */}
            <div className="flex justify-between text-sm font-bold pt-1">
              <span>TOTAL</span>
              <span>{formatCurrency(transaction.final_amount)}</span>
            </div>

            {/* Payment Method */}
            <div className="text-center text-xs text-muted-foreground">
              Pembayaran: {transaction.payment_method}
            </div>

            {/* Barcode */}
            <div className="flex justify-center py-2">
              <canvas ref={barcodeRef} className="border border-dashed border-gray-300 rounded p-1" />
            </div>

            {/* Footer Messages */}
            <div className="text-center space-y-1 pt-2">
              <p className="text-xs font-medium text-primary">✨ Enjoy A Happiness Coffee ✨</p>
              <p className="text-xs text-muted-foreground">Terima kasih atas kunjungan Anda!</p>
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