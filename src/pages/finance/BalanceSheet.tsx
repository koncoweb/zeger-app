import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export default function BalanceSheet() {
  const [assets, setAssets] = useState(0);
  const [liabilities, setLiabilities] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('financial_transactions')
        .select('transaction_type, amount');
      const list = data || [];
      const assetsVal = list.filter((r: any) => r.transaction_type === 'asset').reduce((a: number, r: any) => a + Number(r.amount || 0), 0);
      const liabVal = list.filter((r: any) => r.transaction_type === 'liability').reduce((a: number, r: any) => a + Number(r.amount || 0), 0);
      setAssets(assetsVal);
      setLiabilities(liabVal);
    };
    load();
  }, []);

  const equity = assets - liabilities;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Neraca</h1>
        <p className="text-muted-foreground">Aset, kewajiban, dan ekuitas</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Aset</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-primary">{currency.format(assets)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Kewajiban</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-warning">{currency.format(liabilities)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Ekuitas</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{currency.format(equity)}</CardContent>
        </Card>
      </div>
    </div>
  );
}
