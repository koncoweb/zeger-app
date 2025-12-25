import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Ticket, Plus, Pencil, Trash2, ArrowLeft, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Voucher {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed' | 'shipping';
  discount_value: number;
  min_order: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Persentase (%)', description: 'Diskon berdasarkan persentase' },
  { value: 'fixed', label: 'Nominal (Rp)', description: 'Diskon dengan nominal tetap' },
  { value: 'shipping', label: 'Gratis Ongkir', description: 'Gratis biaya pengiriman' }
];

export default function VoucherManagement() {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed' | 'shipping',
    discount_value: 0,
    min_order: 0,
    valid_from: '',
    valid_until: '',
    is_active: true
  });

  useEffect(() => {
    document.title = 'Voucher Management | Zeger ERP';
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_vouchers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setVouchers(data || []);
    } catch (error: any) {
      toast.error('Gagal memuat voucher: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_order: 0,
      valid_from: '',
      valid_until: '',
      is_active: true
    });
    setEditingVoucher(null);
  };

  const handleEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code,
      description: voucher.description,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value,
      min_order: voucher.min_order || 0,
      valid_from: voucher.valid_from,
      valid_until: voucher.valid_until,
      is_active: voucher.is_active
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.description || !formData.valid_from || !formData.valid_until) {
      toast.error('Mohon lengkapi semua field yang wajib');
      return;
    }

    setLoading(true);
    try {
      if (editingVoucher) {
        const { error } = await supabase
          .from('customer_vouchers')
          .update({
            code: formData.code.toUpperCase(),
            description: formData.description,
            discount_type: formData.discount_type,
            discount_value: formData.discount_value,
            min_order: formData.min_order,
            valid_from: formData.valid_from,
            valid_until: formData.valid_until,
            is_active: formData.is_active
          })
          .eq('id', editingVoucher.id);

        if (error) throw error;
        toast.success('Voucher berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('customer_vouchers')
          .insert({
            code: formData.code.toUpperCase(),
            description: formData.description,
            discount_type: formData.discount_type,
            discount_value: formData.discount_value,
            min_order: formData.min_order,
            valid_from: formData.valid_from,
            valid_until: formData.valid_until,
            is_active: formData.is_active
          });

        if (error) throw error;
        toast.success('Voucher berhasil ditambahkan');
      }

      setDialogOpen(false);
      resetForm();
      fetchVouchers();
    } catch (error: any) {
      toast.error('Gagal menyimpan voucher: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus voucher ini?')) return;

    try {
      const { error } = await supabase
        .from('customer_vouchers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Voucher berhasil dihapus');
      fetchVouchers();
    } catch (error: any) {
      toast.error('Gagal menghapus voucher: ' + error.message);
    }
  };

  const handleToggleActive = async (voucher: Voucher) => {
    try {
      const { error } = await supabase
        .from('customer_vouchers')
        .update({ is_active: !voucher.is_active })
        .eq('id', voucher.id);

      if (error) throw error;
      toast.success(`Voucher ${!voucher.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
      fetchVouchers();
    } catch (error: any) {
      toast.error('Gagal mengubah status: ' + error.message);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

  const getDiscountDisplay = (voucher: Voucher) => {
    switch (voucher.discount_type) {
      case 'percentage':
        return `${voucher.discount_value}%`;
      case 'fixed':
        return formatCurrency(voucher.discount_value);
      case 'shipping':
        return 'Gratis Ongkir';
      default:
        return '-';
    }
  };

  const isExpired = (date: string) => new Date(date) < new Date();
  const isUpcoming = (date: string) => new Date(date) > new Date();

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings/app-management')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Ticket className="w-6 h-6" />
              Voucher Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Kelola voucher dan kupon diskon untuk customer
            </p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Tambah Voucher</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingVoucher ? 'Edit Voucher' : 'Tambah Voucher Baru'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Kode Voucher *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="DISKON20"
                  className="uppercase"
                />
              </div>

              <div>
                <Label>Deskripsi *</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Diskon 20% untuk semua produk"
                />
              </div>

              <div>
                <Label>Tipe Diskon</Label>
                <Select value={formData.discount_type} onValueChange={(v: any) => setFormData({ ...formData, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DISCOUNT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.discount_type !== 'shipping' && (
                <div>
                  <Label>Nilai Diskon {formData.discount_type === 'percentage' ? '(%)' : '(Rp)'}</Label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    placeholder={formData.discount_type === 'percentage' ? '20' : '10000'}
                  />
                </div>
              )}

              <div>
                <Label>Minimum Order (Rp)</Label>
                <Input
                  type="number"
                  value={formData.min_order}
                  onChange={(e) => setFormData({ ...formData, min_order: Number(e.target.value) })}
                  placeholder="50000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Berlaku Dari *</Label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Berlaku Sampai *</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label>Status Aktif</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <Button onClick={handleSubmit} className="w-full" disabled={loading}>
                {loading ? 'Menyimpan...' : (editingVoucher ? 'Simpan Perubahan' : 'Tambah Voucher')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{vouchers.length}</div>
            <p className="text-xs text-muted-foreground">Total Voucher</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{vouchers.filter(v => v.is_active && !isExpired(v.valid_until)).length}</div>
            <p className="text-xs text-muted-foreground">Voucher Aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{vouchers.filter(v => isUpcoming(v.valid_from)).length}</div>
            <p className="text-xs text-muted-foreground">Akan Datang</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{vouchers.filter(v => isExpired(v.valid_until)).length}</div>
            <p className="text-xs text-muted-foreground">Kadaluarsa</p>
          </CardContent>
        </Card>
      </div>

      {/* Voucher List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Voucher</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Memuat...</div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Belum ada voucher</div>
          ) : (
            <div className="space-y-4">
              {vouchers.map((voucher) => (
                <div key={voucher.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <Ticket className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg">{voucher.code}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(voucher.code)}>
                          {copiedCode === voucher.code ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                        </Button>
                        {voucher.is_active && !isExpired(voucher.valid_until) ? (
                          <Badge className="bg-green-100 text-green-700">Aktif</Badge>
                        ) : isExpired(voucher.valid_until) ? (
                          <Badge variant="destructive">Kadaluarsa</Badge>
                        ) : (
                          <Badge variant="secondary">Nonaktif</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{voucher.description}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Diskon: <strong>{getDiscountDisplay(voucher)}</strong></span>
                        <span>Min. Order: {formatCurrency(voucher.min_order)}</span>
                        <span>Berlaku: {voucher.valid_from} s/d {voucher.valid_until}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={voucher.is_active} onCheckedChange={() => handleToggleActive(voucher)} />
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(voucher)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(voucher.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
