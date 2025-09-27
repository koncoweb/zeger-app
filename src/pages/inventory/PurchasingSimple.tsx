import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Package2, Plus, ShoppingCart, CheckCircle } from "lucide-react";

interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  cost_price?: number;
}

interface PurchaseItem {
  product_id: string;
  quantity: number;
  cost_per_unit: number;
  total_cost: number;
}

export default function PurchasingSimple() {
  const { userProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [supplierName, setSupplierName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
    setLoading(false);
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat data produk: " + error.message);
    }
  };

  const addPurchaseItem = () => {
    setPurchaseItems([...purchaseItems, {
      product_id: "",
      quantity: 1,
      cost_per_unit: 0,
      total_cost: 0
    }]);
  };

  const updatePurchaseItem = (index: number, field: string, value: any) => {
    const updatedItems = [...purchaseItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Calculate total cost when quantity or cost per unit changes
    if (field === 'quantity' || field === 'cost_per_unit') {
      updatedItems[index].total_cost = updatedItems[index].quantity * updatedItems[index].cost_per_unit;
    }

    setPurchaseItems(updatedItems);
  };

  const removePurchaseItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return purchaseItems.reduce((sum, item) => sum + item.total_cost, 0);
  };

  const handleSubmit = async () => {
    if (!supplierName.trim()) {
      toast.error("Nama supplier harus diisi");
      return;
    }

    if (purchaseItems.length === 0) {
      toast.error("Tambahkan minimal 1 item pembelian");
      return;
    }

    const invalidItems = purchaseItems.filter(item => 
      !item.product_id || item.quantity <= 0 || item.cost_per_unit <= 0
    );

    if (invalidItems.length > 0) {
      toast.error("Semua item harus memiliki produk, quantity, dan harga yang valid");
      return;
    }

    setSubmitting(true);
    try {
      // For demo purposes, just show success message
      toast.success("Pembelian berhasil dicatat! (Demo mode - database akan diperbarui setelah migration selesai)");
      
      // Reset form
      setSupplierName("");
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setNotes("");
      setPurchaseItems([]);
      
    } catch (error: any) {
      toast.error("Gagal mencatat pembelian: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Purchasing</h1>
            <p className="text-muted-foreground">Catat pembelian barang masuk untuk small branch</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Form Pembelian</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Purchase Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier">Nama Supplier</Label>
              <Input
                id="supplier"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Masukkan nama supplier"
                required
              />
            </div>
            <div>
              <Label htmlFor="purchase-date">Tanggal Pembelian</Label>
              <Input
                id="purchase-date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan..."
              rows={2}
            />
          </div>

          {/* Purchase Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-medium">Item Pembelian</Label>
              <Button variant="outline" size="sm" onClick={addPurchaseItem}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Item
              </Button>
            </div>

            <div className="space-y-4">
              {purchaseItems.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-4 gap-4 items-end">
                    <div>
                      <Label>Produk</Label>
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => updatePurchaseItem(index, 'product_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih produk" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updatePurchaseItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div>
                      <Label>Harga per Unit</Label>
                      <Input
                        type="number"
                        min="0"
                        value={item.cost_per_unit}
                        onChange={(e) => updatePurchaseItem(index, 'cost_per_unit', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div>
                      <Label>Total</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={formatCurrency(item.total_cost)}
                          readOnly
                          className="font-medium"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removePurchaseItem(index)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {purchaseItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada item pembelian. Klik "Tambah Item" untuk menambah produk.
              </div>
            )}
          </div>

          {/* Total */}
          {purchaseItems.length > 0 && (
            <Card className="p-4 bg-muted">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Total Pembelian:</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan Pembelian"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Purchases List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Riwayat Pembelian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Fitur riwayat pembelian akan tersedia setelah migration database selesai.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}