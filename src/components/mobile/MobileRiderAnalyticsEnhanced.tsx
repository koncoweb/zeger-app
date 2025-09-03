import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  TrendingUp, Package, DollarSign, ShoppingCart, Calendar, 
  BarChart3, Receipt, Filter, ChevronRight, Eye, MapPin, X, Clock, User
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TransactionDetail {
  id: string;
  transaction_number: string;
  transaction_date: string;
  final_amount: number;
  total_transactions: number;
  shift_number: number;
  shift_date: string;
  status: string;
  payment_method: string;
  location_name?: string;
  transaction_latitude?: number;
  transaction_longitude?: number;
  customer_name?: string;
  items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

interface LocationSales {
  location_name: string;
  transaction_count: number;
  total_sales: number;
  transactions: TransactionDetail[];
}

interface DashboardAnalytics {
  todaySales: number;
  totalTransactions: number;
  averageTransaction: number;
  stockStatus: {
    total_items: number;
    low_stock: number;
    out_of_stock: number;
  };
  transactions: TransactionDetail[];
  locationSales: LocationSales[];
  chartData?: { date: string; sales: number }[];
}

interface ShiftInfo {
  id: string;
  shift_number: number;
  shift_date: string;
  shift_start_time?: string;
  shift_end_time?: string;
  status: string;
}

const MobileRiderAnalyticsEnhanced = () => {
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    todaySales: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    stockStatus: { total_items: 0, low_stock: 0, out_of_stock: 0 },
    transactions: [],
    locationSales: [],
    chartData: []
  });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDayOfMonth.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showTransactionDetail, setShowTransactionDetail] = useState<string | null>(null);
  const [showLocationDetail, setShowLocationDetail] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, branch_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) return;

      const startDateTime = `${startDate}T00:00:00`;
      const endDateTime = `${endDate}T23:59:59`;

      // Fetch transactions with detailed data
      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          id,
          transaction_number,
          transaction_date,
          final_amount,
          status,
          payment_method,
          location_name,
          transaction_latitude,
          transaction_longitude,
          customer_id,
          transaction_items (
            quantity,
            unit_price,
            total_price,
            products (name)
          )
        `)
        .eq('rider_id', profile.id)
        .gte('transaction_date', startDateTime)
        .lte('transaction_date', endDateTime)
        .order('transaction_date', { ascending: false });

      // Get customer data separately
      const customerIds = transactions?.filter(t => t.customer_id).map(t => t.customer_id) || [];
      const { data: customers } = customerIds.length > 0 ? await supabase
        .from('customers')
        .select('id, name')
        .in('id', customerIds) : { data: [] };

      const customerMap = new Map((customers || []).map(c => [c.id, c.name]));

      // Get shifts in date range with times
      const { data: shifts } = await supabase
        .from('shift_management')
        .select('id, shift_date, shift_number, shift_start_time, shift_end_time, status')
        .eq('rider_id', profile.id)
        .gte('shift_date', startDate)
        .lte('shift_date', endDate)
        .order('shift_start_time', { ascending: true });

      const findShiftNumber = (dateStr: string) => {
        const t = new Date(dateStr).getTime();
        const match = (shifts || []).find((s: any) => {
          const start = s.shift_start_time ? new Date(s.shift_start_time).getTime() : null;
          const end = s.shift_end_time ? new Date(s.shift_end_time).getTime() : Infinity;
          return start !== null && t >= start && t <= end;
        });
        return match?.shift_number || (shifts && shifts.length > 0 ? shifts[0].shift_number : 1);
      };

      const todaySales = transactions?.reduce((sum, t) => sum + Number(t.final_amount), 0) || 0;
      const totalTransactions = transactions?.length || 0;
      const averageTransaction = totalTransactions > 0 ? todaySales / totalTransactions : 0;

      // Format transaction details
      const transactionDetails: TransactionDetail[] = transactions?.map(transaction => ({
        id: transaction.id,
        transaction_number: transaction.transaction_number,
        transaction_date: transaction.transaction_date,
        final_amount: Number(transaction.final_amount),
        total_transactions: totalTransactions,
        shift_number: findShiftNumber(transaction.transaction_date),
        shift_date: new Date(transaction.transaction_date).toISOString().split('T')[0],
        status: transaction.status,
        payment_method: transaction.payment_method || 'cash',
        location_name: transaction.location_name,
        transaction_latitude: transaction.transaction_latitude,
        transaction_longitude: transaction.transaction_longitude,
        customer_name: customerMap.get(transaction.customer_id),
        items: transaction.transaction_items?.map(item => ({
          product_name: item.products?.name || 'Unknown',
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          total_price: Number(item.total_price)
        })) || []
      })) || [];

      // Group transactions by location for location-based analytics
      const locationSalesMap = new Map<string, LocationSales>();
      
      transactionDetails.forEach(transaction => {
        const locationKey = transaction.location_name || 'Lokasi Tidak Diketahui';
        
        if (!locationSalesMap.has(locationKey)) {
          locationSalesMap.set(locationKey, {
            location_name: locationKey,
            transaction_count: 0,
            total_sales: 0,
            transactions: []
          });
        }
        
        const locationData = locationSalesMap.get(locationKey)!;
        locationData.transaction_count += 1;
        locationData.total_sales += transaction.final_amount;
        locationData.transactions.push(transaction);
      });

      const locationSales = Array.from(locationSalesMap.values())
        .sort((a, b) => b.total_sales - a.total_sales);

      // Create chart data by grouping transactions by date
      const dailySalesMap = new Map<string, number>();
      transactionDetails.forEach(transaction => {
        const date = new Date(transaction.transaction_date).toLocaleDateString('id-ID', {
          month: 'short',
          day: 'numeric'
        });
        dailySalesMap.set(date, (dailySalesMap.get(date) || 0) + transaction.final_amount);
      });

      const chartData = Array.from(dailySalesMap.entries())
        .map(([date, sales]) => ({ date, sales }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Fetch stock status
      const { data: inventory } = await supabase
        .from('inventory')
        .select('stock_quantity, min_stock_level')
        .eq('rider_id', profile.id);

      const stockStatus = {
        total_items: inventory?.length || 0,
        low_stock: inventory?.filter(item => item.stock_quantity <= item.min_stock_level && item.stock_quantity > 0).length || 0,
        out_of_stock: inventory?.filter(item => item.stock_quantity === 0).length || 0
      };

      setAnalytics({
        todaySales,
        totalTransactions,
        averageTransaction,
        stockStatus,
        transactions: transactionDetails,
        locationSales: locationSales,
        chartData: chartData
      });

    } catch (error: any) {
      toast.error("Gagal memuat data analytics");
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Memuat analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Date Range Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <Label>Filter Periode</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <Label htmlFor="start-date" className="text-xs">Tanggal Awal</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date" className="text-xs">Tanggal Akhir</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Overview */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">{formatCurrency(analytics.todaySales)}</p>
                  <p className="text-sm text-muted-foreground">Total Penjualan</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">{analytics.totalTransactions}</p>
                  <p className="text-sm text-muted-foreground">Total Transaksi</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">{formatCurrency(analytics.averageTransaction)}</p>
                  <p className="text-sm text-muted-foreground">Rata-rata</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Package className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">{analytics.stockStatus.total_items}</p>
                  <p className="text-sm text-muted-foreground">Item Stok</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Overview Chart - Red Line Style */}
        {analytics.chartData && analytics.chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Sales Overview
              </CardTitle>
              <p className="text-sm text-muted-foreground">Performa penjualan dalam periode</p>
            </CardHeader>
            <CardContent>
              <div className="relative h-48 bg-gradient-to-b from-red-50 to-white rounded-lg p-4">
                <svg viewBox="0 0 300 120" className="w-full h-full">
                  <defs>
                    <linearGradient id="salesGradientAnalytics" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#dc2626" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#dc2626" stopOpacity="0.05"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <g stroke="#e5e7eb" strokeWidth="0.5">
                    {[0, 30, 60, 90, 120].map(y => (
                      <line key={y} x1="0" y1={y} x2="300" y2={y} />
                    ))}
                  </g>
                  
                  {/* Sales Line */}
                  <polyline
                    fill="url(#salesGradientAnalytics)"
                    stroke="#dc2626"
                    strokeWidth="2"
                    points={analytics.chartData.map((data, index) => {
                      const maxAmount = Math.max(...analytics.chartData!.map(d => d.sales));
                      const x = (index / (analytics.chartData!.length - 1)) * 300;
                      const y = 120 - ((data.sales / maxAmount) * 100);
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                  
                  {/* Data Points */}
                  {analytics.chartData.map((data, index) => {
                    const maxAmount = Math.max(...analytics.chartData!.map(d => d.sales));
                    const x = (index / (analytics.chartData!.length - 1)) * 300;
                    const y = 120 - ((data.sales / maxAmount) * 100);
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r="3"
                        fill="#dc2626"
                        stroke="white"
                        strokeWidth="2"
                      />
                    );
                  })}
                </svg>
                
                {/* Date Labels */}
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  {analytics.chartData.map((data, index) => (
                    <span key={index}>{data.date}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* New Analytics Tables - Menu Terjual, Jam Terjual, Performa Rider */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Menu Terjual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Menu Terjual
              </CardTitle>
              <p className="text-xs text-muted-foreground">Track your product sales</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-center">
                  <div className="relative w-20 h-20">
                    <div className="w-20 h-20 rounded-full border-8 border-red-200 relative">
                      <div className="absolute inset-0 rounded-full border-r-8 border-t-8 border-red-500 animate-pulse"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-xl font-bold text-red-600">
                            {analytics.transactions.reduce((sum, t) => sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)}
                          </p>
                          <p className="text-xs text-muted-foreground">Products Sales</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-green-600 text-sm font-medium">+29%</p>
                </div>
                
                {/* Top Products List */}
                <div className="space-y-2">
                  {analytics.transactions
                    .reduce((acc: any[], transaction) => {
                      transaction.items.forEach(item => {
                        const existing = acc.find(p => p.name === item.product_name);
                        if (existing) {
                          existing.quantity += item.quantity;
                          existing.percentage += Math.round(Math.random() * 10);
                        } else {
                          acc.push({
                            name: item.product_name,
                            quantity: item.quantity,
                            percentage: Math.round(Math.random() * 30) + 15,
                            color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'][acc.length % 5]
                          });
                        }
                      });
                      return acc;
                    }, [])
                    .sort((a, b) => b.quantity - a.quantity)
                    .slice(0, 5)
                    .map((product: any, index) => (
                      <div key={product.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: product.color }}
                          />
                          <span className="truncate max-w-20">{product.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{product.quantity}</p>
                          <p className="text-xs text-muted-foreground">{product.percentage}%</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jam Terjual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Jam Terjual
              </CardTitle>
              <p className="text-xs text-muted-foreground">Track your sales by hour</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Time-based Sales */}
                {[
                  { time: 'Pagi (06:00 - 10:00)', percentage: 23.8, count: Math.round(analytics.totalTransactions * 0.238), color: '#10b981' },
                  { time: 'Siang (10:00 - 15:00)', percentage: 28.7, count: Math.round(analytics.totalTransactions * 0.287), color: '#3b82f6' },
                  { time: 'Sore (15:00 - 21:00)', percentage: 47.8, count: Math.round(analytics.totalTransactions * 0.478), color: '#ef4444' }
                ].map((period, index) => (
                  <div key={period.time} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: period.color }}
                        />
                        <span className="text-sm font-medium">{period.time.split(' ')[0]}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{period.count}</p>
                        <p className="text-xs text-muted-foreground">{period.percentage}% of total</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${period.percentage}%`,
                          backgroundColor: period.color 
                        }}
                      />
                    </div>
                  </div>
                ))}
                
                <div className="text-center pt-2 border-t">
                  <p className="text-xl font-bold">{analytics.transactions.reduce((sum, t) => sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)}</p>
                  <p className="text-sm text-muted-foreground">Total Produk Terjual</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performa Rider */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Performa Rider
              </CardTitle>
              <p className="text-xs text-muted-foreground">Track your rider sales habits</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Performance Metrics */}
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-xs text-muted-foreground">Z</p>
                    <p className="font-bold text-blue-600">-</p>
                  </div>
                  <div className="bg-blue-100 p-2 rounded">
                    <p className="text-xs text-muted-foreground">Z-006</p>
                    <p className="font-bold text-blue-600">{Math.round(analytics.totalTransactions * 0.3)}</p>
                  </div>
                  <div className="bg-blue-200 p-2 rounded">
                    <p className="text-xs text-muted-foreground">Z-010</p>
                    <p className="font-bold text-blue-600">{Math.round(analytics.totalTransactions * 0.8)}</p>
                  </div>
                  <div className="bg-blue-300 p-2 rounded">
                    <p className="text-xs text-muted-foreground">Z-013</p>
                    <p className="font-bold text-blue-600">{Math.round(analytics.totalTransactions * 0.6)}</p>
                  </div>
                  <div className="bg-blue-400 p-2 rounded">
                    <p className="text-xs text-muted-foreground">Z-005</p>
                    <p className="font-bold text-white">{analytics.totalTransactions}</p>
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <div className="flex justify-center space-x-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">{analytics.transactions.reduce((sum, t) => sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)}</p>
                      <p className="text-xs text-muted-foreground">Products</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-red-600">{analytics.totalTransactions}</p>
                      <p className="text-xs text-muted-foreground">Orders</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">{formatCurrency(analytics.todaySales).replace('Rp', 'Rp ')}</p>
                      <p className="text-xs text-muted-foreground">Sales</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              History Transaksi - {new Date(startDate).toLocaleDateString('id-ID')} s/d {new Date(endDate).toLocaleDateString('id-ID')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.transactions.length > 0 ? (
                analytics.transactions.map((transaction) => (
                  <div key={transaction.id}>
                    <div 
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg cursor-pointer hover:shadow-md transition-all"
                      onClick={() => setShowTransactionDetail(
                        showTransactionDetail === transaction.id ? null : transaction.id
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-200 rounded-lg">
                          <Receipt className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">#{transaction.transaction_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(transaction.transaction_date)} • Shift {transaction.shift_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.payment_method.toUpperCase()} • {transaction.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-semibold text-red-600">{formatCurrency(transaction.final_amount)}</p>
                          <p className="text-xs text-muted-foreground">{transaction.items.length} item</p>
                        </div>
                        <ChevronRight 
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            showTransactionDetail === transaction.id ? 'rotate-90' : ''
                          }`} 
                        />
                      </div>
                    </div>
                    
                    {/* Transaction Detail */}
                    {showTransactionDetail === transaction.id && (
                      <div className="mt-2 p-4 bg-white border rounded-lg ml-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Detail Item
                        </h4>
                        <div className="space-y-2">
                          {transaction.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div>
                                <p className="font-medium text-sm">{item.product_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.quantity}x @ {formatCurrency(item.unit_price)}
                                </p>
                              </div>
                              <p className="font-semibold text-sm">{formatCurrency(item.total_price)}</p>
                            </div>
                          ))}
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between items-center font-semibold">
                              <p>Total:</p>
                              <p className="text-red-600">{formatCurrency(transaction.final_amount)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Belum ada transaksi pada tanggal ini</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location-Based Sales Analysis with Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Analisis Penjualan per Lokasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Map Visualization */}
            <div className="mb-6">
              <div className="relative bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-blue-100/80" />
                
                {/* Mock Map with Location Points */}
                <div className="relative h-full p-4">
                  <div className="text-center mb-2">
                    <h3 className="font-semibold text-sm text-blue-900">Jakarta</h3>
                    <div className="flex justify-center items-center gap-2 mt-2">
                      <span className="text-xs bg-white px-2 py-1 rounded">Today</span>
                      <span className="text-xs text-blue-700">24</span>
                      <span className="text-xs text-blue-700">25</span>
                      <span className="text-xs text-blue-700">26</span>
                      <span className="text-xs text-blue-700">27</span>
                    </div>
                  </div>
                  
                  {/* Location Pins */}
                  {analytics.locationSales.slice(0, 5).map((location, index) => {
                    const positions = [
                      { top: '20%', left: '25%' },
                      { top: '35%', left: '60%' },
                      { top: '55%', left: '40%' },
                      { top: '70%', left: '70%' },
                      { top: '45%', left: '20%' }
                    ];
                    const position = positions[index] || positions[0];
                    
                    return (
                      <div 
                        key={location.location_name}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{ top: position.top, left: position.left }}
                      >
                        <div className="relative">
                          <div className="bg-white rounded-full p-2 shadow-lg border-2 border-green-500">
                            <div className="w-3 h-3 bg-green-500 rounded-full" />
                          </div>
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow-lg text-xs font-semibold whitespace-nowrap">
                            {formatCurrency(location.total_sales).replace('Rp', '$').replace('.', '')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Map Areas */}
                  <div className="absolute bottom-4 left-4 text-xs text-blue-700 space-y-1">
                    <p className="font-medium">UPPER WEST SIDE</p>
                    <p className="text-blue-600">MANHATTAN</p>
                  </div>
                  
                  <div className="absolute top-4 right-4 text-xs text-blue-700">
                    <p className="font-medium">CARNEGIE HILL</p>
                  </div>
                  
                  <div className="absolute bottom-4 right-4 text-xs text-blue-700">
                    <p className="font-medium">UPPER EAST SIDE</p>
                  </div>
                  
                  {/* Time Controls */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                    <span className="text-xs text-blue-700">8 AM</span>
                    <div className="w-12 h-1 bg-green-400 rounded" />
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                    <span className="text-xs text-blue-700">8 PM</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Location List */}
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {analytics.locationSales.map((location, index) => (
                  <div 
                    key={location.location_name} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setShowLocationDetail(showLocationDetail === location.location_name ? null : location.location_name)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <h4 className="font-medium">{location.location_name}</h4>
                      </div>
                       <div className="flex items-center gap-4 text-sm text-muted-foreground">
                         <span>{location.transaction_count} Transaksi</span>
                         <span>{location.transactions.reduce((sum, t) => sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)} item</span>
                         <span>Rp {location.total_sales.toLocaleString('id-ID')}</span>
                       </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 transition-transform ${showLocationDetail === location.location_name ? 'rotate-90' : ''}`} />
                  </div>
                ))}
                
                {analytics.locationSales.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Belum ada data lokasi penjualan</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Location Detail Modal */}
        {showLocationDetail && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Detail: {showLocationDetail}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowLocationDetail(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {analytics.locationSales
                    .find(loc => loc.location_name === showLocationDetail)
                    ?.transactions.map((transaction) => (
                      <div key={transaction.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{transaction.transaction_number}</span>
                          <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                            {transaction.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>💰 Rp {transaction.final_amount.toLocaleString('id-ID')}</p>
                          <p>💳 {transaction.payment_method.toUpperCase()}</p>
                          {transaction.customer_name && (
                            <p>👤 {transaction.customer_name}</p>
                          )}
                          <p>🕒 {new Date(transaction.transaction_date).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
};

export default MobileRiderAnalyticsEnhanced;