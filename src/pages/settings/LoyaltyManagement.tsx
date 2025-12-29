import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Award, Plus, Pencil, ArrowLeft, Gift, Trash2, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface LoyaltyTier {
  id: string;
  tier_name: string;
  min_points: number;
  discount_percentage: number;
  benefits: any;
  tier_color: string;
  created_at: string;
  updated_at: string;
}

interface LoyaltyReward {
  id: string;
  reward_name: string;
  description: string | null;
  points_required: number;
  reward_type: string;
  reward_value: any;
  image_url: string | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  stock_quantity: number | null;
  created_at: string;
  updated_at: string;
}

interface CustomerLoyalty {
  id: string;
  customer_id: string;
  points_balance: number;
  total_earned_points: number;
  total_redeemed_points: number;
  tier: string;
  profiles: {
    full_name: string;
  };
}

export default function LoyaltyManagement() {
  const navigate = useNavigate();
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [customerLoyalty, setCustomerLoyalty] = useState<CustomerLoyalty[]>([]);
  const [loading, setLoading] = useState(false);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalPointsEarned: 0,
    totalPointsRedeemed: 0,
    activeTiers: 0,
    activeRewards: 0
  });

  const [tierForm, setTierForm] = useState({
    tier_name: '',
    min_points: 0,
    discount_percentage: 0,
    tier_color: '#CD7F32',
    benefits: ''
  });

  const [rewardForm, setRewardForm] = useState({
    reward_name: '',
    description: '',
    points_required: 0,
    reward_type: 'discount',
    reward_value: '',
    image_url: '',
    is_active: true,
    valid_from: '',
    valid_until: '',
    stock_quantity: null as number | null
  });

  useEffect(() => {
    document.title = 'Loyalty Management | Zeger ERP';
    fetchTiers();
    fetchRewards();
    fetchCustomerLoyalty();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from('customer_loyalty')
        .select('points_balance, total_earned_points, total_redeemed_points');
      
      if (loyaltyError) throw loyaltyError;

      const totalCustomers = loyaltyData?.length || 0;
      const totalPointsEarned = loyaltyData?.reduce((sum, c) => sum + c.total_earned_points, 0) || 0;
      const totalPointsRedeemed = loyaltyData?.reduce((sum, c) => sum + c.total_redeemed_points, 0) || 0;

      setStats({
        totalCustomers,
        totalPointsEarned,
        totalPointsRedeemed,
        activeTiers: tiers.length,
        activeRewards: rewards.filter(r => r.is_active).length
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCustomerLoyalty = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_loyalty')
        .select(`
          *,
          profiles!customer_loyalty_customer_id_fkey (
            full_name
          )
        `)
        .order('points_balance', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setCustomerLoyalty(data || []);
    } catch (error: any) {
      toast.error('Gagal memuat data loyalty customer: ' + error.message);
    }
  };

  const fetchTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .order('min_points');
      
      if (error) throw error;
      setTiers(data || []);
    } catch (error: any) {
      toast.error('Gagal memuat tier: ' + error.message);
    }
  };

  const fetchRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .order('points_required');
      
      if (error) throw error;
      setRewards(data || []);
    } catch (error: any) {
      toast.error('Gagal memuat rewards: ' + error.message);
    }
  };

  const fetchCustomerLoyalty = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_loyalty')
        .select(`
          *,
          profiles!customer_loyalty_customer_id_fkey (
            full_name
          )
        `)
        .order('points_balance', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setCustomerLoyalty(data || []);
    } catch (error: any) {
      toast.error('Gagal memuat data loyalty customer: ' + error.message);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: loyaltyData, error: loyaltyError } = await supabase
        .from('customer_loyalty')
        .select('points_balance, total_earned_points, total_redeemed_points');
      
      if (loyaltyError) throw loyaltyError;

      const totalCustomers = loyaltyData?.length || 0;
      const totalPointsEarned = loyaltyData?.reduce((sum, c) => sum + c.total_earned_points, 0) || 0;
      const totalPointsRedeemed = loyaltyData?.reduce((sum, c) => sum + c.total_redeemed_points, 0) || 0;

      setStats({
        totalCustomers,
        totalPointsEarned,
        totalPointsRedeemed,
        activeTiers: tiers.length,
        activeRewards: rewards.filter(r => r.is_active).length
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleTierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tierData = {
        ...tierForm,
        benefits: tierForm.benefits ? JSON.parse(tierForm.benefits) : {}
      };

      if (editingTier) {
        const { error } = await supabase
          .from('loyalty_tiers')
          .update(tierData)
          .eq('id', editingTier.id);

        if (error) throw error;
        toast.success('Tier berhasil diupdate');
      } else {
        const { error } = await supabase
          .from('loyalty_tiers')
          .insert(tierData);

        if (error) throw error;
        toast.success('Tier berhasil ditambahkan');
      }

      setTierDialogOpen(false);
      resetTierForm();
      fetchTiers();
      fetchStats();
    } catch (error: any) {
      toast.error('Gagal menyimpan tier: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRewardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rewardData = {
        ...rewardForm,
        reward_value: rewardForm.reward_value ? JSON.parse(rewardForm.reward_value) : {}
      };

      if (editingReward) {
        const { error } = await supabase
          .from('loyalty_rewards')
          .update(rewardData)
          .eq('id', editingReward.id);

        if (error) throw error;
        toast.success('Reward berhasil diupdate');
      } else {
        const { error } = await supabase
          .from('loyalty_rewards')
          .insert(rewardData);

        if (error) throw error;
        toast.success('Reward berhasil ditambahkan');
      }

      setRewardDialogOpen(false);
      resetRewardForm();
      fetchRewards();
      fetchStats();
    } catch (error: any) {
      toast.error('Gagal menyimpan reward: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTier = (tier: LoyaltyTier) => {
    setEditingTier(tier);
    setTierForm({
      tier_name: tier.tier_name,
      min_points: tier.min_points,
      discount_percentage: tier.discount_percentage,
      tier_color: tier.tier_color,
      benefits: JSON.stringify(tier.benefits, null, 2)
    });
    setTierDialogOpen(true);
  };

  const handleEditReward = (reward: LoyaltyReward) => {
    setEditingReward(reward);
    setRewardForm({
      reward_name: reward.reward_name,
      description: reward.description || '',
      points_required: reward.points_required,
      reward_type: reward.reward_type,
      reward_value: JSON.stringify(reward.reward_value, null, 2),
      image_url: reward.image_url || '',
      is_active: reward.is_active,
      valid_from: reward.valid_from || '',
      valid_until: reward.valid_until || '',
      stock_quantity: reward.stock_quantity
    });
    setRewardDialogOpen(true);
  };

  const handleDeleteTier = async (id: string) => {
    if (!confirm('Yakin ingin menghapus tier ini?')) return;

    try {
      const { error } = await supabase
        .from('loyalty_tiers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Tier berhasil dihapus');
      fetchTiers();
      fetchStats();
    } catch (error: any) {
      toast.error('Gagal menghapus tier: ' + error.message);
    }
  };

  const handleDeleteReward = async (id: string) => {
    if (!confirm('Yakin ingin menghapus reward ini?')) return;

    try {
      const { error } = await supabase
        .from('loyalty_rewards')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Reward berhasil dihapus');
      fetchRewards();
      fetchStats();
    } catch (error: any) {
      toast.error('Gagal menghapus reward: ' + error.message);
    }
  };

  const resetTierForm = () => {
    setTierForm({
      tier_name: '',
      min_points: 0,
      discount_percentage: 0,
      tier_color: '#CD7F32',
      benefits: ''
    });
    setEditingTier(null);
  };

  const resetRewardForm = () => {
    setRewardForm({
      reward_name: '',
      description: '',
      points_required: 0,
      reward_type: 'discount',
      reward_value: '',
      image_url: '',
      is_active: true,
      valid_from: '',
      valid_until: '',
      stock_quantity: null
    });
    setEditingReward(null);
  };

  return (
    <main className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings/app-management')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6" />
            Loyalty Management
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Kelola tier loyalty dan reward points untuk customer
        </p>
      </header>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.totalCustomers}</p>
                <p className="text-xs text-muted-foreground">Total Customer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.totalPointsEarned.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Poin Terkumpul</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Gift className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.totalPointsRedeemed.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Poin Ditukar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.activeTiers}</p>
                <p className="text-xs text-muted-foreground">Tier Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-50 rounded-lg">
                <Gift className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-pink-600">{stats.activeRewards}</p>
                <p className="text-xs text-muted-foreground">Reward Aktif</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tiers" className="w-full">
        <TabsList>
          <TabsTrigger value="tiers">Loyalty Tiers</TabsTrigger>
          <TabsTrigger value="rewards">Rewards Catalog</TabsTrigger>
          <TabsTrigger value="customers">Top Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="tiers" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={tierDialogOpen} onOpenChange={(open) => {
              setTierDialogOpen(open);
              if (!open) resetTierForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Tier
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingTier ? 'Edit Tier' : 'Tambah Tier Baru'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleTierSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nama Tier</Label>
                    <Input
                      value={tierForm.tier_name}
                      onChange={(e) => setTierForm({ ...tierForm, tier_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Minimal Points</Label>
                    <Input
                      type="number"
                      value={tierForm.min_points}
                      onChange={(e) => setTierForm({ ...tierForm, min_points: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Diskon (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={tierForm.discount_percentage}
                      onChange={(e) => setTierForm({ ...tierForm, discount_percentage: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Warna Tier</Label>
                    <Input
                      type="color"
                      value={tierForm.tier_color}
                      onChange={(e) => setTierForm({ ...tierForm, tier_color: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Benefits (JSON)</Label>
                    <Textarea
                      value={tierForm.benefits}
                      onChange={(e) => setTierForm({ ...tierForm, benefits: e.target.value })}
                      placeholder='{"description": "Benefits description", "free_delivery": true}'
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setTierDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((tier) => (
              <Card key={tier.id} className="border-2" style={{ borderColor: tier.tier_color }}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tier.tier_color }} />
                      <CardTitle className="text-base">{tier.tier_name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEditTier(tier)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteTier(tier.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm"><strong>Min Points:</strong> {tier.min_points.toLocaleString()}</p>
                  <p className="text-sm"><strong>Diskon:</strong> {tier.discount_percentage}%</p>
                  {tier.benefits?.description && (
                    <p className="text-xs text-muted-foreground">{tier.benefits.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={rewardDialogOpen} onOpenChange={(open) => {
              setRewardDialogOpen(open);
              if (!open) resetRewardForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Reward
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingReward ? 'Edit Reward' : 'Tambah Reward Baru'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleRewardSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nama Reward</Label>
                    <Input
                      value={rewardForm.reward_name}
                      onChange={(e) => setRewardForm({ ...rewardForm, reward_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Deskripsi</Label>
                    <Input
                      value={rewardForm.description}
                      onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Points Required</Label>
                      <Input
                        type="number"
                        value={rewardForm.points_required}
                        onChange={(e) => setRewardForm({ ...rewardForm, points_required: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipe Reward</Label>
                      <Select value={rewardForm.reward_type} onValueChange={(v) => setRewardForm({ ...rewardForm, reward_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discount">Diskon</SelectItem>
                          <SelectItem value="product">Produk Gratis</SelectItem>
                          <SelectItem value="voucher">Voucher</SelectItem>
                          <SelectItem value="cashback">Cashback</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Stock (Optional)</Label>
                      <Input
                        type="number"
                        value={rewardForm.stock_quantity || ''}
                        onChange={(e) => setRewardForm({ ...rewardForm, stock_quantity: e.target.value ? parseInt(e.target.value) : null })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch
                          checked={rewardForm.is_active}
                          onCheckedChange={(checked) => setRewardForm({ ...rewardForm, is_active: checked })}
                        />
                        <Label>Aktif</Label>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Berlaku Dari</Label>
                      <Input
                        type="date"
                        value={rewardForm.valid_from}
                        onChange={(e) => setRewardForm({ ...rewardForm, valid_from: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Berlaku Sampai</Label>
                      <Input
                        type="date"
                        value={rewardForm.valid_until}
                        onChange={(e) => setRewardForm({ ...rewardForm, valid_until: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Reward Value (JSON)</Label>
                    <Textarea
                      value={rewardForm.reward_value}
                      onChange={(e) => setRewardForm({ ...rewardForm, reward_value: e.target.value })}
                      placeholder='{"discount": 20000} or {"product_id": "xxx"}'
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input
                      value={rewardForm.image_url}
                      onChange={(e) => setRewardForm({ ...rewardForm, image_url: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={rewardForm.is_active}
                      onCheckedChange={(checked) => setRewardForm({ ...rewardForm, is_active: checked })}
                    />
                    <Label>Aktif</Label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setRewardDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rewards.map((reward) => (
              <Card key={reward.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5" />
                      <CardTitle className="text-base">{reward.reward_name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEditReward(reward)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteReward(reward.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {reward.image_url && (
                    <img src={reward.image_url} alt={reward.reward_name} className="w-full h-32 object-cover rounded" />
                  )}
                  <p className="text-sm">{reward.description}</p>
                  <p className="text-sm font-bold text-primary">{reward.points_required.toLocaleString()} Points</p>
                  <div className="flex items-center justify-between">
                    <Badge variant={reward.is_active ? "default" : "secondary"}>
                      {reward.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                    <Badge variant="outline">{reward.reward_type}</Badge>
                  </div>
                  {reward.stock_quantity && (
                    <p className="text-xs text-muted-foreground">Stock: {reward.stock_quantity}</p>
                  )}
                  {reward.valid_until && (
                    <p className="text-xs text-muted-foreground">
                      Berlaku sampai: {new Date(reward.valid_until).toLocaleDateString('id-ID')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Top Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Customer Loyalty</CardTitle>
            </CardHeader>
            <CardContent>
              {customerLoyalty.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada data customer loyalty
                </div>
              ) : (
                <div className="space-y-4">
                  {customerLoyalty.map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">#{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="font-medium">{customer.profiles?.full_name || 'Unknown'}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Tier: <Badge variant="outline">{customer.tier}</Badge></span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{customer.points_balance.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Poin Saat Ini</p>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                          <span>Earned: {customer.total_earned_points.toLocaleString()}</span>
                          <span>Redeemed: {customer.total_redeemed_points.toLocaleString()}</span>
                        </div>
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
