import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export default function CashFlow() {
  const [loading, setLoading] = useState(true);
  const [cashIn, setCashIn] = useState(0);
  const [cashOut, setCashOut] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('financial_transactions')
        .select('transaction_type, account_type, amount');

      const list = data || [];
      const inVal = list
        .filter((r: any) => r.account_type === 'cash' && (r.transaction_type === 'asset' || r.transaction_type === 'revenue'))
        .reduce((a: number, r: any) => a + Number(r.amount || 0), 0);
      const outVal = list
        .filter((r: any) => r.transaction_type === 'expense')
        .reduce((a: number, r: any) => a + Number(r.amount || 0), 0);

      setCashIn(inVal);
      setCashOut(outVal);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Laporan Arus Kas</h1>
        <p className="text-muted-foreground">Ringkasan kas masuk dan kas keluar</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Kas Masuk</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-success">{currency.format(cashIn)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Kas Keluar</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold text-destructive">{currency.format(cashOut)}</CardContent>
        </Card>
      </div>

      {!loading && (
        <div className="text-sm text-muted-foreground">Arus kas dihitung dari transaksi keuangan (akun kas) dan transaksi beban.</div>
      )}
    </div>
  );
}
