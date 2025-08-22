import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  TrendingUp,
  Camera,
  CheckCircle,
  AlertCircle,
  User,
  LogOut
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ZegerLogo } from "@/components/ui/zeger-logo";
import { useAuth } from "@/hooks/useAuth";

interface AttendanceRecord {
  id: string;
  work_date: string;
  check_in_time: string;
  check_out_time?: string;
  check_in_location: string;
  check_out_location?: string;
  status: string;
}

interface DashboardStats {
  stock_items: number;
  pending_stock: number;
  total_sales: number;
  avg_per_transaction: number;
  attendance_today?: AttendanceRecord;
}

const MobileRiderDashboard = () => {
  const { userProfile, signOut } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    stock_items: 0,
    pending_stock: 0,
    total_sales: 0,
    avg_per_transaction: 0
  });
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchAttendanceHistory();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, branch_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) return;

      // Fetch stock items
      const { data: inventory } = await supabase
        .from('inventory')
        .select('*')
        .eq('rider_id', profile.id);

      const stockItems = inventory?.reduce((sum, item) => sum + item.stock_quantity, 0) || 0;

      // Fetch pending stock transfers
      const { data: pendingStock } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('rider_id', profile.id)
        .eq('movement_type', 'transfer')
        .is('notes', null);

      // Fetch today's sales
      const today = new Date().toISOString().split('T')[0];
      const { data: transactions } = await supabase
        .from('transactions')
        .select('final_amount')
        .eq('rider_id', profile.id)
        .gte('transaction_date', `${today}T00:00:00`)
        .lte('transaction_date', `${today}T23:59:59`);

      const totalSales = transactions?.reduce((sum, t) => sum + Number(t.final_amount), 0) || 0;
      const avgPerTransaction = transactions?.length > 0 ? totalSales / transactions.length : 0;

      // Check today's attendance
      const { data: todayAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('rider_id', profile.id)
        .eq('work_date', today)
        .eq('status', 'checked_in')
        .maybeSingle();

      setStats({
        stock_items: stockItems,
        pending_stock: pendingStock?.length || 0,
        total_sales: totalSales,
        avg_per_transaction: avgPerTransaction,
        attendance_today: todayAttendance || undefined
      });

      setIsCheckedIn(!!todayAttendance);
    } catch (error: any) {
      toast.error("Gagal memuat data dashboard");
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) return;

      const { data: attendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('rider_id', profile.id)
        .order('work_date', { ascending: false })
        .limit(10);

      setAttendanceHistory(attendance || []);
    } catch (error: any) {
      toast.error("Gagal memuat riwayat absensi");
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const position = await getCurrentLocation();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, branch_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('attendance')
        .insert([{
          rider_id: profile.id,
          branch_id: profile.branch_id,
          work_date: new Date().toISOString().split('T')[0],
          check_in_location: position,
          check_in_time: new Date().toISOString(),
          status: 'checked_in'
        }]);

      if (error) throw error;

      toast.success("Absen masuk berhasil!");
      setIsCheckedIn(true);
      fetchDashboardData();
      fetchAttendanceHistory();
    } catch (error: any) {
      toast.error("Gagal absen masuk: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const position = await getCurrentLocation();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) throw new Error('Profile not found');

      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('attendance')
        .update({
          check_out_location: position,
          check_out_time: new Date().toISOString(),
          status: 'checked_out'
        })
        .eq('rider_id', profile.id)
        .eq('work_date', today)
        .eq('status', 'checked_in');

      if (error) throw error;

      toast.success("Absen keluar berhasil!");
      setIsCheckedIn(false);
      fetchDashboardData();
      fetchAttendanceHistory();
    } catch (error: any) {
      toast.error("Gagal absen keluar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = (): Promise<string> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve(`${position.coords.latitude}, ${position.coords.longitude}`);
          },
          () => resolve("Lokasi tidak tersedia")
        );
      } else {
        resolve("Lokasi tidak tersedia");
      }
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50/30 to-white">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ZegerLogo size="sm" />
            <div>
              <h1 className="font-bold text-lg">Dashboard Rider</h1>
              <p className="text-sm text-muted-foreground">
                Selamat datang, {userProfile?.full_name}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-red-600 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          {!isCheckedIn ? (
            <Button
              onClick={handleCheckIn}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white h-16"
            >
              <CheckCircle className="h-5 w-5" />
              <div className="text-center">
                <div className="font-semibold">Check In</div>
                <div className="text-xs opacity-90">Mulai Shift</div>
              </div>
            </Button>
          ) : (
            <Button
              onClick={handleCheckOut}
              disabled={loading}
              variant="destructive"
              className="flex items-center justify-center gap-2 h-16"
            >
              <Clock className="h-5 w-5" />
              <div className="text-center">
                <div className="font-semibold">Check Out</div>
                <div className="text-xs opacity-90">Akhiri Shift</div>
              </div>
            </Button>
          )}
          
          <Button
            variant="outline"
            className="flex items-center justify-center gap-2 h-16"
            onClick={() => window.location.href = '/mobile-seller'}
          >
            <Package className="h-5 w-5" />
            <div className="text-center">
              <div className="font-semibold">Penjualan</div>
              <div className="text-xs text-muted-foreground">Mulai Jual</div>
            </div>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.stock_items}</p>
                  <p className="text-sm text-muted-foreground">Stok Tersedia</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending_stock}</p>
                  <p className="text-sm text-muted-foreground">Stok Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">{formatCurrency(stats.total_sales)}</p>
                  <p className="text-sm text-muted-foreground">Penjualan Hari Ini</p>
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
                  <p className="text-lg font-bold">{formatCurrency(stats.avg_per_transaction)}</p>
                  <p className="text-sm text-muted-foreground">Rata-rata Transaksi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Status */}
        {stats.attendance_today && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Status Absensi Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {stats.attendance_today.status === 'checked_in' ? 'Sedang Bekerja' : 'Selesai'}
                  </Badge>
                  <div>
                    <p className="font-medium">Check In: {formatTime(stats.attendance_today.check_in_time)}</p>
                    {stats.attendance_today.check_out_time && (
                      <p className="text-sm text-muted-foreground">
                        Check Out: {formatTime(stats.attendance_today.check_out_time)}
                      </p>
                    )}
                  </div>
                </div>
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Riwayat Absensi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {attendanceHistory.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{formatDate(record.work_date)}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Masuk: {formatTime(record.check_in_time)}</span>
                        {record.check_out_time && (
                          <span>Keluar: {formatTime(record.check_out_time)}</span>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant={record.status === 'checked_out' ? 'secondary' : 'default'}
                      className={record.status === 'checked_out' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {record.status === 'checked_out' ? 'Selesai' : 'Aktif'}
                    </Badge>
                  </div>
                ))}
                {attendanceHistory.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada riwayat absensi
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileRiderDashboard;