import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export default function ProfitLoss() {
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Sum revenue from financial_transactions (sales trigger fills this)
      const { data: rev } = await supabase
        .from('financial_transactions')
        .select('amount')
        .eq('transaction_type', 'revenue');

      const { data: ops } = await supabase
        .from('operational_expenses')
        .select('amount');

      const totalRev = (rev || []).reduce((acc: number, r: any) => acc + Number(r.amount || 0), 0);
      const totalExp = (ops || []).reduce((acc: number, r: any) => acc + Number(r.amount || 0), 0);

      setRevenue(totalRev);
      setExpenses(totalExp);
      setLoading(false);
    };
    load();
  }, []);

  const profit = revenue - expenses;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Laporan Laba Rugi</h1>
        <p className="text-muted-foreground">Ringkasan pendapatan dan beban operasional</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Pendapatan</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-primary">{currency.format(revenue)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Beban Operasional</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-warning">{currency.format(expenses)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Laba Bersih</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold {profit>=0 ? 'text-success' : 'text-destructive'}">{currency.format(profit)}</CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Memuat data…</div>
      ) : (
        <div className="text-sm text-muted-foreground">Angka diambil dari transaksi penjualan dan tabel beban operasional.</div>
      )}
    </div>
  );
}
