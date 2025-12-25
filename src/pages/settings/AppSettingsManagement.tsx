import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, ArrowLeft, Truck, ShoppingCart, CreditCard, Gift, Package, Palette, Clock, Bell, MapPin, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface AppSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: string;
  description: string;
  is_active: boolean;
}

export default function AppSettingsManagement() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = 'App Settings | Zeger ERP';
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*');
      
      if (error) throw error;
      
      const settingsMap: Record<string, any> = {};
      data?.forEach(s => {
        settingsMap[s.setting_key] = s.setting_value;
      });
      setSettings(settingsMap);
    } catch (error: any) {
      toast.error('Gagal memuat pengaturan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq('setting_key', key);
      
      if (error) throw error;
      
      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('Pengaturan berhasil disimpan');
    } catch (error: any) {
      toast.error('Gagal menyimpan: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Memuat pengaturan...</div>;
  }

  return (
    <main className="space-y-6">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings/app-management')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Pengaturan Aplikasi
          </h1>
          <p className="text-sm text-muted-foreground">
            Konfigurasi fitur-fitur aplikasi customer
          </p>
        </div>
      </header>

      <Tabs defaultValue="delivery" className="space-y-4">
        <TabsList className="grid grid-cols-5 lg:grid-cols-10 gap-2">
          <TabsTrigger value="delivery" className="flex items-center gap-1"><Truck className="w-4 h-4" /><span className="hidden lg:inline">Delivery</span></TabsTrigger>
          <TabsTrigger value="order" className="flex items-center gap-1"><ShoppingCart className="w-4 h-4" /><span className="hidden lg:inline">Order</span></TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-1"><CreditCard className="w-4 h-4" /><span className="hidden lg:inline">Payment</span></TabsTrigger>
          <TabsTrigger value="loyalty" className="flex items-center gap-1"><Gift className="w-4 h-4" /><span className="hidden lg:inline">Loyalty</span></TabsTrigger>
          <TabsTrigger value="product" className="flex items-center gap-1"><Package className="w-4 h-4" /><span className="hidden lg:inline">Product</span></TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-1"><Palette className="w-4 h-4" /><span className="hidden lg:inline">Theme</span></TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-1"><Clock className="w-4 h-4" /><span className="hidden lg:inline">Jam</span></TabsTrigger>
          <TabsTrigger value="notification" className="flex items-center gap-1"><Bell className="w-4 h-4" /><span className="hidden lg:inline">Notif</span></TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-1"><MapPin className="w-4 h-4" /><span className="hidden lg:inline">Map</span></TabsTrigger>
        </TabsList>

        {/* Delivery Settings */}
        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5" /> Pengaturan Delivery</CardTitle>
              <CardDescription>Atur biaya dan estimasi waktu pengiriman</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Biaya Delivery</h4>
                  <div>
                    <Label>Biaya Dasar (Rp)</Label>
                    <Input
                      type="number"
                      value={settings.delivery_fee?.base_fee || 0}
                      onChange={(e) => handleChange('delivery_fee', 'base_fee', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Biaya per KM (Rp)</Label>
                    <Input
                      type="number"
                      value={settings.delivery_fee?.per_km_fee || 0}
                      onChange={(e) => handleChange('delivery_fee', 'per_km_fee', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Min. Order Gratis Ongkir (Rp)</Label>
                    <Input
                      type="number"
                      value={settings.delivery_fee?.free_delivery_min_order || 0}
                      onChange={(e) => handleChange('delivery_fee', 'free_delivery_min_order', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Radius Maksimal Delivery (KM)</Label>
                    <Input
                      type="number"
                      value={settings.delivery_fee?.max_delivery_radius_km || 0}
                      onChange={(e) => handleChange('delivery_fee', 'max_delivery_radius_km', Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Estimasi Waktu</h4>
                  <div>
                    <Label>Waktu Minimum (menit)</Label>
                    <Input
                      type="number"
                      value={settings.delivery_time?.min_minutes || 0}
                      onChange={(e) => handleChange('delivery_time', 'min_minutes', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Waktu Maksimum (menit)</Label>
                    <Input
                      type="number"
                      value={settings.delivery_time?.max_minutes || 0}
                      onChange={(e) => handleChange('delivery_time', 'max_minutes', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Waktu Persiapan (menit)</Label>
                    <Input
                      type="number"
                      value={settings.delivery_time?.preparation_time_minutes || 0}
                      onChange={(e) => handleChange('delivery_time', 'preparation_time_minutes', Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
              <Button onClick={() => { updateSetting('delivery_fee', settings.delivery_fee); updateSetting('delivery_time', settings.delivery_time); }} disabled={saving}>
                <Save className="w-4 h-4 mr-2" /> Simpan Pengaturan Delivery
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order Settings */}
        <TabsContent value="order">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Pengaturan Order</CardTitle>
              <CardDescription>Atur batasan dan opsi pesanan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Batasan Order</h4>
                  <div>
                    <Label>Minimum Order (Rp)</Label>
                    <Input
                      type="number"
                      value={settings.order_settings?.min_order_amount || 0}
                      onChange={(e) => handleChange('order_settings', 'min_order_amount', Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Maksimum Item per Order</Label>
                    <Input
                      type="number"
                      value={settings.order_settings?.max_order_items || 0}
                      onChange={(e) => handleChange('order_settings', 'max_order_items', Number(e.target.value))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Izinkan Catatan</Label>
                    <Switch
                      checked={settings.order_settings?.allow_notes || false}
                      onCheckedChange={(v) => handleChange('order_settings', 'allow_notes', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Wajib Nomor Telepon</Label>
                    <Switch
                      checked={settings.order_settings?.require_phone || false}
                      onCheckedChange={(v) => handleChange('order_settings', 'require_phone', v)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Tipe Order</h4>
                  <div className="flex items-center justify-between">
                    <Label>Outlet Pickup</Label>
                    <Switch
                      checked={settings.order_types?.outlet_pickup || false}
                      onCheckedChange={(v) => handleChange('order_types', 'outlet_pickup', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Outlet Delivery</Label>
                    <Switch
                      checked={settings.order_types?.outlet_delivery || false}
                      onCheckedChange={(v) => handleChange('order_types', 'outlet_delivery', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>On The Wheels</Label>
                    <Switch
                      checked={settings.order_types?.on_the_wheels || false}
                      onCheckedChange={(v) => handleChange('order_types', 'on_the_wheels', v)}
                    />
                  </div>
                </div>
              </div>
              <Button onClick={() => { updateSetting('order_settings', settings.order_settings); updateSetting('order_types', settings.order_types); }} disabled={saving}>
                <Save className="w-4 h-4 mr-2" /> Simpan Pengaturan Order
              </Button>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Payment Settings */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> Metode Pembayaran</CardTitle>
              <CardDescription>Aktifkan atau nonaktifkan metode pembayaran</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Cash</p>
                  <p className="text-sm text-muted-foreground">Pembayaran tunai</p>
                </div>
                <Switch
                  checked={settings.payment_methods?.cash || false}
                  onCheckedChange={(v) => handleChange('payment_methods', 'cash', v)}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">QRIS</p>
                  <p className="text-sm text-muted-foreground">Pembayaran via QRIS</p>
                </div>
                <Switch
                  checked={settings.payment_methods?.qris || false}
                  onCheckedChange={(v) => handleChange('payment_methods', 'qris', v)}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Transfer Bank</p>
                  <p className="text-sm text-muted-foreground">Pembayaran via transfer</p>
                </div>
                <Switch
                  checked={settings.payment_methods?.transfer || false}
                  onCheckedChange={(v) => handleChange('payment_methods', 'transfer', v)}
                />
              </div>
              <Button onClick={() => updateSetting('payment_methods', settings.payment_methods)} disabled={saving}>
                <Save className="w-4 h-4 mr-2" /> Simpan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loyalty Settings */}
        <TabsContent value="loyalty">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Gift className="w-5 h-5" /> Pengaturan Poin Loyalty</CardTitle>
              <CardDescription>Atur sistem poin dan reward</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium">Aktifkan Sistem Poin</p>
                  <p className="text-sm text-muted-foreground">Customer mendapat poin dari setiap pembelian</p>
                </div>
                <Switch
                  checked={settings.points_settings?.enabled || false}
                  onCheckedChange={(v) => handleChange('points_settings', 'enabled', v)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Poin per Rp 1.000</Label>
                  <Input
                    type="number"
                    value={settings.points_settings?.points_per_1000 || 0}
                    onChange={(e) => handleChange('points_settings', 'points_per_1000', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Jumlah poin yang didapat per Rp 1.000 pembelian</p>
                </div>
                <div>
                  <Label>Minimum Redeem (Poin)</Label>
                  <Input
                    type="number"
                    value={settings.points_settings?.min_redeem_points || 0}
                    onChange={(e) => handleChange('points_settings', 'min_redeem_points', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minimum poin untuk ditukar reward</p>
                </div>
                <div>
                  <Label>Masa Berlaku Poin (Hari)</Label>
                  <Input
                    type="number"
                    value={settings.points_settings?.points_expiry_days || 0}
                    onChange={(e) => handleChange('points_settings', 'points_expiry_days', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Poin kadaluarsa setelah X hari</p>
                </div>
              </div>
              <Button onClick={() => updateSetting('points_settings', settings.points_settings)} disabled={saving}>
                <Save className="w-4 h-4 mr-2" /> Simpan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Display Settings */}
        <TabsContent value="product">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5" /> Tampilan Produk</CardTitle>
              <CardDescription>Atur tampilan produk di aplikasi customer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Tampilkan Produk Habis</p>
                  <p className="text-sm text-muted-foreground">Tampilkan produk yang stoknya habis</p>
                </div>
                <Switch
                  checked={settings.product_display?.show_out_of_stock || false}
                  onCheckedChange={(v) => handleChange('product_display', 'show_out_of_stock', v)}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Tampilkan Harga</p>
                  <p className="text-sm text-muted-foreground">Tampilkan harga produk di list</p>
                </div>
                <Switch
                  checked={settings.product_display?.show_price || false}
                  onCheckedChange={(v) => handleChange('product_display', 'show_price', v)}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Tampilkan Deskripsi</p>
                  <p className="text-sm text-muted-foreground">Tampilkan deskripsi singkat produk</p>
                </div>
                <Switch
                  checked={settings.product_display?.show_description || false}
                  onCheckedChange={(v) => handleChange('product_display', 'show_description', v)}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Tampilkan Kategori "Semua"</p>
                  <p className="text-sm text-muted-foreground">Tampilkan tab semua kategori</p>
                </div>
                <Switch
                  checked={settings.product_categories?.show_all_category || false}
                  onCheckedChange={(v) => handleChange('product_categories', 'show_all_category', v)}
                />
              </div>
              <Button onClick={() => { updateSetting('product_display', settings.product_display); updateSetting('product_categories', settings.product_categories); }} disabled={saving}>
                <Save className="w-4 h-4 mr-2" /> Simpan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Settings */}
        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" /> Tema Aplikasi</CardTitle>
              <CardDescription>Kustomisasi tampilan aplikasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nama Aplikasi</Label>
                <Input
                  value={settings.app_theme?.app_name || ''}
                  onChange={(e) => handleChange('app_theme', 'app_name', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Warna Primer</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.app_theme?.primary_color || '#EA2831'}
                      onChange={(e) => handleChange('app_theme', 'primary_color', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.app_theme?.primary_color || '#EA2831'}
                      onChange={(e) => handleChange('app_theme', 'primary_color', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Warna Sekunder</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.app_theme?.secondary_color || '#F8F6F6'}
                      onChange={(e) => handleChange('app_theme', 'secondary_color', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={settings.app_theme?.secondary_color || '#F8F6F6'}
                      onChange={(e) => handleChange('app_theme', 'secondary_color', e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label>URL Logo (opsional)</Label>
                <Input
                  value={settings.app_theme?.logo_url || ''}
                  onChange={(e) => handleChange('app_theme', 'logo_url', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <Button onClick={() => updateSetting('app_theme', settings.app_theme)} disabled={saving}>
                <Save className="w-4 h-4 mr-2" /> Simpan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operating Hours */}
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" /> Jam Operasional</CardTitle>
              <CardDescription>Atur jam buka dan tutup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                const dayNames: Record<string, string> = { monday: 'Senin', tuesday: 'Selasa', wednesday: 'Rabu', thursday: 'Kamis', friday: 'Jumat', saturday: 'Sabtu', sunday: 'Minggu' };
                const dayData = settings.operating_hours?.[day] || { open: '08:00', close: '22:00', is_open: true };
                return (
                  <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={dayData.is_open}
                        onCheckedChange={(v) => {
                          const newHours = { ...settings.operating_hours, [day]: { ...dayData, is_open: v } };
                          setSettings(prev => ({ ...prev, operating_hours: newHours }));
                        }}
                      />
                      <span className="font-medium w-20">{dayNames[day]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={dayData.open}
                        onChange={(e) => {
                          const newHours = { ...settings.operating_hours, [day]: { ...dayData, open: e.target.value } };
                          setSettings(prev => ({ ...prev, operating_hours: newHours }));
                        }}
                        className="w-32"
                        disabled={!dayData.is_open}
                      />
                      <span>-</span>
                      <Input
                        type="time"
                        value={dayData.close}
                        onChange={(e) => {
                          const newHours = { ...settings.operating_hours, [day]: { ...dayData, close: e.target.value } };
                          setSettings(prev => ({ ...prev, operating_hours: newHours }));
                        }}
                        className="w-32"
                        disabled={!dayData.is_open}
                      />
                    </div>
                  </div>
                );
              })}
              <Button onClick={() => updateSetting('operating_hours', settings.operating_hours)} disabled={saving}>
                <Save className="w-4 h-4 mr-2" /> Simpan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notification">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> Pengaturan Notifikasi</CardTitle>
              <CardDescription>Atur notifikasi yang dikirim ke customer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'order_confirmation', label: 'Konfirmasi Pesanan', desc: 'Notifikasi saat pesanan diterima' },
                { key: 'order_status_update', label: 'Update Status Pesanan', desc: 'Notifikasi perubahan status pesanan' },
                { key: 'promo_notification', label: 'Promo & Penawaran', desc: 'Notifikasi promo dan penawaran khusus' },
                { key: 'points_notification', label: 'Poin & Reward', desc: 'Notifikasi poin dan reward' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={settings.notification_settings?.[item.key] || false}
                    onCheckedChange={(v) => handleChange('notification_settings', item.key, v)}
                  />
                </div>
              ))}
              <Button onClick={() => updateSetting('notification_settings', settings.notification_settings)} disabled={saving}>
                <Save className="w-4 h-4 mr-2" /> Simpan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Map Settings */}
        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" /> Pengaturan Peta</CardTitle>
              <CardDescription>Atur lokasi default dan radius pencarian</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Latitude Default</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={settings.map_settings?.default_latitude || 0}
                    onChange={(e) => handleChange('map_settings', 'default_latitude', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Longitude Default</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={settings.map_settings?.default_longitude || 0}
                    onChange={(e) => handleChange('map_settings', 'default_longitude', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Zoom Default</Label>
                  <Input
                    type="number"
                    value={settings.map_settings?.default_zoom || 15}
                    onChange={(e) => handleChange('map_settings', 'default_zoom', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Radius Pencarian Rider (KM)</Label>
                  <Input
                    type="number"
                    value={settings.map_settings?.rider_search_radius_km || 50}
                    onChange={(e) => handleChange('map_settings', 'rider_search_radius_km', Number(e.target.value))}
                  />
                </div>
              </div>
              <Button onClick={() => updateSetting('map_settings', settings.map_settings)} disabled={saving}>
                <Save className="w-4 h-4 mr-2" /> Simpan
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
