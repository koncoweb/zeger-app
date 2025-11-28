import { usePOSAuth } from '@/hooks/usePOSAuth';
import { useInventory } from '@/hooks/useInventory';
import { InventoryList } from '@/components/pos/InventoryList';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function POSInventory() {
  const navigate = useNavigate();
  const { profile } = usePOSAuth();
  const { inventory, loading, error, refreshInventory } = useInventory(profile?.branch_id || null);

  const handleRefresh = async () => {
    try {
      await refreshInventory();
      toast.success('Inventory berhasil diperbarui');
    } catch (err) {
      toast.error('Gagal memperbarui inventory');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-red-600 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/pos-app/dashboard')}
              className="text-white hover:bg-red-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Inventory</h1>
              <p className="text-sm text-red-100">
                {profile?.branch_id ? 'Stok Produk Branch' : 'Tidak ada branch'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
            className="text-white hover:bg-red-700"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p className="font-semibold">Error memuat inventory</p>
            <p className="text-sm">{error.message}</p>
          </div>
        ) : (
          <InventoryList inventory={inventory} loading={loading} />
        )}
      </div>
    </div>
  );
}
