import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign, Users, Calendar, TrendingUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Rider {
  id: string;
  full_name: string;
}

interface CashDepositData {
  rider_id: string;
  rider_name: string;
  date: string;
  total_sales: number;
  cash_sales: number;
  qris_sales: number;
  transfer_sales: number;
  operational_expenses: number;
  total_deposit: number;
}

const StockTransfer = () => {
  const { user, userProfile } = useAuth();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRider, setSelectedRider] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("today");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [cashDeposits, setCashDeposits] = useState<CashDepositData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Riwayat Setoran Tunai | Zeger ERP";
    fetchRiders();
  }, []);

  useEffect(() => {
    if (riders.length > 0) {
      fetchCashDeposits();
    }
  }, [riders, selectedRider, dateFilter, customStartDate, customEndDate]);

  const fetchRiders = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['rider', 'bh_rider', 'sb_rider'])
        .eq('is_active', true)
        .order('full_name');

      if (userProfile?.role === 'branch_manager' && userProfile?.branch_id) {
        query = query.eq('branch_id', userProfile.branch_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRiders(data || []);
    } catch (error: any) {
      console.error('Error fetching riders:', error);
      toast.error('Gagal memuat data rider');
    }
  };

  const getDateRange = () => {
    const today = new Date();
    const jakartaNow = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    switch (dateFilter) {
      case "today":
        return { startDate: formatDate(jakartaNow), endDate: formatDate(jakartaNow) };
      case "yesterday":
        const yesterday = new Date(jakartaNow);
        yesterday.setDate(yesterday.getDate() - 1);
        return { startDate: formatDate(yesterday), endDate: formatDate(yesterday) };
      case "week":
        const weekStart = new Date(jakartaNow);
        weekStart.setDate(jakartaNow.getDate() - 7);
        return { startDate: formatDate(weekStart), endDate: formatDate(jakartaNow) };
      case "month":
        const monthStart = new Date(jakartaNow.getFullYear(), jakartaNow.getMonth(), 1);
        return { startDate: formatDate(monthStart), endDate: formatDate(jakartaNow) };
      case "custom":
        return { startDate: customStartDate, endDate: customEndDate };
      default:
        return { startDate: formatDate(jakartaNow), endDate: formatDate(jakartaNow) };
    }
  };

  const fetchCashDeposits = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateRange();
      if (!startDate || !endDate) return;

      const riderFilter = selectedRider !== "all" ? [selectedRider] : riders.map(r => r.id);
      const results: CashDepositData[] = [];

      for (const riderId of riderFilter) {
        const rider = riders.find(r => r.id === riderId);
        if (!rider) continue;

        // Fetch transactions
        const { data: transactions, error: txError } = await supabase
          .from('transactions')
          .select('transaction_date, final_amount, payment_method, status')
          .eq('rider_id', riderId)
          .eq('status', 'completed')
          .gte('transaction_date', `${startDate}T00:00:00`)
          .lte('transaction_date', `${endDate}T23:59:59`);

        if (txError) throw txError;

        // Fetch operational expenses
        const { data: expenses, error: expError } = await supabase
          .from('daily_operational_expenses')
          .select('expense_date, amount')
          .eq('rider_id', riderId)
          .gte('expense_date', startDate)
          .lte('expense_date', endDate);

        if (expError) throw expError;

        // Group by date
        const dateGroups: { [date: string]: CashDepositData } = {};

        transactions?.forEach(tx => {
          const date = new Date(tx.transaction_date).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
          if (!dateGroups[date]) {
            dateGroups[date] = {
              rider_id: riderId,
              rider_name: rider.full_name,
              date,
              total_sales: 0,
              cash_sales: 0,
              qris_sales: 0,
              transfer_sales: 0,
              operational_expenses: 0,
              total_deposit: 0
            };
          }

          const amount = parseFloat(tx.final_amount.toString());
          dateGroups[date].total_sales += amount;

          if (tx.payment_method === 'cash') {
            dateGroups[date].cash_sales += amount;
          } else if (tx.payment_method === 'qris') {
            dateGroups[date].qris_sales += amount;
          } else if (tx.payment_method === 'bank_transfer') {
            dateGroups[date].transfer_sales += amount;
          }
        });

        expenses?.forEach(exp => {
          const date = exp.expense_date;
          if (dateGroups[date]) {
            dateGroups[date].operational_expenses += parseFloat(exp.amount.toString());
          }
        });

        // Calculate total deposit
        Object.values(dateGroups).forEach(group => {
          group.total_deposit = group.cash_sales - group.operational_expenses;
          results.push(group);
        });
      }

      results.sort((a, b) => b.date.localeCompare(a.date));
      setCashDeposits(results);
    } catch (error: any) {
      console.error('Error fetching cash deposits:', error);
      toast.error('Gagal memuat data setoran tunai');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Calculate resume (aggregated totals)
  const resumeData = cashDeposits.reduce((acc, curr) => {
    const existing = acc.find(item => item.rider_id === curr.rider_id);
    if (existing) {
      existing.total_sales += curr.total_sales;
      existing.cash_sales += curr.cash_sales;
      existing.qris_sales += curr.qris_sales;
      existing.transfer_sales += curr.transfer_sales;
      existing.operational_expenses += curr.operational_expenses;
      existing.total_deposit += curr.total_deposit;
    } else {
      acc.push({ ...curr });
    }
    return acc;
  }, [] as CashDepositData[]);

  // Calculate totals and averages
  const totals = cashDeposits.reduce((acc, curr) => ({
    total_sales: acc.total_sales + curr.total_sales,
    cash_sales: acc.cash_sales + curr.cash_sales,
    qris_sales: acc.qris_sales + curr.qris_sales,
    transfer_sales: acc.transfer_sales + curr.transfer_sales,
    operational_expenses: acc.operational_expenses + curr.operational_expenses,
    total_deposit: acc.total_deposit + curr.total_deposit
  }), {
    total_sales: 0,
    cash_sales: 0,
    qris_sales: 0,
    transfer_sales: 0,
    operational_expenses: 0,
    total_deposit: 0
  });

  const averages = {
    total_sales: cashDeposits.length ? totals.total_sales / cashDeposits.length : 0,
    cash_sales: cashDeposits.length ? totals.cash_sales / cashDeposits.length : 0,
    qris_sales: cashDeposits.length ? totals.qris_sales / cashDeposits.length : 0,
    transfer_sales: cashDeposits.length ? totals.transfer_sales / cashDeposits.length : 0,
    operational_expenses: cashDeposits.length ? totals.operational_expenses / cashDeposits.length : 0,
    total_deposit: cashDeposits.length ? totals.total_deposit / cashDeposits.length : 0
  };

  if (!user || !userProfile) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Riwayat Setoran Tunai</h1>
        <p className="text-muted-foreground">Kelola dan pantau setoran tunai rider</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Rider</Label>
              <Select value={selectedRider} onValueChange={setSelectedRider}>
                <SelectTrigger>
                  <Users className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Rider</SelectItem>
                  {riders.map((rider) => (
                    <SelectItem key={rider.id} value={rider.id}>
                      {rider.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Periode</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="yesterday">Kemarin</SelectItem>
                  <SelectItem value="week">Minggu Ini</SelectItem>
                  <SelectItem value="month">Bulan Ini</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateFilter === "custom" && (
              <>
                <div className="space-y-2">
                  <Label>Tanggal Mulai</Label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Selesai</Label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <Button onClick={fetchCashDeposits} disabled={loading} className="w-full">
                {loading ? "Loading..." : "Terapkan Filter"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resume Setoran Tunai */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Resume Setoran Tunai
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nama Rider</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                  <TableHead className="text-right">Penjualan Tunai</TableHead>
                  <TableHead className="text-right">QRIS</TableHead>
                  <TableHead className="text-right">Transfer Bank</TableHead>
                  <TableHead className="text-right">Beban Operasional</TableHead>
                  <TableHead className="text-right">Total Setoran Tunai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumeData.map((data, index) => (
                  <TableRow key={data.rider_id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{data.rider_name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(data.total_sales)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(data.cash_sales)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(data.qris_sales)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(data.transfer_sales)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(data.operational_expenses)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(data.total_deposit)}</TableCell>
                  </TableRow>
                ))}
                {resumeData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Riwayat Setoran Tunai */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Riwayat Setoran Tunai
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Nama Rider</TableHead>
                  <TableHead className="text-right">Total Sales</TableHead>
                  <TableHead className="text-right">Penjualan Tunai</TableHead>
                  <TableHead className="text-right">QRIS</TableHead>
                  <TableHead className="text-right">Transfer Bank</TableHead>
                  <TableHead className="text-right">Beban Operasional</TableHead>
                  <TableHead className="text-right">Total Setoran Tunai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashDeposits.map((data, index) => (
                  <TableRow key={`${data.rider_id}-${data.date}`}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{formatDate(data.date)}</TableCell>
                    <TableCell className="font-medium">{data.rider_name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(data.total_sales)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(data.cash_sales)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(data.qris_sales)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(data.transfer_sales)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(data.operational_expenses)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(data.total_deposit)}</TableCell>
                  </TableRow>
                ))}
                {cashDeposits.length > 0 && (
                  <>
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={3}>TOTAL</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.total_sales)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.cash_sales)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.qris_sales)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.transfer_sales)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.operational_expenses)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.total_deposit)}</TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell colSpan={3}>AVERAGE</TableCell>
                      <TableCell className="text-right">{formatCurrency(averages.total_sales)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(averages.cash_sales)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(averages.qris_sales)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(averages.transfer_sales)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(averages.operational_expenses)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(averages.total_deposit)}</TableCell>
                    </TableRow>
                  </>
                )}
                {cashDeposits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockTransfer;
