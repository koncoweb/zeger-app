import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

interface RiderExpense {
  id: string;
  expense_type: string;
  amount: number;
  description: string | null;
  expense_date: string;
  rider_id: string;
  rider_name: string;
  shift_date: string;
}

interface Rider {
  id: string;
  full_name: string;
}

export default function RiderExpenses() {
  const [expenses, setExpenses] = useState<RiderExpense[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRider, setSelectedRider] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  const fetchRiders = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('role', ['rider', 'sb_rider', 'bh_rider'])
      .eq('is_active', true);
    
    setRiders(data || []);
  };

  const fetchExpenses = async () => {
    setLoading(true);
    
    let query = supabase
      .from('daily_operational_expenses')
      .select(`
        id,
        expense_type,
        amount,
        description,
        expense_date,
        rider_id,
        shift_management!daily_operational_expenses_shift_id_fkey (
          shift_date,
          rider_id,
          profiles!shift_management_rider_id_fkey (
            full_name
          )
        )
      `)
      .gte('expense_date', startDate.toISOString().split('T')[0])
      .lte('expense_date', endDate.toISOString().split('T')[0])
      .order('expense_date', { ascending: false });

    if (selectedRider !== "all") {
      query = query.eq('rider_id', selectedRider);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Gagal memuat data beban operasional');
      setLoading(false);
      return;
    }

    const formattedExpenses = (data || []).map((expense: any) => ({
      id: expense.id,
      expense_type: expense.expense_type,
      amount: expense.amount,
      description: expense.description,
      expense_date: expense.expense_date,
      rider_id: expense.rider_id,
      rider_name: expense.shift_management?.profiles?.full_name || 'Unknown',
      shift_date: expense.shift_management?.shift_date || expense.expense_date
    }));

    setExpenses(formattedExpenses);
    setLoading(false);
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [selectedRider, startDate, endDate]);

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  const exportToCSV = () => {
    const headers = ['Tanggal', 'Rider', 'Jenis Beban', 'Jumlah', 'Keterangan'];
    const csvData = expenses.map(expense => [
      new Date(expense.expense_date).toLocaleDateString('id-ID'),
      expense.rider_name,
      expense.expense_type,
      expense.amount,
      expense.description || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `beban-operasional-rider-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Beban Operasional Rider</h1>
          <p className="text-muted-foreground">Data beban operasional yang diinput oleh rider</p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{currency.format(totalExpenses)}</div>
              <div className="text-sm text-muted-foreground">Total Beban</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{expenses.length}</div>
              <div className="text-sm text-muted-foreground">Total Transaksi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{currency.format(expenses.length > 0 ? totalExpenses / expenses.length : 0)}</div>
              <div className="text-sm text-muted-foreground">Rata-rata per Transaksi</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Rider</Label>
              <Select value={selectedRider} onValueChange={setSelectedRider}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih rider" />
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
            
            <div>
              <Label>Tanggal Mulai</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Tanggal Akhir</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Beban Operasional</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Tanggal</th>
                    <th className="text-left p-2">Rider</th>
                    <th className="text-left p-2">Jenis Beban</th>
                    <th className="text-right p-2">Jumlah</th>
                    <th className="text-left p-2">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        {new Date(expense.expense_date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="p-2">{expense.rider_name}</td>
                      <td className="p-2 capitalize">{expense.expense_type}</td>
                      <td className="p-2 text-right font-medium">
                        {currency.format(expense.amount)}
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {expense.description || '-'}
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-muted-foreground">
                        Tidak ada data beban operasional
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}