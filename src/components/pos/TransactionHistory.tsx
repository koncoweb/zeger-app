import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePOSAuth } from '@/hooks/usePOSAuth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { CalendarIcon, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  transaction_number: string;
  transaction_date: string;
  final_amount: number;
  payment_method: string | null;
  status: string | null;
  is_voided: boolean | null;
}

interface TransactionHistoryProps {
  onSelectTransaction: (transactionId: string) => void;
}

export const TransactionHistory = ({ onSelectTransaction }: TransactionHistoryProps) => {
  const { profile } = usePOSAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date());
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (profile?.branch_id) {
      fetchTransactions();
    }
  }, [profile, dateFrom, dateTo]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      if (!profile?.branch_id) {
        throw new Error('Branch ID tidak ditemukan');
      }

      let query = supabase
        .from('transactions')
        .select('id, transaction_number, transaction_date, final_amount, payment_method, status, is_voided')
        .eq('branch_id', profile.branch_id)
        .order('transaction_date', { ascending: false });

      // Apply date filters
      if (dateFrom) {
        const startOfDay = new Date(dateFrom);
        startOfDay.setHours(0, 0, 0, 0);
        query = query.gte('transaction_date', startOfDay.toISOString());
      }

      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('transaction_date', endOfDay.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error('Gagal memuat riwayat transaksi');
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions by search query
  const filteredTransactions = transactions.filter((transaction) =>
    transaction.transaction_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: idLocale });
  };

  const getStatusBadge = (status: string | null, isVoided: boolean | null) => {
    if (isVoided) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
          Void
        </span>
      );
    }

    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            Selesai
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nomor transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Date From */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full md:w-[200px] justify-start text-left font-normal',
                !dateFrom && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, 'dd MMM yyyy', { locale: idLocale }) : 'Dari tanggal'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={setDateFrom}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full md:w-[200px] justify-start text-left font-normal',
                !dateTo && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, 'dd MMM yyyy', { locale: idLocale }) : 'Sampai tanggal'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-red-50">
              <TableHead className="font-bold">No. Transaksi</TableHead>
              <TableHead className="font-bold">Tanggal</TableHead>
              <TableHead className="font-bold">Total</TableHead>
              <TableHead className="font-bold">Pembayaran</TableHead>
              <TableHead className="font-bold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                </TableRow>
              ))
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Tidak ada transaksi ditemukan
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onSelectTransaction(transaction.id)}
                >
                  <TableCell className="font-medium">
                    {transaction.transaction_number}
                  </TableCell>
                  <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {formatCurrency(transaction.final_amount)}
                  </TableCell>
                  <TableCell className="capitalize">
                    {transaction.payment_method || '-'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(transaction.status, transaction.is_voided)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
