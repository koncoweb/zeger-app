import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Search, Filter, ArrowLeft, Download, Plus, Mail, Phone, MapPin, Calendar, TrendingUp, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  is_active: boolean;
  created_at: string;
  rider_id: string;
  profiles: {
    full_name: string;
  };
}

interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  points: number;
  is_online: boolean;
  created_at: string;
  updated_at: string;
}

interface CustomerOrder {
  id: string;
  total_price: number;
  status: string;
  created_at: string;
  customer_users: {
    name: string;
  };
}

export default function CRMManagement() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerUsers, setCustomerUsers] = useState<CustomerUser[]>([]);
  const [recentOrders, setRecentOrders] = useState<CustomerOrder[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [filteredCustomerUsers, setFilteredCustomerUsers] = useState<CustomerUser[]>([]);
  const [riders, setRiders] = useState<{ id: string; full_name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRider, setSelectedRider] = useState("all");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalAppUsers: 0,
    onlineUsers: 0,
    totalOrders: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    document.title = 'CRM Management | Zeger ERP';
    fetchRiders();
    fetchCustomers();
    fetchCustomerUsers();
    fetchRecentOrders();
    fetchStats();
  }, []);

  useEffect(() => {
    filterCustomers();
    filterCustomerUsers();
  }, [customers, customerUsers, searchTerm, selectedRider]);

  const fetchStats = async () => {
    try {
      // Get customer stats
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, is_active');
      
      if (customerError) throw customerError;

      // Get customer users stats
      const { data: userAppData, error: userAppError } = await supabase
        .from('customer_users')
        .select('id, is_online');
      
      if (userAppError) throw userAppError;

      // Get orders stats
      const { data: ordersData, error: ordersError } = await supabase
        .from('customer_orders')
        .select('id, total_price, status');
      
      if (ordersError) throw ordersError;

      const totalRevenue = ordersData?.reduce((sum, order) => sum + order.total_price, 0) || 0;

      setStats({
        totalCustomers: customerData?.length || 0,
        activeCustomers: customerData?.filter(c => c.is_active).length || 0,
        totalAppUsers: userAppData?.length || 0,
        onlineUsers: userAppData?.filter(u => u.is_online).length || 0,
        totalOrders: ordersData?.length || 0,
        totalRevenue
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCustomerUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCustomerUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching customer users:', error);
      toast.error('Gagal memuat data customer app');
    }
  };

  const fetchRecentOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_orders')
        .select(`
          id,
          total_price,
          status,
          created_at,
          customer_users (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setRecentOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching recent orders:', error);
    }
  };

  const fetchRiders = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['rider', 'sb_rider', 'bh_rider'])
        .eq('is_active', true)
        .order('full_name');
      
      if (error) throw error;
      setRiders(data || []);
    } catch (error) {
      console.error('Error fetching riders:', error);
      toast.error('Gagal memuat data rider');
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          profiles!customers_rider_id_fkey (
            full_name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Gagal memuat data pelanggan');
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedRider !== "all") {
      filtered = filtered.filter(customer => customer.rider_id === selectedRider);
    }

    setFilteredCustomers(filtered);
  };

  const filterCustomerUsers = () => {
    let filtered = customerUsers;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCustomerUsers(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleExport = (type: 'pos' | 'app') => {
    const data = type === 'pos' ? filteredCustomers : filteredCustomerUsers;
    
    let csvData;
    if (type === 'pos') {
      csvData = filteredCustomers.map(c => ({
        Nama: c.name,
        Telepon: c.phone || '-',
        Alamat: c.address || '-',
        Status: c.is_active ? 'Aktif' : 'Nonaktif',
        Rider: c.profiles?.full_name || '-',
        'Tanggal Daftar': formatDate(c.created_at)
      }));
    } else {
      csvData = filteredCustomerUsers.map(u => ({
        Nama: u.name,
        Email: u.email || '-',
        Telepon: u.phone || '-',
        Alamat: u.address || '-',
        Poin: u.points,
        Status: u.is_online ? 'Online' : 'Offline',
        'Tanggal Daftar': formatDate(u.created_at)
      }));
    }

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer-${type}-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success('Data berhasil diexport');
  };

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/settings/app-management')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6" />
              CRM Management
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Customer Relationship Management - Kelola data pelanggan
          </p>
        </div>
      </header>

      {/* Enhanced Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.totalCustomers}</p>
                <p className="text-xs text-muted-foreground">Customer POS</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.activeCustomers}</p>
                <p className="text-xs text-muted-foreground">Customer Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Phone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.totalAppUsers}</p>
                <p className="text-xs text-muted-foreground">User App</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.onlineUsers}</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-50 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-pink-600">{stats.totalOrders}</p>
                <p className="text-xs text-muted-foreground">Total Order</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-yellow-600">Rp {stats.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pos-customers" className="w-full">
        <TabsList>
          <TabsTrigger value="pos-customers">Customer POS</TabsTrigger>
          <TabsTrigger value="app-users">User Aplikasi</TabsTrigger>
          <TabsTrigger value="orders">Recent Orders</TabsTrigger>
        </TabsList>

        {/* POS Customers Tab */}
        <TabsContent value="pos-customers" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari nama, telepon, atau alamat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={selectedRider} onValueChange={setSelectedRider}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by rider" />
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
            </div>
            <Button onClick={() => handleExport('pos')} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                Customer POS ({filteredCustomers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || selectedRider !== "all" 
                    ? "Tidak ada pelanggan yang sesuai dengan filter"
                    : "Belum ada pelanggan terdaftar"
                  }
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCustomers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{customer.name}</h3>
                            <Badge variant={customer.is_active ? "default" : "secondary"}>
                              {customer.is_active ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {customer.phone || "-"}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {customer.address || "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium text-sm">{customer.profiles?.full_name}</p>
                        <p className="text-xs text-gray-500">Didaftar oleh</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(customer.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* App Users Tab */}
        <TabsContent value="app-users" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari nama, email, atau telepon..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={() => handleExport('app')} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                User Aplikasi Customer ({filteredCustomerUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredCustomerUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm 
                    ? "Tidak ada user yang sesuai dengan pencarian"
                    : "Belum ada user aplikasi terdaftar"
                  }
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCustomerUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <Phone className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{user.name}</h3>
                            <Badge variant={user.is_online ? "default" : "secondary"}>
                              {user.is_online ? "Online" : "Offline"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email || "-"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.phone || "-"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{user.address || "-"}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{user.points.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Poin</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(user.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Recent Orders ({recentOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Belum ada order dari aplikasi customer
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <ShoppingCart className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{order.customer_users?.name || 'Unknown Customer'}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              order.status === 'completed' ? 'default' :
                              order.status === 'pending' ? 'secondary' :
                              order.status === 'cancelled' ? 'destructive' : 'outline'
                            }>
                              {order.status}
                            </Badge>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(order.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          Rp {order.total_price.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">Total Order</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
