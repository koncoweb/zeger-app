import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePOSAuth } from '@/hooks/usePOSAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZegerLogo } from '@/components/ui/zeger-logo';
import { 
  ShoppingCart, 
  History, 
  Package, 
  Clock, 
  LogOut,
  TrendingUp,
  DollarSign,
  ShoppingBag
} from 'lucide-react';
import { Branch } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { OfflineIndicator } from '@/components/pos/OfflineIndicator';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Badge } from '@/components/ui/badge';

interface SalesSummary {
  totalTransactions: number;
  totalSales: number;
  itemsSold: number;
}

export const POSDashboard = () => {
  const navigate = useNavigate();
  const { profile, signOut } = usePOSAuth();
  const { pendingCount, isSyncing } = useOfflineSync();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [salesSummary, setSalesSummary] = useState<SalesSummary>({
    totalTransactions: 0,
    totalSales: 0,
    itemsSold: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.branch_id) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch branch info
      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .eq('id', profile!.branch_id!)
        .single();

      if (branchError) throw branchError;
      setBranch(branchData);

      // Fetch today's sales summary
      const today = new Date().toISOString().split('T')[0];
      
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('id, final_amount, transaction_items(quantity)')
        .eq('branch_id', profile!.branch_id!)
        .gte('transaction_date', today)
        .eq('status', 'completed')
        .eq('is_voided', false);

      if (transError) throw transError;

      // Calculate summary
      const totalTransactions = transactions?.length || 0;
      const totalSales = transactions?.reduce((sum, t) => sum + (t.final_amount || 0), 0) || 0;
      const itemsSold = transactions?.reduce((sum, t) => {
        const items = t.transaction_items as any[];
        return sum + (items?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) || 0);
      }, 0) || 0;

      setSalesSummary({
        totalTransactions,
        totalSales,
        itemsSold,
      });
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/pos-app/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Gagal logout');
    }
  };

  const menuItems = [
    {
      title: 'Transaksi Baru',
      icon: ShoppingCart,
      path: '/pos-app/transaction',
      color: 'bg-red-600 hover:bg-red-700',
    },
    {
      title: 'Riwayat',
      icon: History,
      path: '/pos-app/history',
      color: 'bg-orange-600 hover:bg-orange-700',
    },
    {
      title: 'Inventory',
      icon: Package,
      path: '/pos-app/inventory',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Absensi',
      icon: Clock,
      path: '/pos-app/attendance',
      color: 'bg-green-600 hover:bg-green-700',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
      {/* Header */}
      <header className="bg-red-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <ZegerLogo className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Zeger POS</h1>
                {loading ? (
                  <Skeleton className="h-4 w-32 bg-red-500" />
                ) : (
                  <p className="text-red-100 text-sm">{branch?.name || 'Loading...'}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-red-100">Kasir</p>
                <p className="font-semibold">{profile?.full_name}</p>
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="mt-1">
                    {isSyncing ? 'Syncing...' : `${pendingCount} pending`}
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-white hover:bg-red-700"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Offline Indicator */}
        <OfflineIndicator />
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-red-100 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Transaksi
              </CardTitle>
              <ShoppingBag className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold text-red-600">
                  {salesSummary.totalTransactions}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Hari ini</p>
            </CardContent>
          </Card>

          <Card className="border-red-100 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Penjualan
              </CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-3xl font-bold text-green-600">
                  Rp {salesSummary.totalSales.toLocaleString('id-ID')}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Hari ini</p>
            </CardContent>
          </Card>

          <Card className="border-red-100 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Item Terjual
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold text-blue-600">
                  {salesSummary.itemsSold}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Hari ini</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.path}
                className="border-gray-200 shadow-md hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => navigate(item.path)}
              >
                <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                  <div className={`${item.color} w-20 h-20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-red-600 transition-colors">
                    {item.title}
                  </h3>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};
