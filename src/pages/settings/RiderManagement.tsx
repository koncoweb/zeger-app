import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Bike, Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Rider {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  is_active: boolean;
  branch_id: string;
  created_at: string;
}

const SettingsRiderManagement = () => {
  const { userProfile } = useAuth();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    role: "rider",
    is_active: true
  });

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .in('role', ['rider', 'bh_rider', 'sb_rider', '2_Hub_Rider', '3_SB_Rider']);

      if (userProfile?.role !== 'ho_admin' && userProfile?.role !== '1_HO_Admin' && userProfile?.role !== 'ho_owner') {
        query = query.eq('branch_id', userProfile?.branch_id);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setRiders(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat data rider: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedRider) {
        // Update rider
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            role: formData.role as any,
            is_active: formData.is_active
          })
          .eq('id', selectedRider.id);
          
        if (error) throw error;
        toast.success("Rider berhasil diperbarui");
      } else {
        // Create new rider - this would require additional user creation logic
        toast.info("Fitur tambah rider baru dalam pengembangan");
      }
      
      setIsDialogOpen(false);
      setSelectedRider(null);
      setFormData({ full_name: "", phone: "", role: "rider", is_active: true });
      fetchRiders();
    } catch (error: any) {
      toast.error("Gagal menyimpan rider: " + error.message);
    }
  };

  const handleEdit = (rider: Rider) => {
    setSelectedRider(rider);
    setFormData({
      full_name: rider.full_name,
      phone: rider.phone,
      role: rider.role,
      is_active: rider.is_active
    });
    setIsDialogOpen(true);
  };

  const filteredRiders = riders.filter(rider =>
    rider.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rider.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bike className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Rider Management</h1>
            <p className="text-muted-foreground">Kelola rider dan pengaturan mereka</p>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedRider(null);
              setFormData({ full_name: "", phone: "", role: "rider", is_active: true });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Rider
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedRider ? 'Edit Rider' : 'Tambah Rider Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Nama Lengkap</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">No. Telepon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rider">Rider</SelectItem>
                    <SelectItem value="bh_rider">Branch Hub Rider</SelectItem>
                    <SelectItem value="sb_rider">Small Branch Rider</SelectItem>
                    <SelectItem value="2_Hub_Rider">Hub Rider</SelectItem>
                    <SelectItem value="3_SB_Rider">SB Rider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>
              <Button type="submit" className="w-full">
                {selectedRider ? 'Perbarui' : 'Tambah'} Rider
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Rider</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari rider..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRiders.map((rider) => (
              <div key={rider.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{rider.full_name}</h3>
                    <Badge variant={rider.is_active ? "default" : "secondary"}>
                      {rider.is_active ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                    <Badge variant="outline">{rider.role}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{rider.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(rider)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredRiders.length === 0 && (
            <div className="text-center py-8">
              <Bike className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Tidak ada rider ditemukan</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsRiderManagement;