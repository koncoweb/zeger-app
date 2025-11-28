import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePOSAuth } from '@/hooks/usePOSAuth';
import { usePrint } from '@/hooks/usePrint';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Printer, Ban, X } from 'lucide-react';
import { ReceiptTemplate } from './ReceiptTemplate';

interface TransactionItem {
  id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: {
    name: string;
    code: string;
  };
}

interface Transaction {
  id: string;
  transaction_number: string;
  transaction_date: string;
  total_amount: number;
  discount_amount: number | null;
  final_amount: number;
  payment_method: string | null;
  status: string | null;
  is_voided: boolean | null;
  metadata: any;
  branch?: {
    name: string;
    address: string | null;
  };
}

interface TransactionDetailProps {
  transactionId: string | null;
  open: boolean;
  onClose: () => void;
  onVoidRequest?: () => void;
}

export const TransactionDetail = ({
  transactionId,
  open,
  onClose,
  onVoidRequest,
}: TransactionDetailProps) => {
  const { profile } = usePOSAuth();
  const { printReceipt } = usePrint();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [voidLoading, setVoidLoading] = useState(false);

  useEffect(() => {
    if (transactionId && open) {
      fetchTransactionDetail();
    }
  }, [transactionId, open]);

  const fetchTransactionDetail = async () => {
    try {
      setLoading(true);

      if (!transactionId) return;

      // Fetch transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select(`
          *,
          branch:branches(name, address)
        `)
        .eq('id', transactionId)
        .single();

      if (transactionError) throw transactionError;

      setTransaction(transactionData);

      // Fetch transaction items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from('transaction_items')
        .select(`
          *,
          product:products(name, code)
        `)
        .eq('transaction_id', transactionId);

      if (itemsError) throw itemsError;

      setItems(itemsData || []);
    } catch (error: any) {
      console.error('Error fetching transaction detail:', error);
      toast.error('Gagal memuat detail transaksi');
    } finally {
      setLoading(false);
    }
  };

  const handleVoidRequest = async () => {
    if (!transaction || !profile) return;

    try {
      setVoidLoading(true);

      // Check if already voided
      if (transaction.is_voided) {
        toast.error('Transaksi sudah di-void');
        return;
      }

      // Check if void request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('transaction_void_requests')
        .select('id, status')
        .eq('transaction_id', transaction.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          toast.info('Request void sudah diajukan dan menunggu approval');
          return;
        } else if (existingRequest.status === 'approved') {
          toast.info('Request void sudah disetujui');
          return;
        }
      }

      // Create void request
      const { error: insertError } = await supabase
        .from('transaction_void_requests')
        .insert({
          transaction_id: transaction.id,
          branch_id: profile.branch_id!,
          rider_id: profile.id,
          reason: 'Request void dari kasir',
          status: 'pending',
        });

      if (insertError) throw insertError;

      toast.success('Request void berhasil diajukan dan menunggu approval dari manager');
      
      if (onVoidRequest) {
        onVoidRequest();
      }
    } catch (error: any) {
      console.error('Error creating void request:', error);
      toast.error('Gagal membuat request void: ' + error.message);
    } finally {
      setVoidLoading(false);
    }
  };

  const handleReprint = () => {
    if (!transaction || !items.length) {
      toast.error('Data transaksi tidak lengkap');
      return;
    }

    const receiptData = {
      transaction_number: transaction.transaction_number,
      branch_name: transaction.branch?.name || 'Zeger',
      branch_address: transaction.branch?.address || '',
      transaction_date: new Date(transaction.transaction_date),
      items: items.map((item) => ({
        product_id: item.product_id || '',
        product_name: item.product?.name || 'Unknown Product',
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })),
      subtotal: transaction.total_amount,
      discount: transaction.discount_amount || 0,
      total: transaction.final_amount,
      payment_method: transaction.payment_method || 'cash',
      cash_received: transaction.metadata?.payment_details?.cash_received,
      change: transaction.metadata?.payment_details?.change,
    };

    printReceipt(receiptData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy HH:mm', { locale: idLocale });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-600">
            Detail Transaksi
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Separator />
            <Skeleton className="h-32 w-full" />
            <Separator />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : transaction ? (
          <div className="space-y-4">
            {/* Transaction Info */}
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Nomor Transaksi</p>
                  <p className="font-bold text-lg">{transaction.transaction_number}</p>
                </div>
                {transaction.is_voided && (
                  <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                    VOID
                  </span>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-500">Tanggal & Waktu</p>
                <p className="font-medium">{formatDate(transaction.transaction_date)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Metode Pembayaran</p>
                <p className="font-medium capitalize">{transaction.payment_method || '-'}</p>
              </div>

              {transaction.metadata?.payment_details?.cash_received && (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Uang Diterima</p>
                    <p className="font-medium">
                      {formatCurrency(transaction.metadata.payment_details.cash_received)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Kembalian</p>
                    <p className="font-medium">
                      {formatCurrency(transaction.metadata.payment_details.change || 0)}
                    </p>
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* Items List */}
            <div>
              <h3 className="font-bold mb-3">Item Transaksi</h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.product?.name || 'Unknown Product'}</p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} x {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(item.total_price)}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <p className="text-gray-600">Subtotal</p>
                <p className="font-medium">{formatCurrency(transaction.total_amount)}</p>
              </div>

              {transaction.discount_amount && transaction.discount_amount > 0 && (
                <div className="flex justify-between">
                  <p className="text-gray-600">Diskon</p>
                  <p className="font-medium text-red-600">
                    -{formatCurrency(transaction.discount_amount)}
                  </p>
                </div>
              )}

              <Separator />

              <div className="flex justify-between items-center">
                <p className="text-lg font-bold">Total</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(transaction.final_amount)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleReprint}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Printer className="mr-2 h-4 w-4" />
                Cetak Ulang
              </Button>

              {!transaction.is_voided && (
                <Button
                  onClick={handleVoidRequest}
                  disabled={voidLoading}
                  variant="destructive"
                  className="flex-1"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  {voidLoading ? 'Memproses...' : 'Void Transaksi'}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Transaksi tidak ditemukan
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
