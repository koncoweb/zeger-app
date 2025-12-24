import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Image, Plus, Pencil, Trash2, ArrowLeft, ExternalLink, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Banner {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  display_order: number;
  valid_from: string | null;
  valid_until: string | null;
}

// Navigation options for customer app
const NAVIGATION_OPTIONS = [
  { value: 'none', label: 'Tidak ada navigasi', description: 'Banner hanya untuk tampilan' },
  { value: 'menu', label: 'Menu Produk', description: 'Halaman daftar produk dan menu' },
  { value: 'vouchers', label: 'Voucher', description: 'Halaman voucher customer' },
  { value: 'loyalty', label: 'Program Loyalty', description: 'Halaman poin dan rewards' },
  { value: 'outlets', label: 'Pilih Outlet', description: 'Halaman daftar outlet' },
  { value: 'promo-reward', label: 'Promo & Reward', description: 'Halaman promo dan hadiah' },
  { value: 'orders', label: 'Pesanan', description: 'Halaman riwayat pesanan' },
  { value: 'profile', label: 'Profil', description: 'Halaman profil customer' },
  { value: 'map', label: 'Peta Delivery', description: 'Halaman peta untuk delivery' }
];

const getNavigationLabel = (value: string | null) => {
  if (!value || value === 'none') return 'Tidak ada navigasi';
  const option = NAVIGATION_OPTIONS.find(opt => opt.value === value);
  return option ? option.label : value;
};

export default function PromoBannerManagement() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    is_active: true,
    display_order: 0,
    valid_from: '',
    valid_until: ''
  });
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);


  useEffect(() => {
    document.title = 'Promo Banner Management | Zeger ERP';
    fetchBanners();
    checkStorageBucket();
  }, []);

  const checkStorageBucket = async () => {
    try {
      // Check if promo-banners bucket exists and is accessible
      const { data, error } = await supabase.storage.from('promo-banners').list('', { limit: 1 });
      if (error && error.message.includes('not found')) {
        console.log('Storage bucket may need setup. Please ensure "promo-banners" bucket exists in Supabase Storage.');
      }
    } catch (error) {
      console.log('Storage check:', error);
    }
  };

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('*')
        .order('display_order');
      
      if (error) throw error;
      setBanners(data || []);
    } catch (error: any) {
      toast.error('Gagal memuat banner: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('File harus berupa gambar');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const uploadImage = async () => {
    if (!selectedFile) return null;
    
    setUploading(true);
    try {
      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      console.log('Uploading file:', fileName, 'Size:', selectedFile.size);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('promo-banners')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data } = supabase.storage
        .from('promo-banners')
        .getPublicUrl(fileName);

      console.log('Public URL:', data.publicUrl);
      toast.success('Gambar berhasil diupload');
      return data.publicUrl;
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error('Gagal upload gambar: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // Upload image if file is selected
      let imageUrl = formData.image_url;
      if (selectedFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          throw new Error('Gagal upload gambar');
        }
      }

      const bannerData = {
        ...formData,
        image_url: imageUrl
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('promo_banners')
          .update({
            ...bannerData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingBanner.id);

        if (error) throw error;
        toast.success('Banner berhasil diupdate');
      } else {
        const { error } = await supabase
          .from('promo_banners')
          .insert({
            ...bannerData,
            created_by: profile?.id
          });

        if (error) throw error;
        toast.success('Banner berhasil ditambahkan');
      }

      setDialogOpen(false);
      resetForm();
      fetchBanners();
    } catch (error: any) {
      toast.error('Gagal menyimpan banner: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus banner ini?')) return;

    try {
      const { error } = await supabase
        .from('promo_banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Banner berhasil dihapus');
      fetchBanners();
    } catch (error: any) {
      toast.error('Gagal menghapus banner: ' + error.message);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      is_active: banner.is_active,
      display_order: banner.display_order,
      valid_from: banner.valid_from || '',
      valid_until: banner.valid_until || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    // Auto-increment display_order for new banners
    const maxOrder = banners.length > 0 ? Math.max(...banners.map(b => b.display_order)) : 0;
    
    setFormData({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      is_active: true,
      display_order: maxOrder + 1,
      valid_from: '',
      valid_until: ''
    });
    setEditingBanner(null);
    setSelectedFile(null);
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      const { error } = await supabase
        .from('promo_banners')
        .update({ is_active: !banner.is_active })
        .eq('id', banner.id);

      if (error) throw error;
      toast.success(`Banner ${!banner.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
      fetchBanners();
    } catch (error: any) {
      toast.error('Gagal mengubah status banner: ' + error.message);
    }
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
              <Image className="w-6 h-6" />
              Promo Banner Management
            </h1>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Kelola banner promosi yang ditampilkan di aplikasi customer
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Total: {banners.length} banner</span>
              <span>Aktif: {banners.filter(b => b.is_active).length} banner</span>
              <span>Dengan navigasi: {banners.filter(b => b.link_url).length} banner</span>
            </div>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? 'Edit Banner' : 'Tambah Banner Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Judul Banner</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Gambar Banner</Label>
                
                {/* File Upload Section */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Upload gambar baru
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          PNG, JPG, JPEG hingga 5MB. Ukuran optimal: 800x300px
                        </span>
                      </label>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      Pilih File
                    </Button>
                  </div>
                </div>

                {/* Selected File Preview */}
                {selectedFile && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <Image className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">{selectedFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Manual URL Input (Alternative) */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-500">Atau masukkan URL gambar manual:</Label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/banner.jpg"
                    disabled={!!selectedFile}
                  />
                </div>

                {/* Image Preview */}
                {(formData.image_url || selectedFile) && (
                  <div className="relative">
                    <img 
                      src={selectedFile ? URL.createObjectURL(selectedFile) : formData.image_url} 
                      alt="Preview" 
                      className="w-full h-32 object-cover rounded" 
                    />
                    {/* Preview click indicator */}
                    {formData.link_url && formData.link_url !== 'none' && (
                      <div className="absolute top-2 right-2 bg-black/20 rounded-full p-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                    )}
                    {/* Preview navigation overlay */}
                    {formData.link_url && formData.link_url !== 'none' && (
                      <div className="absolute bottom-2 left-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        Preview: Klik → {getNavigationLabel(formData.link_url)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tujuan Navigasi (Optional)</Label>
                <Select 
                  value={formData.link_url || 'none'} 
                  onValueChange={(value) => setFormData({ ...formData, link_url: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tujuan navigasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {NAVIGATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Pilih halaman yang akan dibuka ketika banner diklik di aplikasi customer
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Urutan Tampil</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Aktif</Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Berlaku Dari</Label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Berlaku Sampai</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={loading || uploading}>
                  {uploading ? 'Mengupload...' : loading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </header>





      {loading && banners.length === 0 ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {banners.map((banner) => (
            <Card key={banner.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{banner.title}</CardTitle>
                    {banner.description && (
                      <p className="text-sm text-muted-foreground">{banner.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(banner)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(banner.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <img src={banner.image_url} alt={banner.title} className="w-full h-40 object-cover rounded" />
                  {/* Click indicator for banners with navigation */}
                  {banner.link_url && banner.link_url !== 'none' && (
                    <div className="absolute top-2 right-2 bg-black/20 rounded-full p-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    </div>
                  )}
                  {/* Navigation overlay */}
                  {banner.link_url && banner.link_url !== 'none' && (
                    <div className="absolute bottom-2 left-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      Klik → {getNavigationLabel(banner.link_url)}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Order: {banner.display_order}</span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={banner.is_active}
                        onCheckedChange={() => handleToggleActive(banner)}
                      />
                      <span className="text-sm">{banner.is_active ? 'Aktif' : 'Nonaktif'}</span>
                    </div>
                  </div>
                  
                  {/* Navigation Info */}
                  <div className="flex items-center gap-2">
                    {banner.link_url && banner.link_url !== 'none' ? (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {getNavigationLabel(banner.link_url)}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Tidak ada navigasi
                      </Badge>
                    )}
                  </div>
                </div>
                {banner.valid_until && (
                  <p className="text-xs text-muted-foreground">
                    Berlaku sampai: {new Date(banner.valid_until).toLocaleDateString('id-ID')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
