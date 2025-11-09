import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
interface MobileCustomerQuickAddProps {
  onCustomerAdded: () => void;
}
export const MobileCustomerQuickAdd = ({
  onCustomerAdded
}: MobileCustomerQuickAddProps) => {
  const {
    userProfile
  } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nama wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      const {
        data: profile
      } = await supabase.from('profiles').select('id, branch_id').eq('user_id', user.id).maybeSingle();
      if (!profile) return;
      const {
        error
      } = await supabase.from('customers').insert([{
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        rider_id: profile.id,
        branch_id: profile.branch_id,
        is_active: true
      }]);
      if (error) throw error;
      toast.success("Pelanggan berhasil ditambahkan!");
      setFormData({
        name: '',
        phone: ''
      });
      setOpen(false);
      onCustomerAdded();
    } catch (error: any) {
      toast.error("Gagal menambahkan pelanggan: " + error.message);
    } finally {
      setLoading(false);
    }
  };
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        
      </DialogTrigger>
      <DialogContent className="w-80 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Tambah Pelanggan Baru
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customer-name">Nama Pelanggan *</Label>
            <Input id="customer-name" value={formData.name} onChange={e => setFormData(prev => ({
            ...prev,
            name: e.target.value
          }))} placeholder="Masukkan nama pelanggan" className="mt-1" required />
          </div>
          
          <div>
            <Label htmlFor="customer-phone">No. Handphone</Label>
            <Input id="customer-phone" value={formData.phone} onChange={e => setFormData(prev => ({
            ...prev,
            phone: e.target.value
          }))} placeholder="08xxxxxxxxxx (opsional)" className="mt-1" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Batal
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()} className="flex-1">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>;
};