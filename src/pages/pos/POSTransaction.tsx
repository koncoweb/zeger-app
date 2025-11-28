import { useState, useRef } from 'react';
import { usePOSAuth } from '@/hooks/usePOSAuth';
import { useCart } from '@/hooks/useCart';
import { usePOS } from '@/hooks/usePOS';
import { usePrint } from '@/hooks/usePrint';
import { ProductList } from '@/components/pos/ProductList';
import { Cart } from '@/components/pos/Cart';
import { PaymentDialog } from '@/components/pos/PaymentDialog';
import { SplitBillDialog } from '@/components/pos/SplitBillDialog';
import { TransactionSuccess } from '@/components/pos/TransactionSuccess';
import { ReceiptTemplate, ReceiptData } from '@/components/pos/ReceiptTemplate';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CartItem } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';

export const POSTransaction = () => {
  const navigate = useNavigate();
  const { profile } = usePOSAuth();
  const {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    discount,
    total,
  } = useCart();
  const { createTransaction, createSplitBillTransactions } = usePOS();

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showSplitBillDialog, setShowSplitBillDialog] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [completedTransactionNumber, setCompletedTransactionNumber] = useState('');
  const [splitBillGroups, setSplitBillGroups] = useState<CartItem[][] | null>(null);
  const [currentSplitGroupIndex, setCurrentSplitGroupIndex] = useState(0);
  const [completedSplitTransactions, setCompletedSplitTransactions] = useState<string[]>([]);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [lastPaymentMethod, setLastPaymentMethod] = useState<string>('');
  const [lastPaymentDetails, setLastPaymentDetails] = useState<any>(null);
  
  const { printRef, handlePrint, handleDownloadPDF } = usePrint('Receipt');

  const handleAddToCart = (product: any) => {
    addItem(product);
    // Use queueMicrotask to avoid setState during render warning
    queueMicrotask(() => {
      toast.success(`${product.name} ditambahkan ke keranjang`);
    });
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Keranjang kosong');
      return;
    }
    setShowPaymentDialog(true);
  };

  const handleSplitBill = () => {
    if (items.length < 2) {
      toast.error('Minimal 2 item untuk split bill');
      return;
    }
    setShowSplitBillDialog(true);
  };

  const handleProcessSplitPayment = (groups: CartItem[][]) => {
    // Close split bill dialog
    setShowSplitBillDialog(false);
    
    // Store groups and start payment process for first group
    setSplitBillGroups(groups);
    setCurrentSplitGroupIndex(0);
    setCompletedSplitTransactions([]);
    
    // Open payment dialog for first group
    setShowPaymentDialog(true);
  };

  const handleConfirmPayment = async (paymentMethod: string, paymentDetails: any) => {
    try {
      // Store payment info for receipt
      setLastPaymentMethod(paymentMethod);
      setLastPaymentDetails(paymentDetails);

      // Check if this is a split bill payment
      if (splitBillGroups && splitBillGroups.length > 0) {
        // Process payment for current group
        const currentGroup = splitBillGroups[currentSplitGroupIndex];
        
        const transaction = await createTransaction({
          items: currentGroup,
          paymentMethod,
          paymentDetails,
        });

        // Add to completed transactions
        const newCompletedTransactions = [
          ...completedSplitTransactions,
          transaction.transaction_number,
        ];
        setCompletedSplitTransactions(newCompletedTransactions);

        toast.success(`Pembayaran grup ${currentSplitGroupIndex + 1} berhasil`);

        // Check if there are more groups to process
        if (currentSplitGroupIndex < splitBillGroups.length - 1) {
          // Move to next group
          setCurrentSplitGroupIndex(currentSplitGroupIndex + 1);
          // Payment dialog stays open for next group
          toast.info(`Lanjut ke pembayaran grup ${currentSplitGroupIndex + 2}`);
        } else {
          // All groups completed
          setShowPaymentDialog(false);
          
          // Prepare receipt data for last group
          await prepareReceiptData(transaction, currentGroup, paymentMethod, paymentDetails);
          
          // Show success screen with all transaction numbers
          setCompletedTransactionNumber(newCompletedTransactions.join(', '));
          setShowSuccessScreen(true);

          // Clear cart and reset split bill state
          clearCart();
          setSplitBillGroups(null);
          setCurrentSplitGroupIndex(0);
          setCompletedSplitTransactions([]);

          toast.success('Semua pembayaran split bill berhasil!');
        }
      } else {
        // Regular single payment
        const transaction = await createTransaction({
          items,
          paymentMethod,
          paymentDetails,
        });

        // Close payment dialog
        setShowPaymentDialog(false);

        // Prepare receipt data
        await prepareReceiptData(transaction, items, paymentMethod, paymentDetails);

        // Show success screen
        setCompletedTransactionNumber(transaction.transaction_number);
        setShowSuccessScreen(true);

        // Clear cart
        clearCart();

        toast.success('Transaksi berhasil disimpan');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal memproses transaksi');
    }
  };

  const prepareReceiptData = async (
    transaction: any,
    transactionItems: CartItem[],
    paymentMethod: string,
    paymentDetails: any
  ) => {
    try {
      // Fetch branch info
      const { data: branch } = await supabase
        .from('branches')
        .select('name, address')
        .eq('id', profile?.branch_id)
        .single();

      if (!branch) {
        console.error('Branch not found');
        return;
      }

      const receipt: ReceiptData = {
        transaction_number: transaction.transaction_number,
        branch_name: branch.name,
        branch_address: branch.address || 'Alamat tidak tersedia',
        transaction_date: new Date(transaction.transaction_date),
        items: transactionItems,
        subtotal: transaction.total_amount,
        discount: transaction.discount_amount,
        total: transaction.final_amount,
        payment_method: paymentMethod,
        cash_received: paymentDetails?.cash_received,
        change: paymentDetails?.change,
      };

      setReceiptData(receipt);
    } catch (error) {
      console.error('Error preparing receipt data:', error);
    }
  };

  const handlePrintReceipt = () => {
    if (!receiptData) {
      toast.error('Data struk tidak tersedia');
      return;
    }

    try {
      handlePrint();
      toast.success('Mencetak struk...');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Gagal mencetak struk. Mencoba download PDF...');
      handleDownloadPDF();
    }
  };

  const handleNewTransaction = () => {
    setShowSuccessScreen(false);
    setCompletedTransactionNumber('');
    setSplitBillGroups(null);
    setCurrentSplitGroupIndex(0);
    setCompletedSplitTransactions([]);
  };

  if (!profile?.branch_id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Show success screen after transaction
  if (showSuccessScreen) {
    return (
      <TransactionSuccess
        transactionNumber={completedTransactionNumber}
        onPrintReceipt={handlePrintReceipt}
        onNewTransaction={handleNewTransaction}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-red-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/pos-app/dashboard')}
              className="text-white hover:bg-red-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Transaksi Baru</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product List - 2 columns */}
          <div className="lg:col-span-2">
            <ProductList branchId={profile.branch_id} onAddToCart={handleAddToCart} />
          </div>

          {/* Cart - 1 column */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Cart
                items={items}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeItem}
                onCheckout={handleCheckout}
                onSplitBill={handleSplitBill}
                subtotal={subtotal}
                discount={discount}
                total={total}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Split Bill Dialog */}
      <SplitBillDialog
        open={showSplitBillDialog}
        onOpenChange={setShowSplitBillDialog}
        items={items}
        onProcessSplitPayment={handleProcessSplitPayment}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={(open) => {
          // Don't allow closing during split bill process
          if (!open && splitBillGroups && currentSplitGroupIndex < splitBillGroups.length) {
            toast.warning('Selesaikan pembayaran split bill terlebih dahulu');
            return;
          }
          setShowPaymentDialog(open);
        }}
        total={
          splitBillGroups && splitBillGroups[currentSplitGroupIndex]
            ? splitBillGroups[currentSplitGroupIndex].reduce(
                (sum, item) => sum + item.total_price,
                0
              )
            : total
        }
        onConfirmPayment={handleConfirmPayment}
        splitBillInfo={
          splitBillGroups
            ? {
                currentGroup: currentSplitGroupIndex + 1,
                totalGroups: splitBillGroups.length,
              }
            : undefined
        }
      />

      {/* Hidden Receipt Template for Printing */}
      {receiptData && (
        <div style={{ display: 'none' }}>
          <ReceiptTemplate ref={printRef} data={receiptData} />
        </div>
      )}
    </div>
  );
};
